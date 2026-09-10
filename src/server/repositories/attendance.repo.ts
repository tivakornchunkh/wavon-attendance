import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { DatabaseInstance } from '../db/client';
import { attendances, attendanceLogs, athletes, trainingSessions } from '../db/schema';
import { Attendance, AttendanceLog, AttendanceStatus } from '../../core/domain/attendance';
import crypto from 'crypto';

export class AttendanceRepository {
  constructor(private db: DatabaseInstance) {}

  async findBySessionId(sessionId: string): Promise<Attendance[]> {
    const results = await this.db
      .select()
      .from(attendances)
      .where(eq(attendances.sessionId, sessionId));
    return results as Attendance[];
  }

  async findBySessionAndAthlete(sessionId: string, athleteId: string): Promise<Attendance | null> {
    const results = await this.db
      .select()
      .from(attendances)
      .where(and(eq(attendances.sessionId, sessionId), eq(attendances.athleteId, athleteId)))
      .limit(1);
    return (results[0] as Attendance) || null;
  }

  /**
   * Batch upsert: ถ้ามีอยู่แล้วให้ update status ถ้ายังไม่มีให้ insert
   * และถ้าเป็นการเปลี่ยนสถานะจากเดิม จะบันทึก Audit Log เข้า attendance_logs ตามเงื่อนไข Q8/Q11
   */
  async batchUpsert(
    sessionId: string,
    checkedBy: string,
    records: { athleteId: string; status: AttendanceStatus; notes?: string | null }[]
  ): Promise<{ inserted: number; updated: number; logsCreated: number }> {
    let inserted = 0;
    let updated = 0;
    let logsCreated = 0;

    for (const record of records) {
      const existing = await this.findBySessionAndAthlete(sessionId, record.athleteId);

      if (existing) {
        // มีข้อมูลอยู่แล้ว -> ตรวจสอบว่าสถานะเปลี่ยนหรือไม่
        if (existing.status !== record.status) {
          // 1. Update attendance status
          await this.db
            .update(attendances)
            .set({
              status: record.status,
              notes: record.notes !== undefined ? record.notes : existing.notes,
              checkedBy,
              checkedAt: new Date().toISOString(),
            })
            .where(eq(attendances.id, existing.id));

          // 2. บันทึก Audit Log เฉพาะเมื่อสถานะเปลี่ยน (ตาม Q8: B, Q11: A)
          await this.db.insert(attendanceLogs).values({
            id: crypto.randomUUID(),
            attendanceId: existing.id,
            sessionId,
            athleteId: record.athleteId,
            previousStatus: existing.status,
            newStatus: record.status,
            changedBy: checkedBy,
            changedAt: new Date().toISOString(),
            reason: record.notes || 'Batch attendance update',
          });

          updated++;
          logsCreated++;
        } else if (record.notes !== undefined && record.notes !== existing.notes) {
          // สถานะเดิม แต่แก้นทึก
          await this.db
            .update(attendances)
            .set({
              notes: record.notes,
              checkedBy,
            })
            .where(eq(attendances.id, existing.id));
          updated++;
        }
      } else {
        // รายการใหม่ -> Insert
        await this.db.insert(attendances).values({
          id: crypto.randomUUID(),
          sessionId,
          athleteId: record.athleteId,
          status: record.status,
          checkedBy,
          checkedAt: new Date().toISOString(),
          notes: record.notes || null,
        });
        inserted++;
      }
    }

    return { inserted, updated, logsCreated };
  }

  /**
   * แก้ไขสถานะเช็คชื่อรายบุคคลย้อนหลัง พร้อมบันทึก Audit Log
   */
  async updateStatusWithAudit(
    attendanceId: string,
    newStatus: AttendanceStatus,
    changedBy: string,
    reason?: string | null,
    notes?: string | null
  ): Promise<Attendance | null> {
    const existing = await this.db
      .select()
      .from(attendances)
      .where(eq(attendances.id, attendanceId))
      .limit(1);

    if (!existing || existing.length === 0) {
      return null;
    }

    const currentRecord = existing[0] as Attendance;
    const prevStatus = currentRecord.status;

    // ทำการ update
    const [updated] = await this.db
      .update(attendances)
      .set({
        status: newStatus,
        notes: notes !== undefined ? notes : currentRecord.notes,
        checkedBy: changedBy,
        checkedAt: new Date().toISOString(),
      })
      .where(eq(attendances.id, attendanceId))
      .returning();

    // บันทึก Log เฉพาะเมื่อสถานะเปลี่ยน (Q11: A)
    if (prevStatus !== newStatus) {
      await this.db.insert(attendanceLogs).values({
        id: crypto.randomUUID(),
        attendanceId,
        sessionId: currentRecord.sessionId,
        athleteId: currentRecord.athleteId,
        previousStatus: prevStatus,
        newStatus,
        changedBy,
        changedAt: new Date().toISOString(),
        reason: reason || null,
      });
    }

    return updated as Attendance;
  }

  async findByAthlete(
    athleteId: string,
    startDate?: string,
    endDate?: string
  ): Promise<(Attendance & { sessionDate: string; sessionTitle: string })[]> {
    const query = this.db
      .select({
        id: attendances.id,
        sessionId: attendances.sessionId,
        athleteId: attendances.athleteId,
        status: attendances.status,
        checkedAt: attendances.checkedAt,
        checkedBy: attendances.checkedBy,
        notes: attendances.notes,
        sessionDate: trainingSessions.date,
        sessionTitle: trainingSessions.title,
      })
      .from(attendances)
      .innerJoin(trainingSessions, eq(attendances.sessionId, trainingSessions.id))
      .where(eq(attendances.athleteId, athleteId));

    const results = await query;

    // Filter by date range if provided
    return results.filter((r) => {
      if (startDate && r.sessionDate < startDate) return false;
      if (endDate && r.sessionDate > endDate) return false;
      return true;
    }) as (Attendance & { sessionDate: string; sessionTitle: string })[];
  }

  async findByTeam(
    teamId: string,
    startDate?: string,
    endDate?: string
  ): Promise<(Attendance & { sessionDate: string; sessionTitle: string })[]> {
    const results = await this.db
      .select({
        id: attendances.id,
        sessionId: attendances.sessionId,
        athleteId: attendances.athleteId,
        status: attendances.status,
        checkedAt: attendances.checkedAt,
        checkedBy: attendances.checkedBy,
        notes: attendances.notes,
        sessionDate: trainingSessions.date,
        sessionTitle: trainingSessions.title,
      })
      .from(attendances)
      .innerJoin(trainingSessions, eq(attendances.sessionId, trainingSessions.id))
      .where(eq(trainingSessions.teamId, teamId));

    return results.filter((r) => {
      if (startDate && r.sessionDate < startDate) return false;
      if (endDate && r.sessionDate > endDate) return false;
      return true;
    }) as (Attendance & { sessionDate: string; sessionTitle: string })[];
  }

  async findLogsByAttendanceId(attendanceId: string): Promise<AttendanceLog[]> {
    const results = await this.db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.attendanceId, attendanceId))
      .orderBy(desc(attendanceLogs.changedAt));
    return results as AttendanceLog[];
  }

  async findLogsBySessionId(sessionId: string): Promise<AttendanceLog[]> {
    const results = await this.db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.sessionId, sessionId))
      .orderBy(desc(attendanceLogs.changedAt));
    return results as AttendanceLog[];
  }
}

