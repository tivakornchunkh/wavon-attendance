import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './test-db';
import { StatisticsService } from '../src/core/services/statistics.service';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { teams, users, athletes, trainingSessions, attendances } from '../src/server/db/schema';

describe('Export, Filters, and Athlete Profile Queries', () => {
  let statsService: StatisticsService;
  let attendanceRepo: AttendanceRepository;
  let athleteRepo: AthleteRepository;
  let sessionRepo: SessionRepository;
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    attendanceRepo = new AttendanceRepository(testDb);
    athleteRepo = new AthleteRepository(testDb);
    sessionRepo = new SessionRepository(testDb);
    statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);

    // Setup 2 Teams
    await testDb.insert(teams).values([
      { id: 'team-a', name: 'สโมสร A' },
      { id: 'team-b', name: 'สโมสร B' },
    ]);

    // Setup 2 Coaches
    await testDb.insert(users).values([
      { id: 'coach-a', teamId: 'team-a', name: 'โค้ชเอ', username: 'coach_a', passwordHash: 'hash', role: 'COACH' },
      { id: 'coach-b', teamId: 'team-b', name: 'โค้ชบี', username: 'coach_b', passwordHash: 'hash', role: 'COACH' },
    ]);

    // Setup Athletes
    await testDb.insert(athletes).values([
      { id: 'ath-a1', teamId: 'team-a', athleteCode: 'A001', name: 'สมชาย นักวิ่ง', startDate: '2026-01-01', status: 'ACTIVE' },
      { id: 'ath-b1', teamId: 'team-b', athleteCode: 'B001', name: 'สมปอง สายฟ้า', startDate: '2026-01-01', status: 'ACTIVE' },
    ]);

    // Setup Sessions with different dates: Jan 2026, Feb 2026, Mar 2026
    await testDb.insert(trainingSessions).values([
      { id: 'sess-jan', teamId: 'team-a', title: 'ซ้อม ม.ค.', date: '2026-01-15', startTime: '08:00', endTime: '10:00', createdBy: 'coach-a' },
      { id: 'sess-feb', teamId: 'team-a', title: 'ซ้อม ก.พ.', date: '2026-02-15', startTime: '08:00', endTime: '10:00', createdBy: 'coach-a' },
      { id: 'sess-mar', teamId: 'team-a', title: 'ซ้อม มี.ค.', date: '2026-03-15', startTime: '08:00', endTime: '10:00', createdBy: 'coach-a' },
    ]);

    // Setup Attendances
    await testDb.insert(attendances).values([
      { id: 'att-1', sessionId: 'sess-jan', athleteId: 'ath-a1', status: 'PRESENT', checkedBy: 'coach-a', notes: 'ซ้อมตรงเวลา' },
      { id: 'att-2', sessionId: 'sess-feb', athleteId: 'ath-a1', status: 'ABSENT', checkedBy: 'coach-a', notes: 'ติดธุระ' },
      { id: 'att-3', sessionId: 'sess-mar', athleteId: 'ath-a1', status: 'PRESENT', checkedBy: 'coach-a', notes: 'ฟอร์มดีมาก' },
    ]);
  });

  describe('Date Range Filtering', () => {
    it('returns all sessions and attendances when no date filter is applied', async () => {
      const stats = await statsService.getDashboardSummary('team-a');
      const allAthletes = await statsService.getAllAthletesStats('team-a');

      expect(stats.totalSessions).toBe(3);
      expect(allAthletes[0].totalSessions).toBe(3);
      expect(allAthletes[0].presentCount).toBe(2);
      expect(allAthletes[0].absentCount).toBe(1);
    });

    it('filters sessions correctly by start and end date (Feb 2026 only)', async () => {
      const stats = await statsService.getDashboardSummary('team-a', '2026-02-01', '2026-02-28');
      const allAthletes = await statsService.getAllAthletesStats('team-a', '2026-02-01', '2026-02-28');

      expect(stats.totalSessions).toBe(1);
      expect(allAthletes[0].totalSessions).toBe(1);
      expect(allAthletes[0].presentCount).toBe(0);
      expect(allAthletes[0].absentCount).toBe(1);
      expect(allAthletes[0].attendanceRate).toBe(0);
    });

    it('filters sessions correctly by start and end date (Jan - Feb 2026)', async () => {
      const stats = await statsService.getDashboardSummary('team-a', '2026-01-01', '2026-02-28');
      const allAthletes = await statsService.getAllAthletesStats('team-a', '2026-01-01', '2026-02-28');

      expect(stats.totalSessions).toBe(2);
      expect(allAthletes[0].totalSessions).toBe(2);
      expect(allAthletes[0].presentCount).toBe(1);
      expect(allAthletes[0].absentCount).toBe(1);
      expect(allAthletes[0].attendanceRate).toBe(50);
    });
  });

  describe('Athlete Profile History (findByAthlete)', () => {
    it('returns full attendance history with session details', async () => {
      const history = await attendanceRepo.findByAthlete('ath-a1');
      expect(history.length).toBe(3);

      const janRecord = history.find((h) => h.sessionId === 'sess-jan');
      expect(janRecord).toBeDefined();
      expect(janRecord?.sessionTitle).toBe('ซ้อม ม.ค.');
      expect(janRecord?.sessionDate).toBe('2026-01-15');
      expect(janRecord?.status).toBe('PRESENT');
      expect(janRecord?.notes).toBe('ซ้อมตรงเวลา');
    });

    it('returns empty history for athlete with no attendance', async () => {
      const history = await attendanceRepo.findByAthlete('ath-b1');
      expect(history).toEqual([]);
    });

    it('filters athlete history by date range', async () => {
      const history = await attendanceRepo.findByAthlete('ath-a1', '2026-03-01', '2026-03-31');
      expect(history.length).toBe(1);
      expect(history[0].sessionTitle).toBe('ซ้อม มี.ค.');
    });
  });

  describe('Multi-club Isolation in Statistics and Athlete Profile', () => {
    it('prevents cross-club data pollution between Team A and Team B', async () => {
      const statsTeamA = await statsService.getDashboardSummary('team-a');
      const statsTeamB = await statsService.getDashboardSummary('team-b');
      const athletesA = await statsService.getAllAthletesStats('team-a');
      const athletesB = await statsService.getAllAthletesStats('team-b');

      expect(statsTeamA.totalAthletes).toBe(1);
      expect(statsTeamB.totalAthletes).toBe(1);
      expect(athletesA[0].athleteName).toBe('สมชาย นักวิ่ง');
      expect(athletesB[0].athleteName).toBe('สมปอง สายฟ้า');
      expect(statsTeamB.totalSessions).toBe(0);
    });
  });

  describe('CSV Generation Format and Executive Summary', () => {
    it('generates executive summary CSV with UTF-8 BOM, KPIs, and Total row', async () => {
      const stats = await statsService.getAllAthletesStats('team-a');
      const sessions = await sessionRepo.findByDateRange('team-a');

      let totalPresents = 0;
      let totalAbsents = 0;
      let totalLeaves = 0;
      let activeCount = 0;
      for (const s of stats) {
        totalPresents += s.presentCount;
        totalAbsents += s.absentCount;
        totalLeaves += s.leaveCount;
        if (s.status === 'ACTIVE') activeCount++;
      }
      const totalRec = totalPresents + totalAbsents + totalLeaves;
      const overallRate = statsService.calculateAttendanceRate(totalPresents, totalRec, totalLeaves);

      const lines: string[] = [
        `"รายงานสรุปสถิติการเข้าฝึกซ้อมนักกีฬา (Attendance Summary Report)"`,
        `"สโมสร:","สโมสร A"`,
        `""`,
        `"=== สรุปภาพรวมสโมสร (Executive Summary) ==="`,
        `"จำนวนนักกีฬาทั้งหมด:","${stats.length} คน"`,
        `"จำนวนรอบฝึกซ้อมทั้งหมด:","${sessions.length} รอบ"`,
        `"อัตราการเข้าซ้อมเฉลี่ยรวม:","${overallRate}%"`,
        `""`,
        `"=== ตารางสถิติรายบุคคล (Individual Athletes Attendance) ==="`,
        `"ลำดับ","รหัสนักกีฬา","ชื่อ - นามสกุล","สถานะ","รอบที่บันทึก (ครั้ง)","มา (ครั้ง)","ขาด (ครั้ง)","ลา (ครั้ง)","อัตราเข้าซ้อม (%)","ระดับความสม่ำเสมอ"`,
        ...stats.map((item, idx) => [
          idx + 1,
          `"${item.athleteCode}"`,
          `"${item.athleteName}"`,
          item.status === 'ACTIVE' ? '"ใช้งานปกติ (Active)"' : '"พักซ้อม (Inactive)"',
          item.totalSessions,
          item.presentCount,
          item.absentCount,
          item.leaveCount,
          `"${item.attendanceRate}%"`,
          item.attendanceRate >= 80 ? '"🟢 สม่ำเสมอดีเยี่ยม (80%+)"' : '"🟡 ปานกลาง"',
        ].join(',')),
        `""`,
        `"","รวมทั้งสิ้น","${stats.length} คน","Active ${activeCount} คน","${sessions.length} รอบ","${totalPresents}","${totalAbsents}","${totalLeaves}","${overallRate}%"`,
      ];

      const fullCsv = '\uFEFF' + lines.join('\r\n');

      expect(fullCsv.startsWith('\uFEFF')).toBe(true);
      expect(fullCsv).toContain('รายงานสรุปสถิติการเข้าฝึกซ้อมนักกีฬา');
      expect(fullCsv).toContain('Executive Summary');
      expect(fullCsv).toContain('สมชาย นักวิ่ง');
      expect(fullCsv).toContain('รวมทั้งสิ้น');
      expect(fullCsv).toContain('🟡 ปานกลาง');
    });

    it('generates individual athlete slip CSV format', async () => {
      const history = await attendanceRepo.findByAthlete('ath-a1');
      const athlete = await athleteRepo.findById('ath-a1');

      const lines: string[] = [
        `"รายงานสรุปสถิติการฝึกซ้อมรายบุคคล (Individual Attendance Slip)"`,
        `"ชื่อ - นามสกุล:","${athlete?.name}"`,
        `"รหัสนักกีฬา:","${athlete?.athleteCode}"`,
        `""`,
        `"=== ประวัติการเข้าฝึกซ้อมแต่ละรอบ (Timeline) ==="`,
        ...history.map((h, idx) => [
          idx + 1,
          `"${h.sessionDate}"`,
          `"${h.sessionTitle}"`,
          h.status,
        ].join(',')),
      ];

      const fullCsv = '\uFEFF' + lines.join('\r\n');
      expect(fullCsv).toContain('Individual Attendance Slip');
      expect(fullCsv).toContain('สมชาย นักวิ่ง');
      expect(fullCsv).toContain('ซ้อม ม.ค.');
    });
  });
});
