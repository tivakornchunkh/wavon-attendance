import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/server/db/client';
import { teams, users, trainingSessions, recurringSchedules } from '../src/server/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  ensureTodayRecurringSession,
  resolveClubActiveSession,
  regeneratePermanentQrAction,
  saveRecurringScheduleSlotAction,
  deleteRecurringScheduleSlotAction,
} from '../app/actions/session.actions';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { SessionService } from '../src/core/services/session.service';
import { getBangkokDateTime } from '../src/server/helpers/timezone';

describe('Permanent QR & Multi-Session Architecture (v2.6.0)', () => {
  let testTeamId: string;
  let testCoachId: string;
  const sessionRepo = new SessionRepository(db);
  const athleteRepo = new AthleteRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const sessionService = new SessionService(sessionRepo, athleteRepo, attendanceRepo);

  beforeEach(async () => {
    testTeamId = `team-test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    testCoachId = `coach-test-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Create test team & coach
    await db.insert(teams).values({
      id: testTeamId,
      name: 'Test Academy FC',
      permanentQrToken: null,
    });

    await db.insert(users).values({
      id: testCoachId,
      teamId: testTeamId,
      name: 'Coach Test',
      username: `coach_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      passwordHash: 'dummy_hash',
      role: 'COACH',
    });
  });

  it('supports creating multiple recurring training schedules per day (Morning & Evening)', async () => {
    const bkk = getBangkokDateTime();
    const todayDay = bkk.dayOfWeek;

    // Slot 1: Morning Practice
    const slot1Id = `rec-morn-${Date.now()}`;
    await db.insert(recurringSchedules).values({
      id: slot1Id,
      teamId: testTeamId,
      daysOfWeek: JSON.stringify([todayDay]),
      startTime: '06:00',
      endTime: '08:00',
      title: 'ซ้อมเช้า',
      isActive: 1,
    });

    // Slot 2: Evening Practice
    const slot2Id = `rec-eve-${Date.now()}`;
    await db.insert(recurringSchedules).values({
      id: slot2Id,
      teamId: testTeamId,
      daysOfWeek: JSON.stringify([todayDay]),
      startTime: '17:00',
      endTime: '19:00',
      title: 'ซ้อมเย็น',
      isActive: 1,
    });

    // Trigger ensureTodayRecurringSession
    const created = await ensureTodayRecurringSession(testTeamId);
    expect(created.length).toBe(2);

    // Verify both sessions exist in DB for today
    const todaySessions = await db
      .select()
      .from(trainingSessions)
      .where(and(eq(trainingSessions.teamId, testTeamId), eq(trainingSessions.date, bkk.dateStr)));

    expect(todaySessions.length).toBe(2);
    const titles = todaySessions.map((s) => s.title);
    expect(titles).toContain('ซ้อมเช้า');
    expect(titles).toContain('ซ้อมเย็น');

    // Calling ensureTodayRecurringSession again should NOT create duplicate sessions
    const createdAgain = await ensureTodayRecurringSession(testTeamId);
    expect(createdAgain.length).toBe(0);
  });

  it('allows updating a session (date, time, title) without altering team QR code', async () => {
    const bkk = getBangkokDateTime();
    const session = await sessionService.createPlannedSession({
      teamId: testTeamId,
      title: 'ซ้อมแท็กติก',
      date: bkk.dateStr,
      startTime: '09:00',
      endTime: '11:00',
      createdBy: testCoachId,
    });

    expect(session.title).toBe('ซ้อมแท็กติก');

    // Update title and extend time
    const updated = await sessionService.updateSession(session.id, {
      title: 'ซ้อมแท็กติกและลูกตั้งเตะ',
      startTime: '09:30',
      endTime: '11:30',
    });

    expect(updated.title).toBe('ซ้อมแท็กติกและลูกตั้งเตะ');
    expect(updated.startTime).toBe('09:30');
    expect(updated.endTime).toBe('11:30');

    // Overlap with itself should NOT throw an error (self-exclusion test)
    const selfUpdate = await sessionService.updateSession(session.id, {
      title: 'ซ้อมแท็กติก (ฉบับแก้ไข)',
      startTime: '09:30',
      endTime: '11:30',
    });
    expect(selfUpdate.title).toBe('ซ้อมแท็กติก (ฉบับแก้ไข)');
  });

  it('prevents session update when times overlap with another session on the same date', async () => {
    const bkk = getBangkokDateTime();
    const sessionA = await sessionService.createPlannedSession({
      teamId: testTeamId,
      title: 'รอบที่ 1',
      date: bkk.dateStr,
      startTime: '13:00',
      endTime: '15:00',
      createdBy: testCoachId,
    });

    const sessionB = await sessionService.createPlannedSession({
      teamId: testTeamId,
      title: 'รอบที่ 2',
      date: bkk.dateStr,
      startTime: '15:30',
      endTime: '17:30',
      createdBy: testCoachId,
    });

    // Attempting to move sessionB to overlap with sessionA (14:00 - 16:00)
    await expect(
      sessionService.updateSession(sessionB.id, {
        startTime: '14:00',
        endTime: '16:00',
      })
    ).rejects.toThrow('ทับซ้อน');
  });

  it('supports permanent QR token regeneration and resolves correctly', async () => {
    // 1. Initial resolution using teamId
    const res1 = await resolveClubActiveSession(testTeamId);
    expect(res1.clubName).toBe('Test Academy FC');

    // 2. Regenerate QR Token
    const { token } = await regeneratePermanentQrAction(testTeamId);
    expect(token).toMatch(/^qr_[a-f0-9]{12}$/);

    // 3. Resolve using new token
    const res2 = await resolveClubActiveSession(token);
    expect(res2.clubName).toBe('Test Academy FC');

    // 4. Invalid or old token throws error
    await expect(resolveClubActiveSession('qr_invalid_token_9999')).rejects.toThrow(
      'ไม่พบสโมสรนี้ในระบบ หรือคิวอาร์โค้ดนี้ถูกยกเลิกแล้ว'
    );
  });
});
