import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/server/db/schema';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { AthleteService } from '../src/core/services/athlete.service';

function createTestDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');

  sqlite.exec(`
    CREATE TABLE teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE athletes (
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
    CREATE TABLE training_sessions (
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
    CREATE TABLE attendances (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checked_by TEXT REFERENCES users(id),
      notes TEXT
    );
    CREATE TABLE attendance_logs (
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
  `);

  return drizzle(sqlite, { schema });
}

describe('Athlete Management & Inactive Filtering (v2.2.0)', () => {
  let db: ReturnType<typeof createTestDb>;
  let athleteRepo: AthleteRepository;
  let athleteService: AthleteService;
  const teamId = 'team-badminton-pro';

  beforeEach(async () => {
    db = createTestDb();
    athleteRepo = new AthleteRepository(db as any);
    athleteService = new AthleteService(athleteRepo);

    await db.insert(schema.teams).values({
      id: teamId,
      name: 'WAVON Badminton Academy',
    });

    await db.insert(schema.users).values({
      id: 'coach-1',
      teamId,
      name: 'โค้ชแบดมินตัน',
      username: 'coach_bm',
      passwordHash: 'pass1234',
      role: 'COACH',
    });
  });

  it('filters out inactive athletes when querying active roster', async () => {
    const activeAthlete = await athleteService.createAthlete({
      teamId,
      name: 'น้องภูมิ แบดมินตัน',
      athleteCode: 'BM-001',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    const inactiveAthlete = await athleteService.createAthlete({
      teamId,
      name: 'น้องมิว (พักซ้อม)',
      athleteCode: 'BM-002',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    // Toggle inactive
    await athleteService.toggleStatus(inactiveAthlete.id, 'INACTIVE');

    // Query with ACTIVE filter (used by check-in scan page)
    const activeList = await athleteRepo.findByTeam(teamId, { status: 'ACTIVE' });
    expect(activeList.length).toBe(1);
    expect(activeList[0].id).toBe(activeAthlete.id);
    expect(activeList.some((a) => a.id === inactiveAthlete.id)).toBe(false);
  });

  it('deletes athlete and cascades removal of attendance records', async () => {
    const athlete = await athleteService.createAthlete({
      teamId,
      name: 'นักกีฬาต้องการลบ',
      athleteCode: 'DEL-01',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    // Create session and attendance
    const sessionId = 'session-test-1';
    await db.insert(schema.trainingSessions).values({
      id: sessionId,
      teamId,
      title: 'ซ้อมแบดช่วงเย็น',
      date: '2026-09-10',
      startTime: '17:00',
      endTime: '19:00',
      createdBy: 'coach-1',
    });

    await db.insert(schema.attendances).values({
      id: 'att-test-1',
      sessionId,
      athleteId: athlete.id,
      status: 'PRESENT',
      checkedBy: 'coach-1',
    });

    // Delete athlete
    const deleteSuccess = await athleteService.deleteAthlete(athlete.id);
    expect(deleteSuccess).toBe(true);

    // Verify athlete is deleted
    const found = await athleteRepo.findById(athlete.id);
    expect(found).toBeNull();

    // Verify attendance is also deleted
    const remainingAttendances = await db.select().from(schema.attendances);
    expect(remainingAttendances.length).toBe(0);
  });
});
