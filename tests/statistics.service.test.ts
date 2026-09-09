import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { StatisticsService } from '../src/core/services/statistics.service';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { teams, users, athletes, trainingSessions, attendances } from '../src/server/db/schema';

describe('StatisticsService', () => {
  let statsService: StatisticsService;
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    const attendanceRepo = new AttendanceRepository(testDb);
    const athleteRepo = new AthleteRepository(testDb);
    const sessionRepo = new SessionRepository(testDb);
    statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);
  });

  describe('Attendance Rate Formula (Choice B: Leave is not penalized)', () => {
    it('calculates standard rate correctly: 17 present out of 20 total with 1 leave', () => {
      // 17 / (20 - 1) = 17 / 19 = 89.47% -> 89.5%
      const rate = statsService.calculateAttendanceRate(17, 20, 1);
      expect(rate).toBe(89.5);
    });

    it('returns 100% when all non-leave sessions are attended', () => {
      // 5 present, 5 total, 0 leave -> 100%
      const rate = statsService.calculateAttendanceRate(5, 5, 0);
      expect(rate).toBe(100);
    });

    it('returns 100% when all sessions were approved leaves (not penalized)', () => {
      // 0 present, 2 total, 2 leave -> effectiveTotal 0 -> 100%
      const rate = statsService.calculateAttendanceRate(0, 2, 2);
      expect(rate).toBe(100);
    });

    it('returns 0% when no sessions exist', () => {
      const rate = statsService.calculateAttendanceRate(0, 0, 0);
      expect(rate).toBe(0);
    });

    it('returns 0% when all sessions were absent', () => {
      // 0 present, 5 total, 0 leave -> 0%
      const rate = statsService.calculateAttendanceRate(0, 5, 0);
      expect(rate).toBe(0);
    });
  });

  describe('End-to-End Dashboard and Athlete Stats', () => {
    it('correctly aggregates athlete statistics and dashboard rankings', async () => {
      const teamId = 'team-1';
      const coachId = 'coach-1';

      // 1. Seed Team and Coach
      await testDb.insert(teams).values({ id: teamId, name: 'WAVON FC' });
      await testDb.insert(users).values({
        id: coachId,
        teamId,
        name: 'Coach Matt',
        username: 'coach_matt',
        passwordHash: 'hash123',
        role: 'COACH',
      });

      // 2. Seed Athletes
      await testDb.insert(athletes).values([
        {
          id: 'ath-1',
          teamId,
          athleteCode: 'ATH-001',
          name: 'Somchai',
          startDate: '2026-01-01',
          status: 'ACTIVE',
        },
        {
          id: 'ath-2',
          teamId,
          athleteCode: 'ATH-002',
          name: 'Wichai',
          startDate: '2026-01-01',
          status: 'ACTIVE',
        },
      ]);

      // 3. Seed 2 Sessions
      await testDb.insert(trainingSessions).values([
        {
          id: 'sess-1',
          teamId,
          title: 'Session 1',
          date: '2026-03-01',
          startTime: '08:00',
          endTime: '10:00',
          createdBy: coachId,
        },
        {
          id: 'sess-2',
          teamId,
          title: 'Session 2',
          date: '2026-03-02',
          startTime: '08:00',
          endTime: '10:00',
          createdBy: coachId,
        },
      ]);

      // 4. Seed Attendances
      // Somchai: attended both
      // Wichai: attended 1, leave 1
      await testDb.insert(attendances).values([
        {
          id: 'att-1',
          sessionId: 'sess-1',
          athleteId: 'ath-1',
          status: 'PRESENT',
          checkedBy: coachId,
        },
        {
          id: 'att-2',
          sessionId: 'sess-2',
          athleteId: 'ath-1',
          status: 'PRESENT',
          checkedBy: coachId,
        },
        {
          id: 'att-3',
          sessionId: 'sess-1',
          athleteId: 'ath-2',
          status: 'PRESENT',
          checkedBy: coachId,
        },
        {
          id: 'att-4',
          sessionId: 'sess-2',
          athleteId: 'ath-2',
          status: 'LEAVE',
          checkedBy: coachId,
        },
      ]);

      // Test Athlete 1 stats
      const somchaiStats = await statsService.getAthleteStats('ath-1');
      expect(somchaiStats.totalSessions).toBe(2);
      expect(somchaiStats.presentCount).toBe(2);
      expect(somchaiStats.attendanceRate).toBe(100);

      // Test Athlete 2 stats (1 present, 1 leave -> (1 / (2 - 1)) * 100 = 100%)
      const wichaiStats = await statsService.getAthleteStats('ath-2');
      expect(wichaiStats.totalSessions).toBe(2);
      expect(wichaiStats.presentCount).toBe(1);
      expect(wichaiStats.leaveCount).toBe(1);
      expect(wichaiStats.attendanceRate).toBe(100);

      // Test Dashboard
      const dashboard = await statsService.getDashboardSummary(teamId);
      expect(dashboard.totalAthletes).toBe(2);
      expect(dashboard.totalSessions).toBe(2);
      expect(dashboard.overallAttendanceRate).toBe(100);

      // Verify Tie-breaker: Somchai has 2 presents vs Wichai 1 present -> Somchai ranked #1
      expect(dashboard.frequentAttendees[0].athleteName).toBe('Somchai');
      expect(dashboard.frequentAttendees[1].athleteName).toBe('Wichai');
    });

    it('breaks ties using Option 1: Rate -> Present -> Absent -> Leave -> Name', async () => {
      const teamId = 'team-tie';
      const coachId = 'coach-tie';

      await testDb.insert(teams).values({ id: teamId, name: 'TIE FC' });
      await testDb.insert(users).values({
        id: coachId,
        teamId,
        name: 'Coach Tie',
        username: 'coach_tie',
        passwordHash: 'hash',
        role: 'COACH',
      });

      // ก้อง (A), ขวัญ (B): ทั้งคู่มา 2 ครั้ง เท่ากัน, ขาด 0 เท่ากัน
      // ก้อง ลา 1 ครั้ง (Rate 100%), ขวัญ ลา 0 ครั้ง (Rate 100%)
      // ขวัญ ลาน้อยกว่า -> ขวัญควรได้อันดับสูงกว่า ก้อง
      await testDb.insert(athletes).values([
        { id: 'ath-kong', teamId, athleteCode: 'KONG', name: 'ก้อง', startDate: '2026-01-01', status: 'ACTIVE' },
        { id: 'ath-kwan', teamId, athleteCode: 'KWAN', name: 'ขวัญ', startDate: '2026-01-01', status: 'ACTIVE' },
      ]);

      await testDb.insert(trainingSessions).values([
        { id: 's-1', teamId, title: 'S1', date: '2026-03-01', startTime: '08:00', endTime: '10:00', createdBy: coachId },
        { id: 's-2', teamId, title: 'S2', date: '2026-03-02', startTime: '08:00', endTime: '10:00', createdBy: coachId },
        { id: 's-3', teamId, title: 'S3', date: '2026-03-03', startTime: '08:00', endTime: '10:00', createdBy: coachId },
      ]);

      await testDb.insert(attendances).values([
        // ก้อง: มา 2, ลา 1 -> total 3, rate 100%
        { id: 'a1', sessionId: 's-1', athleteId: 'ath-kong', status: 'PRESENT', checkedBy: coachId },
        { id: 'a2', sessionId: 's-2', athleteId: 'ath-kong', status: 'PRESENT', checkedBy: coachId },
        { id: 'a3', sessionId: 's-3', athleteId: 'ath-kong', status: 'LEAVE', checkedBy: coachId },
        // ขวัญ: มา 2, ลา 0 (รอบ 3 ไม่ได้เช็คหรือไม่ได้เข้า แต่ไม่มีลา) -> total 2, rate 100%
        { id: 'a4', sessionId: 's-1', athleteId: 'ath-kwan', status: 'PRESENT', checkedBy: coachId },
        { id: 'a5', sessionId: 's-2', athleteId: 'ath-kwan', status: 'PRESENT', checkedBy: coachId },
      ]);

      const dashboard = await statsService.getDashboardSummary(teamId);
      // ขวัญ (leaveCount: 0) ชนะ ก้อง (leaveCount: 1)
      expect(dashboard.frequentAttendees[0].athleteName).toBe('ขวัญ');
      expect(dashboard.frequentAttendees[1].athleteName).toBe('ก้อง');
    });
  });
});

