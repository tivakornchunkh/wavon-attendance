import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'sqlite.db');

export function createDbConnection(customPath?: string) {
  const sqlite = new Database(customPath || dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

export const db = createDbConnection();
export type DatabaseInstance = ReturnType<typeof createDbConnection>;

