import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { teams, users, athletes, trainingSessions, attendanceLogs } from '../src/server/db/schema';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { eq } from 'drizzle-orm';

describe('Athlete QR Check-In & Leave Flows', () => {
  let testDb: ReturnType<typeof createTestDb>;
  let attendanceRepo: AttendanceRepository;
  let athleteRepo: AthleteRepository;
  let sessionRepo: SessionRepository;

  beforeEach(async () => {
    testDb = createTestDb();
    attendanceRepo = new AttendanceRepository(testDb);
    athleteRepo = new AthleteRepository(testDb);
    sessionRepo = new SessionRepository(testDb);

    await testDb.insert(teams).values({ id: 'team-1', name: 'TEST FC' });
    await testDb.insert(users).values({
      id: 'coach-1',
      teamId: 'team-1',
      name: 'Coach Test',
      username: 'coach_test',
      passwordHash: '1234',
      role: 'COACH',
    });
    await testDb.insert(athletes).values([
      { id: 'ath-1', teamId: 'team-1', athleteCode: 'ATH-01', name: 'น้องก้อง', startDate: '2026-01-01', status: 'ACTIVE' },
      { id: 'ath-2', teamId: 'team-1', athleteCode: 'ATH-02', name: 'น้องบอล', startDate: '2026-01-01', status: 'ACTIVE' },
    ]);
    await testDb.insert(trainingSessions).values({
      id: 'sess-qr',
      teamId: 'team-1',
      title: 'ซ้อมเตรียมแข่ง',
      date: '2026-03-10',
      startTime: '17:00',
      endTime: '19:00',
      createdBy: 'coach-1',
    });
  });

  it('allows athlete to self check-in as PRESENT', async () => {
    const res = await attendanceRepo.batchUpsert('sess-qr', 'coach-1', [
      { athleteId: 'ath-1', status: 'PRESENT', notes: 'สแกน QR เช็คชื่อตนเอง' },
    ]);

    expect(res.inserted).toBe(1);

    const record = await attendanceRepo.findBySessionAndAthlete('sess-qr', 'ath-1');
    expect(record).not.toBeNull();
    expect(record?.status).toBe('PRESENT');
    expect(record?.notes).toBe('สแกน QR เช็คชื่อตนเอง');
  });

  it('allows athlete to submit LEAVE with specific reason', async () => {
    const leaveReason = 'ติดสอบปลายภาค ม.4';
    await attendanceRepo.batchUpsert('sess-qr', 'coach-1', [
      { athleteId: 'ath-2', status: 'LEAVE', notes: leaveReason },
    ]);

    const record = await attendanceRepo.findBySessionAndAthlete('sess-qr', 'ath-2');
    expect(record).not.toBeNull();
    expect(record?.status).toBe('LEAVE');
    expect(record?.notes).toBe(leaveReason);
  });

  it('generates an audit log if athlete changes status from LEAVE to PRESENT', async () => {
    // 1. First marked as LEAVE
    await attendanceRepo.batchUpsert('sess-qr', 'coach-1', [
      { athleteId: 'ath-1', status: 'LEAVE', notes: 'ลาป่วย' },
    ]);

    // 2. Later arrived at pitch and scanned QR -> changed to PRESENT
    await attendanceRepo.batchUpsert('sess-qr', 'coach-1', [
      { athleteId: 'ath-1', status: 'PRESENT', notes: 'สแกน QR เช็คชื่อตนเอง (เปลี่ยนจากลา)' },
    ]);

    const currentRecord = await attendanceRepo.findBySessionAndAthlete('sess-qr', 'ath-1');
    expect(currentRecord?.status).toBe('PRESENT');

    const logs = await testDb.select().from(attendanceLogs).where(eq(attendanceLogs.athleteId, 'ath-1'));
    expect(logs.length).toBe(1);
    expect(logs[0].previousStatus).toBe('LEAVE');
    expect(logs[0].newStatus).toBe('PRESENT');
  });
});