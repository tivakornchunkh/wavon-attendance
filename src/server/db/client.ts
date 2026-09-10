import Database from 'better-sqlite3';
import { drizzle as drizzleBetterSqlite, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { createClient } from '@libsql/client/web';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

function resolveDbPath(): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('libsql:') && !process.env.DATABASE_URL.startsWith('https:')) {
    return process.env.DATABASE_URL;
  }
  // Render persistent disk standard mount directories (/var/data or /data)
  if (fs.existsSync('/var/data')) {
    const renderDiskDb = '/var/data/sqlite.db';
    const localDb = path.join(process.cwd(), 'sqlite.db');
    if (!fs.existsSync(renderDiskDb) && fs.existsSync(localDb)) {
      try {
        fs.copyFileSync(localDb, renderDiskDb);
      } catch (err) {
        console.error('Failed to copy initial sqlite.db to /var/data:', err);
      }
    }
    return renderDiskDb;
  }
  if (fs.existsSync('/data')) {
    const dataDiskDb = '/data/sqlite.db';
    const localDb = path.join(process.cwd(), 'sqlite.db');
    if (!fs.existsSync(dataDiskDb) && fs.existsSync(localDb)) {
      try {
        fs.copyFileSync(localDb, dataDiskDb);
      } catch (err) {
        console.error('Failed to copy initial sqlite.db to /data:', err);
      }
    }
    return dataDiskDb;
  }
  return path.join(process.cwd(), 'sqlite.db');
}

const isLibsql = Boolean(
  process.env.TURSO_DATABASE_URL ||
    (process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.startsWith('libsql:') || process.env.DATABASE_URL.startsWith('https:')))
);

let initPromise: Promise<void> | null = null;

export async function ensureDbReady(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    if (isLibsql) {
      const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
      if (!url) return;
      const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;
      const client = createClient({ url, authToken });

      try {
        await client.executeMultiple(`
          CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            permanent_qr_token TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'USER',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS athletes (
            id TEXT PRIMARY KEY,
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            athlete_code TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            start_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS training_sessions (
            id TEXT PRIMARY KEY,
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            created_by TEXT REFERENCES users(id),
            is_closed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS recurring_schedules (
            id TEXT PRIMARY KEY,
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            days_of_week TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            title TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS attendances (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
            athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            checked_by TEXT REFERENCES users(id),
            notes TEXT
          );
          CREATE TABLE IF NOT EXISTS attendance_logs (
            id TEXT PRIMARY KEY,
            attendance_id TEXT NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
            session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
            athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            changed_by TEXT REFERENCES users(id),
            changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reason TEXT
          );
          CREATE TABLE IF NOT EXISTS feedbacks (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            user_name TEXT,
            user_contact TEXT,
            category TEXT NOT NULL DEFAULT 'BUG',
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            device_info TEXT,
            status TEXT NOT NULL DEFAULT 'PENDING',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
          CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);
        `);
      } catch (err) {
        console.error('Remote DB table initialization check:', err);
      }

      // Explicit schema migrations on existing tables in remote Turso
      try {
        await client.execute('ALTER TABLE teams ADD COLUMN permanent_qr_token TEXT');
      } catch {
        // Ignored if column already exists
      }

      try {
        await client.execute('ALTER TABLE training_sessions ADD COLUMN is_closed INTEGER NOT NULL DEFAULT 0');
      } catch {
        // Ignored if column already exists
      }
    }
  })();

  return initPromise;
}

export function createDbConnection(customPath?: string) {
  if (isLibsql && !customPath) {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL!;
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;
    const client = createClient({ url, authToken });

    // Kick off remote schema preparation
    ensureDbReady().catch((err) => {
      console.error('ensureDbReady background error:', err);
    });

    return drizzleLibsql(client, { schema }) as unknown as BetterSQLite3Database<typeof schema>;
  }

  const dbPath = customPath || resolveDbPath();
  const sqlite = new Database(dbPath, { timeout: 10000 });
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');

  try {
    const cols = sqlite.pragma('table_info(training_sessions)') as { name: string }[];
    if (cols && !cols.some((c) => c.name === 'is_closed')) {
      sqlite.exec('ALTER TABLE training_sessions ADD COLUMN is_closed INTEGER DEFAULT 0 NOT NULL');
    }
  } catch {}

  try {
    const teamCols = sqlite.pragma('table_info(teams)') as { name: string }[];
    if (teamCols && !teamCols.some((c) => c.name === 'permanent_qr_token')) {
      sqlite.exec('ALTER TABLE teams ADD COLUMN permanent_qr_token TEXT');
    }
  } catch {}

  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS recurring_schedules (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        days_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        title TEXT NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_recurring_team ON recurring_schedules(team_id);
    `);
  } catch {}

  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        user_contact TEXT,
        category TEXT NOT NULL DEFAULT 'BUG',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        device_info TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
      CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);
    `);
  } catch {}

  return drizzleBetterSqlite(sqlite, { schema });
}

export const db = createDbConnection();
export type DatabaseInstance = ReturnType<typeof createDbConnection>;

