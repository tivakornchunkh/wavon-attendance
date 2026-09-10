import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'sqlite.db');

export function createDbConnection(customPath?: string) {
  const sqlite = new Database(customPath || dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  try {
    const cols = sqlite.pragma('table_info(training_sessions)') as { name: string }[];
    if (cols && !cols.some((c) => c.name === 'is_closed')) {
      sqlite.exec('ALTER TABLE training_sessions ADD COLUMN is_closed INTEGER DEFAULT 0 NOT NULL');
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

  return drizzle(sqlite, { schema });
}

export const db = createDbConnection();
export type DatabaseInstance = ReturnType<typeof createDbConnection>;

