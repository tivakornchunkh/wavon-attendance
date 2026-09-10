import { SessionRepository } from '../../server/repositories/session.repo';
import { AthleteRepository } from '../../server/repositories/athlete.repo';
import { AttendanceRepository } from '../../server/repositories/attendance.repo';
import { CreateSessionInput, QuickSessionInput, UpdateSessionInput } from '../validators/session.validator';
import { TrainingSession } from '../domain/session';
import { Athlete } from '../domain/athlete';
import { getBangkokDateTime } from '../../server/helpers/timezone';
import crypto from 'crypto';

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private athleteRepo: AthleteRepository,
    private attendanceRepo: AttendanceRepository
  ) {}

  /**
   * ตรวจสอบว่าช่วงเวลาที่ต้องการสร้าง ทับซ้อนกับรอบซ้อมอื่นในวันเดียวกันหรือไม่
   * เงื่อนไขทับซ้อน: (startTime < existing.endTime) && (endTime > existing.startTime)
   */
  async checkSessionOverlap(
    teamId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeSessionId?: string
  ): Promise<TrainingSession | null> {
    const existingSessions = await this.sessionRepo.findByDate(teamId, date);
    for (const session of existingSessions) {
      if (excludeSessionId && session.id === excludeSessionId) continue;
      // เช็คว่าทับซ้อนกันหรือไม่
      if (startTime < session.endTime && endTime > session.startTime) {
        return session;
      }
    }
    return null;
  }

  /**
   * สร้างรอบการฝึกซ้อมแบบระบุเวลาล่วงหน้า (มีระบบป้องกันเวลาซ้อนทับ)
   */
  async createPlannedSession(input: CreateSessionInput): Promise<TrainingSession> {
    if (input.startTime >= input.endTime) {
      throw new Error('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
    }

    const overlap = await this.checkSessionOverlap(
      input.teamId,
      input.date,
      input.startTime,
      input.endTime
    );
    if (overlap) {
      throw new Error(
        `เวลาการฝึกซ้อมทับซ้อนกับรอบ "${overlap.title}" (${overlap.startTime} - ${overlap.endTime} น.)`
      );
    }

    return await this.sessionRepo.create({
      id: crypto.randomUUID(),
      teamId: input.teamId,
      title: input.title.trim(),
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      createdBy: input.createdBy,
    });
  }

  /**
   * สร้างรอบซ้อมด่วนทันที (มีระบบป้องกันเวลาซ้อนทับ)
   */
  async createQuickSession(input: QuickSessionInput): Promise<TrainingSession> {
    const bkk = getBangkokDateTime();
    const date = bkk.dateStr;
    const defaultStartTime = bkk.timeStr;

    const endHour = String((bkk.hours + 1) % 24).padStart(2, '0');
    const defaultEndTime = `${endHour}:${String(bkk.minutes).padStart(2, '0')}`;

    const startTime = input.startTime || defaultStartTime;
    const endTime = input.endTime || defaultEndTime;

    if (startTime >= endTime) {
      throw new Error('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
    }

    const overlap = await this.checkSessionOverlap(
      input.teamId,
      date,
      startTime,
      endTime
    );
    if (overlap) {
      throw new Error(
        `เวลาการฝึกซ้อมทับซ้อนกับรอบ "${overlap.title}" (${overlap.startTime} - ${overlap.endTime} น.)`
      );
    }

    return await this.sessionRepo.create({
      id: crypto.randomUUID(),
      teamId: input.teamId,
      title: input.title.trim() || 'ซ้อมประจำวัน',
      date,
      startTime,
      endTime,
      createdBy: input.createdBy,
    });
  }

  /**
   * ยกเลิกรอบการฝึกซ้อม (ลบออกจากระบบ และข้อมูลการเช็คชื่อทั้งหมดจะถูก Cascade ออกไปด้วย ทำให้ไม่ถูกนำมาคิดในสถิติ)
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Training session with ID ${sessionId} not found.`);
    }
    return await this.sessionRepo.delete(sessionId);
  }

  /**
   * แก้ไขข้อมูลรอบการฝึกซ้อม (วัน, เวลา, หัวข้อ) โดยไม่ต้องสร้างรอบหรือ QR ใหม่
   */
  async updateSession(sessionId: string, input: UpdateSessionInput): Promise<TrainingSession> {
    const existing = await this.sessionRepo.findById(sessionId);
    if (!existing) {
      throw new Error(`ไม่พบรอบการฝึกซ้อมรหัส ${sessionId}`);
    }

    const title = input.title ? input.title.trim() : existing.title;
    const date = input.date ?? existing.date;
    const startTime = input.startTime ?? existing.startTime;
    const endTime = input.endTime ?? existing.endTime;

    if (startTime >= endTime) {
      throw new Error('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
    }

    const overlap = await this.checkSessionOverlap(
      existing.teamId,
      date,
      startTime,
      endTime,
      sessionId
    );
    if (overlap) {
      throw new Error(
        `เวลาการฝึกซ้อมทับซ้อนกับรอบ "${overlap.title}" (${overlap.startTime} - ${overlap.endTime} น.)`
      );
    }

    const updated = await this.sessionRepo.update(sessionId, {
      title,
      date,
      startTime,
      endTime,
    });

    if (!updated) {
      throw new Error('ไม่สามารถบันทึกการแก้ไขรอบการฝึกซ้อมได้');
    }

    return updated;
  }

  /**
   * ดึงรายชื่อนักกีฬาที่ "มีสิทธิ์เข้าซ้อม" ในรอบนี้เพื่อแสดงในหน้าเช็คชื่อ
   * ตามเงื่อนไข Q2: A และ Q5: B
   * 1. ต้องเป็นสถานะ ACTIVE
   * 2. วันที่เริ่มเข้าทีม (startDate) ต้องน้อยกว่าหรือเท่ากับวันที่จัดซ้อม (sessionDate)
   * 3. แนบสถานะเดิมถ้าเคยเช็คชื่อไว้แล้ว (สำหรับแก้ไขย้อนหลัง)
   */
  async getSessionAttendanceRoster(sessionId: string): Promise<{
    session: TrainingSession;
    roster: Array<{
      athlete: Athlete;
      attendanceId?: string;
      status?: 'PRESENT' | 'ABSENT' | 'LEAVE';
      notes?: string | null;
      checkedAt?: string;
    }>;
  }> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Training session with ID ${sessionId} not found.`);
    }

    // 1. ดึงนักกีฬาที่มีสิทธิ์
    const eligibleAthletes = await this.athleteRepo.findEligibleForSession(
      session.teamId,
      session.date
    );

    // 2. ดึงข้อมูลการเช็คชื่อที่เคยบันทึกไว้ในรอบนี้ (ถ้ามี)
    const existingAttendances = await this.attendanceRepo.findBySessionId(sessionId);
    const attendanceMap = new Map(existingAttendances.map((a) => [a.athleteId, a]));

    // 3. รวมเข้าด้วยกันเป็น Roster สำหรับหน้าเช็คชื่อ
    const roster = eligibleAthletes.map((athlete) => {
      const recorded = attendanceMap.get(athlete.id);
      return {
        athlete,
        attendanceId: recorded?.id,
        status: recorded?.status, // หากยังไม่เช็ค จะเป็น undefined (ตรงกับ Q6: C - Unchecked by default)
        notes: recorded?.notes,
        checkedAt: recorded?.checkedAt,
      };
    });

    return { session, roster };
  }

  async getSessions(teamId: string, startDate?: string, endDate?: string) {
    return await this.sessionRepo.findByDateRange(teamId, startDate, endDate);
  }

  async getSessionById(sessionId: string) {
    return await this.sessionRepo.findById(sessionId);
  }
}

