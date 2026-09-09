import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { AttendanceService } from '../src/core/services/attendance.service';
import { SessionService } from '../src/core/services/session.service';
import { AthleteService } from '../src/core/services/athlete.service';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { teams, users, athletes, trainingSessions } from '../src/server/db/schema';

describe('Attendance & Session Services', () => {
  let testDb: ReturnType<typeof createTestDb>;
  let attendanceRepo: AttendanceRepository;
  let athleteRepo: AthleteRepository;
  let sessionRepo: SessionRepository;
  let attendanceService: AttendanceService;
  let sessionService: SessionService;
  let athleteService: AthleteService;

  const teamId = 'team-wavon';
  const coachId = 'coach-1';

  beforeEach(async () => {
    testDb = createTestDb();
    attendanceRepo = new AttendanceRepository(testDb);
    athleteRepo = new AthleteRepository(testDb);
    sessionRepo = new SessionRepository(testDb);

    attendanceService = new AttendanceService(attendanceRepo, sessionRepo);
    sessionService = new SessionService(sessionRepo, athleteRepo, attendanceRepo);
    athleteService = new AthleteService(athleteRepo);

    // Seed Team and Coach
    await testDb.insert(teams).values({ id: teamId, name: 'WAVON Academy' });
    await testDb.insert(users).values({
      id: coachId,
      teamId,
      name: 'Coach Arm',
      username: 'coach_arm',
      passwordHash: 'secret_hash',
      role: 'COACH',
    });
  });

  describe('Eligibility Filtering & Roster Generation (Q2: A, Q5: B)', () => {
    it('filters out athletes who joined after the session date or are inactive', async () => {
      // 1. Athlete who joined early (Eligible)
      const a1 = await athleteService.createAthlete({
        teamId,
        athleteCode: 'A01',
        name: 'Senior Player',
        startDate: '2026-01-01',
        status: 'ACTIVE',
      });

      // 2. Athlete who joined after the session date (Ineligible)
      await athleteService.createAthlete({
        teamId,
        athleteCode: 'A02',
        name: 'Future Player',
        startDate: '2026-04-01',
        status: 'ACTIVE',
      });

      // 3. Athlete who is Inactive (Ineligible for new sessions)
      await athleteService.createAthlete({
        teamId,
        athleteCode: 'A03',
        name: 'Injured Player',
        startDate: '2026-01-01',
        status: 'INACTIVE',
      });

      // Create session for 2026-03-01
      const session = await sessionService.createPlannedSession({
        teamId,
        title: 'Tactical Practice',
        date: '2026-03-01',
        startTime: '16:00',
        endTime: '18:00',
        createdBy: coachId,
      });

      const { roster } = await sessionService.getSessionAttendanceRoster(session.id);

      // Only Senior Player should be on the roster
      expect(roster.length).toBe(1);
      expect(roster[0].athlete.id).toBe(a1.id);
      expect(roster[0].status).toBeUndefined(); // Starts at Unchecked (Q6: C)
    });
  });

  describe('Batch Check-in and Duplicate Prevention', () => {
    it('records batch attendance and updates cleanly without duplicates', async () => {
      const a1 = await athleteService.createAthlete({
        teamId,
        athleteCode: 'A01',
        name: 'Player 1',
        startDate: '2026-01-01',
        status: 'ACTIVE',
      });

      const session = await sessionService.createPlannedSession({
        teamId,
        title: 'Morning Drills',
        date: '2026-03-01',
        startTime: '08:00',
        endTime: '10:00',
        createdBy: coachId,
      });

      // 1. Initial Batch Check-in
      const result1 = await attendanceService.recordBatchAttendance({
        sessionId: session.id,
        checkedBy: coachId,
        records: [{ athleteId: a1.id, status: 'PRESENT' }],
      });
      expect(result1.inserted).toBe(1);

      // 2. Re-submit same session & athlete with same status (No duplicate, no log)
      const result2 = await attendanceService.recordBatchAttendance({
        sessionId: session.id,
        checkedBy: coachId,
        records: [{ athleteId: a1.id, status: 'PRESENT' }],
      });
      expect(result2.inserted).toBe(0);
      expect(result2.updated).toBe(0);

      // Total records in attendances table for this session must still be 1
      const allSessionAtts = await attendanceRepo.findBySessionId(session.id);
      expect(allSessionAtts.length).toBe(1);
      expect(allSessionAtts[0].status).toBe('PRESENT');
    });
  });

  describe('Audit Logging on Retroactive Edit (Q8: B, Q11: A)', () => {
    it('creates an audit log when attendance status is changed', async () => {
      const a1 = await athleteService.createAthlete({
        teamId,
        athleteCode: 'A01',
        name: 'Player 1',
        startDate: '2026-01-01',
        status: 'ACTIVE',
      });

      const session = await sessionService.createPlannedSession({
        teamId,
        title: 'Drills',
        date: '2026-03-01',
        startTime: '08:00',
        endTime: '10:00',
        createdBy: coachId,
      });

      // Check in as PRESENT initially
      await attendanceService.recordBatchAttendance({
        sessionId: session.id,
        checkedBy: coachId,
        records: [{ athleteId: a1.id, status: 'PRESENT' }],
      });

      // Initial check-in should NOT create audit log (Q11: A)
      const initialLogs = await attendanceService.getSessionAuditLogs(session.id);
      expect(initialLogs.length).toBe(0);

      // Coach later edits status from PRESENT to LEAVE
      const existing = await attendanceRepo.findBySessionAndAthlete(session.id, a1.id);
      expect(existing).not.toBeNull();

      await attendanceService.updateAttendance(existing!.id, {
        status: 'LEAVE',
        changedBy: coachId,
        reason: 'Athlete called with medical excuse',
      });

      // Now audit log MUST exist
      const updatedLogs = await attendanceService.getSessionAuditLogs(session.id);
      expect(updatedLogs.length).toBe(1);
      expect(updatedLogs[0].previousStatus).toBe('PRESENT');
      expect(updatedLogs[0].newStatus).toBe('LEAVE');
      expect(updatedLogs[0].changedBy).toBe(coachId);
      expect(updatedLogs[0].reason).toBe('Athlete called with medical excuse');
    });
  });

  describe('Session Overlap Prevention & Session Cancellation', () => {
    it('prevents creating sessions with overlapping times on the same date', async () => {
      // 1. Create initial session: 08:00 - 10:00
      await sessionService.createPlannedSession({
        teamId,
        title: 'Morning Drills',
        date: '2026-03-01',
        startTime: '08:00',
        endTime: '10:00',
        createdBy: coachId,
      });

      // 2. Overlap case 1: 09:00 - 11:00 (Starts before first ends)
      await expect(
        sessionService.createPlannedSession({
          teamId,
          title: 'Overlapping Session',
          date: '2026-03-01',
          startTime: '09:00',
          endTime: '11:00',
          createdBy: coachId,
        })
      ).rejects.toThrow(/ทับซ้อน/);

      // 3. Overlap case 2: 07:00 - 08:30 (Ends after first starts)
      await expect(
        sessionService.createPlannedSession({
          teamId,
          title: 'Early Overlap',
          date: '2026-03-01',
          startTime: '07:00',
          endTime: '08:30',
          createdBy: coachId,
        })
      ).rejects.toThrow(/ทับซ้อน/);

      // 4. Non-overlapping case: 10:00 - 12:00 (Allowed)
      const s2 = await sessionService.createPlannedSession({
        teamId,
        title: 'Afternoon Drills',
        date: '2026-03-01',
        startTime: '10:00',
        endTime: '12:00',
        createdBy: coachId,
      });
      expect(s2).toBeDefined();

      // 5. Different date: 08:00 - 10:00 on 2026-03-02 (Allowed)
      const s3 = await sessionService.createPlannedSession({
        teamId,
        title: 'Next Day Drills',
        date: '2026-03-02',
        startTime: '08:00',
        endTime: '10:00',
        createdBy: coachId,
      });
      expect(s3).toBeDefined();
    });

    it('cancelling a session deletes it and its attendances so they do not count towards stats', async () => {
      const a1 = await athleteService.createAthlete({
        teamId,
        athleteCode: 'A01',
        name: 'Player 1',
        startDate: '2026-01-01',
        status: 'ACTIVE',
      });

      const session = await sessionService.createPlannedSession({
        teamId,
        title: 'To Be Cancelled',
        date: '2026-03-05',
        startTime: '08:00',
        endTime: '10:00',
        createdBy: coachId,
      });

      // Record check-in
      await attendanceService.recordBatchAttendance({
        sessionId: session.id,
        checkedBy: coachId,
        records: [{ athleteId: a1.id, status: 'ABSENT' }],
      });

      // Verify attendance exists
      const beforeCancel = await attendanceRepo.findBySessionId(session.id);
      expect(beforeCancel.length).toBe(1);

      // Cancel session
      await sessionService.cancelSession(session.id);

      // Verify session and attendances are completely removed
      const afterCancelSession = await sessionRepo.findById(session.id);
      expect(afterCancelSession).toBeNull();

      const afterCancelAtts = await attendanceRepo.findBySessionId(session.id);
      expect(afterCancelAtts.length).toBe(0);
    });
  });
});

