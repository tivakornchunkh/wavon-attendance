import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { teams, users, athletes, trainingSessions, attendances, attendanceLogs } from '../src/server/db/schema';
import { eq, and, like, inArray } from 'drizzle-orm';

describe('Demo Data Isolation & Safe Deletion', () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
  });

  it('deletes ONLY demo records (id starts with demo-) and leaves real coach data 100% intact', async () => {
    const teamId = 'team-real-1';
    const coachId = 'coach-real-1';

    await testDb.insert(teams).values({ id: teamId, name: 'Real FC' });
    await testDb.insert(users).values({
      id: coachId,
      teamId,
      name: 'Real Coach',
      username: 'coach_real',
      passwordHash: 'hash',
      role: 'COACH',
    });

    // 1. จำลองข้อมูลจริงของโค้ช (Real Athletes & Real Sessions)
    const realAthleteId = 'real-ath-uuid-1234';
    await testDb.insert(athletes).values({
      id: realAthleteId,
      teamId,
      athleteCode: 'ATH-001',
      name: 'สมชาย นักเตะจริง',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    const realSessionId = 'real-sess-uuid-5678';
    await testDb.insert(trainingSessions).values({
      id: realSessionId,
      teamId,
      title: 'รอบซ้อมจริงประจำสัปดาห์',
      date: '2026-03-01',
      startTime: '08:00',
      endTime: '10:00',
      createdBy: coachId,
    });

    await testDb.insert(attendances).values({
      id: 'real-att-1',
      sessionId: realSessionId,
      athleteId: realAthleteId,
      status: 'PRESENT',
      checkedBy: coachId,
    });

    // 2. จำลองการใส่ข้อมูล DEMO เข้ามา
    const demoAthleteId = 'demo-ath-01';
    await testDb.insert(athletes).values({
      id: demoAthleteId,
      teamId,
      athleteCode: 'DEMO-01',
      name: 'น้องต้น (Demo)',
      startDate: '2026-01-01',
      status: 'ACTIVE',
    });

    const demoSessionId = 'demo-sess-01';
    await testDb.insert(trainingSessions).values({
      id: demoSessionId,
      teamId,
      title: '(Demo) ซ้อมเช้า',
      date: '2026-03-02',
      startTime: '07:00',
      endTime: '09:00',
      createdBy: coachId,
    });

    await testDb.insert(attendances).values({
      id: 'demo-att-1',
      sessionId: demoSessionId,
      athleteId: demoAthleteId,
      status: 'PRESENT',
      checkedBy: coachId,
    });

    // ตรวจสอบว่าในระบบมีทั้งข้อมูลจริงและข้อมูล Demo รวมกัน
    const allAthletesBefore = await testDb.select().from(athletes);
    expect(allAthletesBefore.length).toBe(2);

    // 3. ปฏิบัติการ "ล้างเฉพาะ Demo" (ฟังก์ชันแบบเดียวกับ clearDemoDataAction)
    const demoSessions = await testDb
      .select({ id: trainingSessions.id })
      .from(trainingSessions)
      .where(and(eq(trainingSessions.teamId, teamId), like(trainingSessions.id, 'demo-%')));
    const demoSessionIds = demoSessions.map((s) => s.id);

    const demoAthletes = await testDb
      .select({ id: athletes.id })
      .from(athletes)
      .where(and(eq(athletes.teamId, teamId), like(athletes.id, 'demo-%')));
    const demoAthleteIds = demoAthletes.map((a) => a.id);

    if (demoSessionIds.length > 0) {
      await testDb.delete(attendanceLogs).where(inArray(attendanceLogs.sessionId, demoSessionIds));
      await testDb.delete(attendances).where(inArray(attendances.sessionId, demoSessionIds));
      await testDb.delete(trainingSessions).where(inArray(trainingSessions.id, demoSessionIds));
    }

    if (demoAthleteIds.length > 0) {
      await testDb.delete(athletes).where(inArray(athletes.id, demoAthleteIds));
    }

    // 4. ตรวจสอบผลลัพธ์หลังล้าง
    const remainingAthletes = await testDb.select().from(athletes);
    const remainingSessions = await testDb.select().from(trainingSessions);
    const remainingAttendances = await testDb.select().from(attendances);

    // ข้อมูล Demo ต้องหายไปทั้งหมด
    expect(remainingAthletes.some((a) => a.id.startsWith('demo-'))).toBe(false);
    expect(remainingSessions.some((s) => s.id.startsWith('demo-'))).toBe(false);

    // ข้อมูลจริงของโค้ชต้องยังอยู่ครบ 100%!
    expect(remainingAthletes.length).toBe(1);
    expect(remainingAthletes[0].name).toBe('สมชาย นักเตะจริง');
    expect(remainingAthletes[0].id).toBe(realAthleteId);

    expect(remainingSessions.length).toBe(1);
    expect(remainingSessions[0].title).toBe('รอบซ้อมจริงประจำสัปดาห์');
    expect(remainingSessions[0].id).toBe(realSessionId);

    expect(remainingAttendances.length).toBe(1);
    expect(remainingAttendances[0].athleteId).toBe(realAthleteId);
  });
});

