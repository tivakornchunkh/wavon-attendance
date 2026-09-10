import { AttendanceRepository } from '../../server/repositories/attendance.repo';
import { AthleteRepository } from '../../server/repositories/athlete.repo';
import { SessionRepository } from '../../server/repositories/session.repo';
import {
  AthleteAttendanceStats,
  DashboardSummary,
  PeriodicStats,
} from '../domain/statistics';
import { AttendanceStatus } from '../domain/attendance';
import { getBangkokDateTime } from '../../server/helpers/timezone';

export class StatisticsService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private athleteRepo: AthleteRepository,
    private sessionRepo: SessionRepository
  ) {}

  /**
   * คำนวณ Attendance Rate ตามผล Grilling Q1: B
   * สูตร: Present / (Total - Leave) * 100
   * (วันลาจะไม่ถูกนำมาคิดเป็นโทษในตัวหาร)
   */
  calculateAttendanceRate(present: number, total: number, leave: number): number {
    if (total === 0) return 0;
    const effectiveTotal = total - leave;
    if (effectiveTotal <= 0) {
      // ถ้าทุกครั้งที่ผ่านมาเป็นการลาอย่างถูกต้องทั้งหมด ถือว่าไม่มีประวัติขาด (100%)
      return total > 0 ? 100 : 0;
    }
    const rate = (present / effectiveTotal) * 100;
    return Number(Math.min(100, Math.max(0, rate)).toFixed(1));
  }

  /**
   * คำนวณสถิติของนักกีฬาคนหนึ่ง ในช่วงเวลาที่กำหนด
   */
  async getAthleteStats(
    athleteId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AthleteAttendanceStats> {
    const athlete = await this.athleteRepo.findById(athleteId);
    if (!athlete) {
      throw new Error(`Athlete with ID ${athleteId} not found.`);
    }

    const records = await this.attendanceRepo.findByAthlete(athleteId, startDate, endDate);

    let present = 0;
    let absent = 0;
    let leave = 0;

    for (const r of records) {
      if (r.status === 'PRESENT') present++;
      else if (r.status === 'ABSENT') absent++;
      else if (r.status === 'LEAVE') leave++;
    }

    const total = records.length;
    const rate = this.calculateAttendanceRate(present, total, leave);

    return {
      athleteId: athlete.id,
      athleteCode: athlete.athleteCode,
      athleteName: athlete.name,
      status: athlete.status,
      totalSessions: total,
      presentCount: present,
      absentCount: absent,
      leaveCount: leave,
      attendanceRate: rate,
    };
  }

  /**
   * คำนวณสถิติของนักกีฬาทุกคนในทีม (เพื่อจัดอันดับ หรือนำไปแสดงตารางสถิติ)
   */
  async getAllAthletesStats(
    teamId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AthleteAttendanceStats[]> {
    const [athletesList, allRecords] = await Promise.all([
      this.athleteRepo.findByTeam(teamId),
      this.attendanceRepo.findByTeam(teamId, startDate, endDate),
    ]);

    // Group records by athleteId in memory
    const recordsByAthlete = new Map<string, Array<{ status: string }>>();
    for (const r of allRecords) {
      const list = recordsByAthlete.get(r.athleteId) || [];
      list.push(r);
      recordsByAthlete.set(r.athleteId, list);
    }

    const statsList: AthleteAttendanceStats[] = [];

    for (const athlete of athletesList) {
      const records = recordsByAthlete.get(athlete.id) || [];
      let present = 0;
      let absent = 0;
      let leave = 0;

      for (const r of records) {
        if (r.status === 'PRESENT') present++;
        else if (r.status === 'ABSENT') absent++;
        else if (r.status === 'LEAVE') leave++;
      }

      const total = records.length;
      const rate = this.calculateAttendanceRate(present, total, leave);

      statsList.push({
        athleteId: athlete.id,
        athleteCode: athlete.athleteCode,
        athleteName: athlete.name,
        status: athlete.status,
        totalSessions: total,
        presentCount: present,
        absentCount: absent,
        leaveCount: leave,
        attendanceRate: rate,
      });
    }

    return statsList;
  }

  /**
   * ดึงข้อมูลสรุปสำหรับ Dashboard (ตามผล Grilling Q9: C รองรับช่วงเวลา)
   */
  async getDashboardSummary(
    teamId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DashboardSummary> {
    const [allAthletes, sessions, athletesStats] = await Promise.all([
      this.athleteRepo.findByTeam(teamId),
      this.sessionRepo.findByDateRange(teamId, startDate, endDate),
      this.getAllAthletesStats(teamId, startDate, endDate),
    ]);
    const activeAthletes = allAthletes.filter((a) => a.status === 'ACTIVE');

    let totalPresents = 0;
    let totalAbsents = 0;
    let totalLeaves = 0;
    let totalRecords = 0;

    for (const s of athletesStats) {
      totalPresents += s.presentCount;
      totalAbsents += s.absentCount;
      totalLeaves += s.leaveCount;
      totalRecords += s.totalSessions;
    }

    const overallRate = this.calculateAttendanceRate(totalPresents, totalRecords, totalLeaves);

    // สรุปของวันนี้
    const bkk = getBangkokDateTime();
    const today = bkk.dateStr;
    const [todaySessions, todayRecords] = await Promise.all([
      this.sessionRepo.findByDateRange(teamId, today, today),
      this.attendanceRepo.findByTeam(teamId, today, today),
    ]);
    let todaySummary: DashboardSummary['todaySummary'] = undefined;

    if (todaySessions.length > 0) {
      let tPresent = 0;
      let tAbsent = 0;
      let tLeave = 0;

      for (const a of todayRecords) {
        if (a.status === 'PRESENT') tPresent++;
        else if (a.status === 'ABSENT') tAbsent++;
        else if (a.status === 'LEAVE') tLeave++;
      }
      const tTotal = tPresent + tAbsent + tLeave;
      todaySummary = {
        totalSessions: todaySessions.length,
        presentCount: tPresent,
        absentCount: tAbsent,
        leaveCount: tLeave,
        attendanceRate: this.calculateAttendanceRate(tPresent, tTotal, tLeave),
      };
    }

    // จัดอันดับนักกีฬาที่เข้าบ่อยสุด (Top Attendees) - ตามเกณฑ์ Tie-breaker ตัวเลือก 1
    // ลำดับเกณฑ์: Rate สูงสุด -> มาเยอะกว่า -> ขาดน้อยกว่า -> ลาน้อยกว่า -> เรียงชื่อ ก-ฮ
    const frequentAttendees = [...athletesStats]
      .filter((a) => a.totalSessions > 0)
      .sort(
        (a, b) =>
          b.attendanceRate - a.attendanceRate ||
          b.presentCount - a.presentCount ||
          a.absentCount - b.absentCount ||
          a.leaveCount - b.leaveCount ||
          a.athleteName.localeCompare(b.athleteName, 'th')
      )
      .slice(0, 5);

    // จัดอันดับนักกีฬาที่ขาดบ่อยสุด (Top Absentees)
    // ลำดับเกณฑ์: ขาดเยอะสุด -> Rate ต่ำสุด -> มาน้อยกว่า -> เรียงชื่อ ก-ฮ
    const frequentAbsentees = [...athletesStats]
      .filter((a) => a.absentCount > 0)
      .sort(
        (a, b) =>
          b.absentCount - a.absentCount ||
          a.attendanceRate - b.attendanceRate ||
          a.presentCount - b.presentCount ||
          a.athleteName.localeCompare(b.athleteName, 'th')
      )
      .slice(0, 5);

    return {
      totalAthletes: allAthletes.length,
      activeAthletes: activeAthletes.length,
      totalSessions: sessions.length,
      overallAttendanceRate: overallRate,
      todaySummary,
      frequentAttendees,
      frequentAbsentees,
    };
  }

  /**
   * คำนวณสถิติย่อยแบบ Periodic (รายวัน หรือ รายเดือน)
   */
  async getDailyStats(
    teamId: string,
    startDate: string,
    endDate: string
  ): Promise<PeriodicStats[]> {
    const sessions = await this.sessionRepo.findByDateRange(teamId, startDate, endDate);
    const dateMap = new Map<
      string,
      { totalSessions: number; present: number; absent: number; leave: number }
    >();

    for (const session of sessions) {
      const atts = await this.attendanceRepo.findBySessionId(session.id);
      const current = dateMap.get(session.date) || {
        totalSessions: 0,
        present: 0,
        absent: 0,
        leave: 0,
      };

      current.totalSessions += 1;
      for (const a of atts) {
        if (a.status === 'PRESENT') current.present++;
        else if (a.status === 'ABSENT') current.absent++;
        else if (a.status === 'LEAVE') current.leave++;
      }

      dateMap.set(session.date, current);
    }

    const result: PeriodicStats[] = [];
    for (const [date, data] of dateMap.entries()) {
      const totalAtts = data.present + data.absent + data.leave;
      result.push({
        period: date,
        totalSessions: data.totalSessions,
        presentCount: data.present,
        absentCount: data.absent,
        leaveCount: data.leave,
        attendanceRate: this.calculateAttendanceRate(data.present, totalAtts, data.leave),
      });
    }

    return result.sort((a, b) => a.period.localeCompare(b.period));
  }
}

