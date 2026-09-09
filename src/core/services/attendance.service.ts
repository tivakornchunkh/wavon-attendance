import { AttendanceRepository } from '../../server/repositories/attendance.repo';
import { SessionRepository } from '../../server/repositories/session.repo';
import {
  BatchRecordAttendanceInput,
  UpdateAttendanceStatusInput,
} from '../validators/attendance.validator';
import { Attendance, AttendanceLog } from '../domain/attendance';

export class AttendanceService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private sessionRepo: SessionRepository
  ) {}

  /**
   * บันทึกการเช็คชื่อแบบกลุ่ม (Batch)
   * ป้องกันการสร้างข้อมูลซ้ำ และตรวจจับการแก้สถานะเพื่อลง Audit Log อัตโนมัติ
   */
  async recordBatchAttendance(input: BatchRecordAttendanceInput) {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new Error(`Training session with ID ${input.sessionId} not found.`);
    }

    return await this.attendanceRepo.batchUpsert(
      input.sessionId,
      input.checkedBy,
      input.records
    );
  }

  /**
   * ตัวช่วย: บันทึกว่ามาทุกคน (Mark All as Present Helper ตามผล Grilling Q6: C)
   */
  async markAllPresent(
    sessionId: string,
    coachId: string,
    athleteIds: string[]
  ) {
    const records = athleteIds.map((athleteId) => ({
      athleteId,
      status: 'PRESENT' as const,
    }));

    return await this.recordBatchAttendance({
      sessionId,
      checkedBy: coachId,
      records,
    });
  }

  /**
   * แก้ไขสถานะการเช็คชื่อย้อนหลังรายบุคคล พร้อมบันทึก Audit Log (ตามผล Grilling Q8: B และ Q11: A)
   */
  async updateAttendance(
    attendanceId: string,
    input: UpdateAttendanceStatusInput
  ): Promise<Attendance> {
    const updated = await this.attendanceRepo.updateStatusWithAudit(
      attendanceId,
      input.status,
      input.changedBy,
      input.reason,
      input.notes
    );

    if (!updated) {
      throw new Error(`Attendance record with ID ${attendanceId} not found.`);
    }

    return updated;
  }

  /**
   * ดูประวัติ Audit Log ของการเช็คชื่อในรอบซ้อม
   */
  async getSessionAuditLogs(sessionId: string): Promise<AttendanceLog[]> {
    return await this.attendanceRepo.findLogsBySessionId(sessionId);
  }

  /**
   * ดูประวัติการเช็คชื่อของนักกีฬาคนหนึ่ง
   */
  async getAthleteAttendanceHistory(
    athleteId: string,
    startDate?: string,
    endDate?: string
  ) {
    return await this.attendanceRepo.findByAthlete(athleteId, startDate, endDate);
  }
}

