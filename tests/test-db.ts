import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/server/db/schema';

export function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  // Create tables in memory
  sqlite.exec(`
    CREATE TABLE teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'COACH' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE athletes (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      athlete_code TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      start_date TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE UNIQUE INDEX uq_team_athlete_code ON athletes(team_id, athlete_code);
    CREATE INDEX idx_athletes_team_status ON athletes(team_id, status);

    CREATE TABLE training_sessions (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE INDEX idx_sessions_team_date ON training_sessions(team_id, date);

    CREATE TABLE attendances (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      checked_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      checked_by TEXT NOT NULL REFERENCES users(id),
      notes TEXT
    );
    CREATE UNIQUE INDEX uq_session_athlete ON attendances(session_id, athlete_id);
    CREATE INDEX idx_attendances_athlete ON attendances(athlete_id);
    CREATE INDEX idx_attendances_session ON attendances(session_id);

    CREATE TABLE attendance_logs (
      id TEXT PRIMARY KEY,
      attendance_id TEXT NOT NULL REFERENCES attendances(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      previous_status TEXT NOT NULL,
      new_status TEXT NOT NULL,
      changed_by TEXT NOT NULL REFERENCES users(id),
      changed_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      reason TEXT
    );
    CREATE INDEX idx_logs_attendance ON attendance_logs(attendance_id);
    CREATE INDEX idx_logs_athlete ON attendance_logs(athlete_id);
  `);

  return drizzle(sqlite, { schema });
}

