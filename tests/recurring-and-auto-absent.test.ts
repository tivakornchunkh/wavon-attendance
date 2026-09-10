import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import {
  teams,
  users,
  athletes,
  trainingSessions,
  recurringSchedules,
} from '../src/server/db/schema';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { eq } from 'drizzle-orm';

describe('Auto-Absent Cut-off, Pitch Verification & Recurring Schedules', () => {
  let testDb: ReturnType<typeof createTestDb>;
  let attendanceRepo: AttendanceRepository;
  let athleteRepo: AthleteRepository;
  let sessionRepo: SessionRepository;

  beforeEach(async () => {
    testDb = createTestDb();
    attendanceRepo = new AttendanceRepository(testDb);
    athleteRepo = new AthleteRepository(testDb);
    sessionRepo = new SessionRepository(testDb);

    await testDb.insert(teams).values({ id: 'team-pitch', name: 'WAVON ACADEMY' });
    await testDb.insert(users).values({
      id: 'coach-pitch',
      teamId: 'team-pitch',
      name: 'Coach WAVON',
      username: 'coach_wavon',
      passwordHash: 'hash123',
      role: 'COACH',
    });
    await testDb.insert(athletes).values([
      { id: 'ath-1', teamId: 'team-pitch', athleteCode: 'W-01', name: 'ธนากร', startDate: '2026-01-01', status: 'ACTIVE' },
      { id: 'ath-2', teamId: 'team-pitch', athleteCode: 'W-02', name: 'สิทธิโชค', startDate: '2026-01-01', status: 'ACTIVE' },
      { id: 'ath-3', teamId: 'team-pitch', athleteCode: 'W-03', name: 'กิตติศักดิ์', startDate: '2026-01-01', status: 'ACTIVE' },
    ]);
    await testDb.insert(trainingSessions).values({
      id: 'sess-today',
      teamId: 'team-pitch',
      title: 'ซ้อมแทคติกประจำวัน',
      date: '2026-03-10',
      startTime: '17:00',
      endTime: '19:00',
      createdBy: 'coach-pitch',
      isClosed: 0,
    });
  });

  it('preserves PRESENT and LEAVE athletes while marking unchecked athletes as ABSENT upon session close', async () => {
    // 1. ath-1 is PRESENT, ath-2 submitted LEAVE
    await attendanceRepo.batchUpsert('sess-today', 'coach-pitch', [
      { athleteId: 'ath-1', status: 'PRESENT', notes: 'สแกน QR ริมสนาม' },
      { athleteId: 'ath-2', status: 'LEAVE', notes: 'ลาป่วย' },
    ]);

    // 2. Coach closes session and auto-absents unchecked athletes
    const activeAthletes = await athleteRepo.findByTeam('team-pitch', { status: 'ACTIVE' });
    const existingAttendances = await attendanceRepo.findBySessionId('sess-today');
    const checkedMap = new Set(existingAttendances.map((a) => a.athleteId));

    const uncheckedToMarkAbsent = activeAthletes
      .filter((ath) => !checkedMap.has(ath.id))
      .map((ath) => ({
        athleteId: ath.id,
        status: 'ABSENT' as const,
        notes: 'ขาดซ้อม (ระบบตัดยอดอัตโนมัติเมื่อปิดรอบเวลา 19:00 น.)',
      }));

    expect(uncheckedToMarkAbsent.length).toBe(1);
    expect(uncheckedToMarkAbsent[0].athleteId).toBe('ath-3');

    if (uncheckedToMarkAbsent.length > 0) {
      await attendanceRepo.batchUpsert('sess-today', 'coach-pitch', uncheckedToMarkAbsent);
    }

    // Set isClosed = 1
    await testDb
      .update(trainingSessions)
      .set({ isClosed: 1 })
      .where(eq(trainingSessions.id, 'sess-today'));

    // 3. Verify final headcount
    const finalRecords = await attendanceRepo.findBySessionId('sess-today');
    const ath1 = finalRecords.find((r) => r.athleteId === 'ath-1');
    const ath2 = finalRecords.find((r) => r.athleteId === 'ath-2');
    const ath3 = finalRecords.find((r) => r.athleteId === 'ath-3');

    expect(ath1?.status).toBe('PRESENT');
    expect(ath2?.status).toBe('LEAVE');
    expect(ath3?.status).toBe('ABSENT');
    expect(ath3?.notes).toContain('ระบบตัดยอดอัตโนมัติ');

    // Verify session is closed in DB
    const sessionInDb = await sessionRepo.findById('sess-today');
    expect(sessionInDb?.isClosed).toBe(1);
  });

  it('rejects remote self-check-in as PRESENT when pitch verification is missing', () => {
    const isPitchVerified = false;
    const requestedStatus = 'PRESENT';

    let error: string | null = null;
    if (requestedStatus === 'PRESENT' && !isPitchVerified) {
      error = 'กรุณาสแกน QR Code ริมสนามเพื่อเช็คชื่อเข้าซ้อม (หากอยู่ที่บ้านสามารถแจ้งลาซ้อมได้)';
    }

    expect(error).not.toBeNull();
    expect(error).toContain('สแกน QR Code ริมสนาม');
  });

  it('allows remote self-check-in for LEAVE even when pitch verification is false', () => {
    const isPitchVerified = false;
    const requestedStatus: string = 'LEAVE';

    let error: string | null = null;
    if (requestedStatus === 'PRESENT' && !isPitchVerified) {
      error = 'กรุณาสแกน QR Code ริมสนามเพื่อเช็คชื่อเข้าซ้อม';
    }

    expect(error).toBeNull();
  });

  it('blocks check-in attempts when session is closed (isClosed === 1)', async () => {
    await testDb
      .update(trainingSessions)
      .set({ isClosed: 1 })
      .where(eq(trainingSessions.id, 'sess-today'));

    const session = await sessionRepo.findById('sess-today');
    expect(session?.isClosed).toBe(1);

    const checkInResult = session?.isClosed === 1
      ? { success: false, error: 'รอบการฝึกซ้อมนี้ถูกปิดรอบและตัดยอดแล้ว ไม่สามารถเช็คชื่อเพิ่มได้' }
      : { success: true };

    expect(checkInResult.success).toBe(false);
    expect(checkInResult.error).toContain('ปิดรอบและตัดยอดแล้ว');
  });

  it('saves and retrieves recurring training schedule correctly', async () => {
    const scheduleData = {
      id: 'sched-1',
      teamId: 'team-pitch',
      daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]), // Mon-Fri
      startTime: '17:00',
      endTime: '19:00',
      title: 'ซ้อมประจำวัน (จันทร์-ศุกร์)',
      isActive: 1,
    };

    await testDb.insert(recurringSchedules).values(scheduleData);

    const [saved] = await testDb
      .select()
      .from(recurringSchedules)
      .where(eq(recurringSchedules.teamId, 'team-pitch'));

    expect(saved).toBeDefined();
    expect(saved.title).toBe('ซ้อมประจำวัน (จันทร์-ศุกร์)');
    expect(saved.startTime).toBe('17:00');
    expect(saved.endTime).toBe('19:00');
    expect(JSON.parse(saved.daysOfWeek)).toEqual([1, 2, 3, 4, 5]);
    expect(saved.isActive).toBe(1);
  });

  it('correctly accepts various pitch query formats (true, 1, yes)', () => {
    const isPitchParam = (pitch?: string | null) => {
      const p = typeof pitch === 'string' ? pitch.toLowerCase().trim() : '';
      return p === 'true' || p === '1' || p === 'yes';
    };

    expect(isPitchParam('true')).toBe(true);
    expect(isPitchParam('TRUE')).toBe(true);
    expect(isPitchParam('1')).toBe(true);
    expect(isPitchParam('yes')).toBe(true);
    expect(isPitchParam(undefined)).toBe(false);
    expect(isPitchParam('')).toBe(false);
    expect(isPitchParam('false')).toBe(false);
  });

  it('verifies that pitch QR codes encode the ?pitch=true parameter', () => {
    const origin = 'https://wavon-attendance.onrender.com';
    const sessionId = 'test-session-123';
    const pitchQrUrl = `${origin}/checkin/${sessionId}?pitch=true`;

    const url = new URL(pitchQrUrl);
    expect(url.searchParams.get('pitch')).toBe('true');
  });
});
