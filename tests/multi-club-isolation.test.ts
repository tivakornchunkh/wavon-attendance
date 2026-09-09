import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { teams, users, athletes, trainingSessions, attendances } from '../src/server/db/schema';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { StatisticsService } from '../src/core/services/statistics.service';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { eq, and, like, inArray } from 'drizzle-orm';

describe('Multi-Club Isolation & Admin Scenarios', () => {
  let testDb: ReturnType<typeof createTestDb>;
  let athleteRepo: AthleteRepository;
  let sessionRepo: SessionRepository;
  let attendanceRepo: AttendanceRepository;
  let statsService: StatisticsService;

  beforeEach(() => {
    testDb = createTestDb();
    athleteRepo = new AthleteRepository(testDb);
    sessionRepo = new SessionRepository(testDb);
    attendanceRepo = new AttendanceRepository(testDb);
    statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);
  });

  it('completely isolates athletes and sessions between Club A and Club B', async () => {
    const clubAId = 'club-wavon';
    const clubBId = 'club-thunder';

    // 1. Seed 2 Clubs
    await testDb.insert(teams).values([
      { id: clubAId, name: 'WAVON FC' },
      { id: clubBId, name: 'THUNDER CLUB' },
    ]);

    // 2. Seed Coaches
    await testDb.insert(users).values([
      { id: 'coach-a', teamId: clubAId, name: 'Coach WAVON', username: 'coach_wavon', passwordHash: 'hash', role: 'USER' },
      { id: 'coach-b', teamId: clubBId, name: 'Coach THUNDER', username: 'coach_thunder', passwordHash: 'hash', role: 'USER' },
    ]);

    // 3. สร้างนักกีฬาชื่อเดียวกัน "น้องต้น" และรหัสเดียวกัน "ATH-001" ในทั้ง 2 สโมสร
    await testDb.insert(athletes).values([
      { id: 'ath-a-1', teamId: clubAId, athleteCode: 'ATH-001', name: 'น้องต้น', startDate: '2026-01-01', status: 'ACTIVE' },
      { id: 'ath-b-1', teamId: clubBId, athleteCode: 'ATH-001', name: 'น้องต้น', startDate: '2026-01-01', status: 'ACTIVE' },
    ]);

    // 4. สร้างรอบซ้อมของแต่ละสโมสร
    await testDb.insert(trainingSessions).values([
      { id: 'sess-a-1', teamId: clubAId, title: 'WAVON Morning Drill', date: '2026-03-01', startTime: '07:00', endTime: '09:00', createdBy: 'coach-a' },
      { id: 'sess-b-1', teamId: clubBId, title: 'THUNDER Power Workout', date: '2026-03-01', startTime: '16:00', endTime: '18:00', createdBy: 'coach-b' },
    ]);

    // เช็คชื่อ
    await testDb.insert(attendances).values([
      { id: 'att-a-1', sessionId: 'sess-a-1', athleteId: 'ath-a-1', status: 'PRESENT', checkedBy: 'coach-a' },
      { id: 'att-b-1', sessionId: 'sess-b-1', athleteId: 'ath-b-1', status: 'ABSENT', checkedBy: 'coach-b' },
    ]);

    // 5. ตรวจสอบการแยกข้อมูลของ Club A
    const athletesClubA = await athleteRepo.findByTeam(clubAId);
    expect(athletesClubA.length).toBe(1);
    expect(athletesClubA[0].id).toBe('ath-a-1');
    expect(athletesClubA[0].teamId).toBe(clubAId);

    const sessionsClubA = await sessionRepo.findByDateRange(clubAId);
    expect(sessionsClubA.length).toBe(1);
    expect(sessionsClubA[0].id).toBe('sess-a-1');
    expect(sessionsClubA[0].title).toBe('WAVON Morning Drill');

    const statsClubA = await statsService.getDashboardSummary(clubAId);
    expect(statsClubA.totalAthletes).toBe(1);
    expect(statsClubA.overallAttendanceRate).toBe(100);

    // 6. ตรวจสอบการแยกข้อมูลของ Club B
    const athletesClubB = await athleteRepo.findByTeam(clubBId);
    expect(athletesClubB.length).toBe(1);
    expect(athletesClubB[0].id).toBe('ath-b-1');
    expect(athletesClubB[0].teamId).toBe(clubBId);

    const sessionsClubB = await sessionRepo.findByDateRange(clubBId);
    expect(sessionsClubB.length).toBe(1);
    expect(sessionsClubB[0].id).toBe('sess-b-1');
    expect(sessionsClubB[0].title).toBe('THUNDER Power Workout');

    const statsClubB = await statsService.getDashboardSummary(clubBId);
    expect(statsClubB.totalAthletes).toBe(1);
    expect(statsClubB.overallAttendanceRate).toBe(0); // ขาดซ้อม rate = 0%
  });

  it('ensures demo actions in Club A never touch or leak into Club B', async () => {
    const clubAId = 'club-a';
    const clubBId = 'club-b';

    await testDb.insert(teams).values([
      { id: clubAId, name: 'Club A' },
      { id: clubBId, name: 'Club B' },
    ]);

    // นักกีฬาจริงของ Club B
    await testDb.insert(athletes).values({
      id: 'ath-real-b',
      teamId: clubBId,
      athleteCode: 'ATH-B',
      name: 'นักกีฬาจริง Club B',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    // ใส่ Demo ใน Club A
    await testDb.insert(athletes).values({
      id: 'demo-ath-a-1',
      teamId: clubAId,
      athleteCode: 'DEMO-01',
      name: 'น้องเดโม Club A',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    // สั่งล้าง Demo เฉพาะ Club A
    const demoAthletesA = await testDb
      .select({ id: athletes.id })
      .from(athletes)
      .where(and(eq(athletes.teamId, clubAId), like(athletes.id, 'demo-%')));
    const ids = demoAthletesA.map((a) => a.id);

    if (ids.length > 0) {
      await testDb.delete(athletes).where(inArray(athletes.id, ids));
    }

    // ตรวจสอบว่า Club A ว่างเปล่า
    const athletesA = await testDb.select().from(athletes).where(eq(athletes.teamId, clubAId));
    expect(athletesA.length).toBe(0);

    // แต่ Club B นักกีฬาจริงยังอยู่ครบ 100%
    const athletesB = await testDb.select().from(athletes).where(eq(athletes.teamId, clubBId));
    expect(athletesB.length).toBe(1);
    expect(athletesB[0].name).toBe('นักกีฬาจริง Club B');
  });
});

