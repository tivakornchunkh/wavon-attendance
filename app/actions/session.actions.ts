'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../../src/server/db/client';
import { trainingSessions, recurringSchedules, teams, users } from '../../src/server/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { getBangkokDateTime } from '../../src/server/helpers/timezone';
import { SessionRepository } from '../../src/server/repositories/session.repo';
import { AthleteRepository } from '../../src/server/repositories/athlete.repo';
import { AttendanceRepository } from '../../src/server/repositories/attendance.repo';
import { SessionService } from '../../src/core/services/session.service';
import { AttendanceService } from '../../src/core/services/attendance.service';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import { CreateSessionSchema } from '../../src/core/validators/session.validator';
import { AttendanceStatus } from '../../src/core/domain/attendance';
import crypto from 'crypto';

const sessionRepo = new SessionRepository(db);
const athleteRepo = new AthleteRepository(db);
const attendanceRepo = new AttendanceRepository(db);

const sessionService = new SessionService(sessionRepo, athleteRepo, attendanceRepo);
const attendanceService = new AttendanceService(attendanceRepo, sessionRepo);

export async function createPlannedSessionAction(formData: FormData): Promise<void> {
  const currentSession = await getCurrentSession();
  const teamId = currentSession.team?.id || DEFAULT_TEAM_ID;
  const coachId = currentSession.user.id;

  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;

  const validated = CreateSessionSchema.parse({
    teamId,
    title,
    date,
    startTime,
    endTime,
    createdBy: coachId,
  });

  const session = await sessionService.createPlannedSession(validated);
  revalidatePath('/sessions');
  redirect(`/sessions/${session.id}`);
}

export async function updateSessionAction(formData: FormData): Promise<{ success: boolean; message: string }> {
  try {
    const sessionId = formData.get('sessionId') as string;
    const title = (formData.get('title') as string)?.trim();
    const date = (formData.get('date') as string)?.trim();
    const startTime = (formData.get('startTime') as string)?.trim();
    const endTime = (formData.get('endTime') as string)?.trim();

    if (!sessionId) {
      throw new Error('ไม่พบรหัสรอบการฝึกซ้อม');
    }

    await sessionService.updateSession(sessionId, {
      title: title || undefined,
      date: date || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });

    try {
      revalidatePath('/sessions');
      revalidatePath(`/sessions/${sessionId}`);
      revalidatePath(`/checkin/${sessionId}`);
      revalidatePath('/');
    } catch {
      // Graceful fallback in non-request test contexts
    }

    return { success: true, message: 'บันทึกการแก้ไขรอบซ้อมเรียบร้อยแล้ว' };
  } catch (err: unknown) {
    console.error('updateSessionAction error:', err);
    throw err;
  }
}

export async function createQuickSessionAction(formData: FormData): Promise<void> {
  const currentSession = await getCurrentSession();
  const teamId = currentSession.team?.id || DEFAULT_TEAM_ID;
  const coachId = currentSession.user.id;
  const title = (formData.get('title') as string) || 'ซ้อมประจำวัน';
  const startTime = (formData.get('startTime') as string) || undefined;
  const endTime = (formData.get('endTime') as string) || undefined;

  const session = await sessionService.createQuickSession({
    teamId,
    title,
    startTime: startTime && startTime.trim() ? startTime.trim() : undefined,
    endTime: endTime && endTime.trim() ? endTime.trim() : undefined,
    createdBy: coachId,
  });

  revalidatePath('/sessions');
  redirect(`/sessions/${session.id}`);
}

export async function submitSessionAttendanceAction(formData: FormData): Promise<void> {
  const currentSession = await getCurrentSession();
  const coachId = currentSession.user.id;
  const sessionId = formData.get('sessionId') as string;

  const athleteIds = formData.getAll('athleteId') as string[];

  const records: { athleteId: string; status: AttendanceStatus; notes?: string | null }[] = [];

  for (const id of athleteIds) {
    const status = formData.get(`status_${id}`) as AttendanceStatus | null;
    const notes = formData.get(`notes_${id}`) as string | null;

    if (status) {
      records.push({
        athleteId: id,
        status,
        notes: notes ? notes.trim() : null,
      });
    }
  }

  if (records.length > 0) {
    await attendanceService.recordBatchAttendance({
      sessionId,
      checkedBy: coachId,
      records,
    });
  }

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/sessions');
  revalidatePath('/');
}

export async function markAllPresentAction(sessionId: string, athleteIds: string[]): Promise<void> {
  const currentSession = await getCurrentSession();
  const coachId = currentSession.user.id;

  await attendanceService.markAllPresent(sessionId, coachId, athleteIds);

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/sessions');
  revalidatePath('/');
}

export async function cancelSessionAction(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sessionService.cancelSession(sessionId);
    revalidatePath('/sessions');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    console.error('Cancel session error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการยกเลิกรอบซ้อม',
    };
  }
}

/**
 * ปิดรอบซ้อมและตัดยอดนักกีฬาที่เหลือเป็น "ขาด (ABSENT)" อัตโนมัติ (2C, 3A, 5A)
 */
export async function closeSessionAndMarkAbsentAction(sessionId: string): Promise<{ markedAbsentCount: number }> {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    throw new Error('ไม่พบข้อมูลรอบการฝึกซ้อมนี้');
  }

  // 1. ดึงนักกีฬาทั้งหมดในทีม
  const allAthletes = await athleteRepo.findByTeam(session.teamId);
  const activeAthletes = allAthletes.filter((a) => a.status === 'ACTIVE');

  // 2. ดึงประวัติการเช็คชื่อที่มีอยู่แล้ว
  const existingAttendances = await attendanceRepo.findBySessionId(sessionId);
  const checkedAthleteIds = new Set(existingAttendances.map((a) => a.athleteId));

  // 3. หานักกีฬาที่ยังไม่ได้เช็คชื่อและไม่ได้แจ้งลา
  const uncheckedAthletes = activeAthletes.filter((a) => !checkedAthleteIds.has(a.id));

  const bkk = getBangkokDateTime();
  const autoAbsentNote = `ขาดซ้อม (ระบบตัดยอดอัตโนมัติเมื่อปิดรอบเวลา ${bkk.timeStr} น.)`;

  if (uncheckedAthletes.length > 0) {
    const absentRecords = uncheckedAthletes.map((a) => ({
      athleteId: a.id,
      status: 'ABSENT' as AttendanceStatus,
      notes: autoAbsentNote,
    }));

    await attendanceRepo.batchUpsert(sessionId, session.createdBy, absentRecords);
  }

  // 4. บันทึกปิดรอบซ้อม (isClosed = 1)
  await db
    .update(trainingSessions)
    .set({ isClosed: 1 })
    .where(eq(trainingSessions.id, sessionId));

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/checkin/${sessionId}`);
  revalidatePath('/sessions');
  revalidatePath('/');

  return { markedAbsentCount: uncheckedAthletes.length };
}

/**
 * ตรวจสอบและตัดยอดรอบซ้อมที่หมดเวลาแล้วโดยอัตโนมัติ (Auto-Close & Auto-Absent Cut-off)
 * 1. รอบซ้อมที่วันที่ผ่านมาแล้ว (date < todayStr)
 * 2. รอบซ้อมของวันนี้ที่เวลาสิ้นสุดผ่านไปแล้ว (date === todayStr && endMinutes <= currentMinutes)
 * นักกีฬาที่ยังไม่ได้เช็คชื่อและไม่ได้แจ้งลา จะถูกบันทึกเป็น "ขาด (ABSENT)" อัตโนมัติทันที
 * และเปลี่ยนสถานะรอบซ้อมเป็น isClosed = 1
 */
export async function autoCloseExpiredSessions(teamId?: string): Promise<{ closedCount: number; totalMarkedAbsent: number }> {
  try {
    const bkk = getBangkokDateTime();
    const todayStr = bkk.dateStr;
    const currentMinutes = bkk.currentMinutes;

    // ดึงรอบซ้อมทั้งหมดที่ยังไม่ได้ปิด (isClosed = 0)
    let openSessions = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.isClosed, 0));

    if (teamId) {
      openSessions = openSessions.filter((s) => s.teamId === teamId);
    }

    let closedCount = 0;
    let totalMarkedAbsent = 0;

    for (const session of openSessions) {
      // ตรวจสอบว่าหมดเวลาหรือยัง
      const isPastDate = session.date < todayStr;

      const [eh, em] = (session.endTime || '00:00').split(':').map(Number);
      const endMinutes = (eh || 0) * 60 + (em || 0);
      const isTodayExpired = session.date === todayStr && endMinutes <= currentMinutes;

      if (isPastDate || isTodayExpired) {
        // 1. ดึงนักกีฬาทั้งหมดในทีม
        const allAthletes = await athleteRepo.findByTeam(session.teamId);
        const activeAthletes = allAthletes.filter((a) => a.status === 'ACTIVE');

        // 2. ดึงประวัติการเช็คชื่อที่มีอยู่แล้ว
        const existingAttendances = await attendanceRepo.findBySessionId(session.id);
        const checkedAthleteIds = new Set(existingAttendances.map((a) => a.athleteId));

        // 3. หานักกีฬาที่ยังไม่ได้เช็คชื่อและไม่ได้แจ้งลา
        const uncheckedAthletes = activeAthletes.filter((a) => !checkedAthleteIds.has(a.id));

        const autoAbsentNote = `ขาดซ้อม (ระบบตัดยอดอัตโนมัติเนื่องจากหมดเวลาซ้อม ${session.endTime} น.)`;

        if (uncheckedAthletes.length > 0) {
          const absentRecords = uncheckedAthletes.map((a) => ({
            athleteId: a.id,
            status: 'ABSENT' as AttendanceStatus,
            notes: autoAbsentNote,
          }));

          await attendanceRepo.batchUpsert(session.id, session.createdBy, absentRecords);
          totalMarkedAbsent += uncheckedAthletes.length;
        }

        // 4. บันทึกปิดรอบซ้อม (isClosed = 1)
        await db
          .update(trainingSessions)
          .set({ isClosed: 1 })
          .where(eq(trainingSessions.id, session.id));

        closedCount++;
      }
    }

    if (closedCount > 0) {
      revalidatePath('/sessions');
      revalidatePath('/');
    }

    return { closedCount, totalMarkedAbsent };
  } catch (err: unknown) {
    console.error('autoCloseExpiredSessions error:', err);
    return { closedCount: 0, totalMarkedAbsent: 0 };
  }
}

/**
 * นักกีฬาสแกน QR เช็คชื่อเข้าซ้อม หรือแจ้งลาซ้อมด้วยตนเอง (4A, 3A, 10B)
 */
export async function selfCheckInAction(
  sessionId: string,
  athleteId: string,
  status: 'PRESENT' | 'LEAVE',
  notes?: string,
  isPitchVerified = true
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return { success: false, message: 'ไม่พบข้อมูลรอบการฝึกซ้อมนี้' };
    }

    // ป้องกันการเช็คชื่อหากรอบถูกปิดแล้ว (3A)
    if (session.isClosed === 1) {
      return { success: false, message: 'รอบการฝึกซ้อมนี้ปิดรับการเช็คชื่อแล้ว กรุณาติดต่อโค้ชผู้ฝึกสอน' };
    }

    // ป้องกันการแอบกด "เข้าซ้อม" จากที่บ้านหากไม่ได้สแกนที่สนามจริง (4A)
    if (status === 'PRESENT' && !isPitchVerified) {
      return {
        success: false,
        message: 'ต้องสแกน QR Code ริมสนามจริงเพื่อเช็คชื่อเข้าซ้อม (หากไม่ได้มาสนาม สามารถกดแท็บ "แจ้งลาซ้อม" ได้ทันที)',
      };
    }

    const athlete = await athleteRepo.findById(athleteId);
    if (!athlete) {
      return { success: false, message: 'ไม่พบข้อมูลนักกีฬาในระบบ' };
    }

    if (athlete.teamId !== session.teamId) {
      return { success: false, message: 'นักกีฬาไม่ได้สังกัดในสโมสรของรอบฝึกซ้อมนี้' };
    }

  const noteText = notes && notes.trim()
    ? notes.trim()
    : status === 'PRESENT'
    ? 'สแกน QR ริมสนาม'
    : 'แจ้งลาซ้อมผ่านระบบ';

  await attendanceRepo.batchUpsert(
    sessionId,
    session.createdBy,
    [
      {
        athleteId,
        status: status as AttendanceStatus,
        notes: noteText,
      },
    ]
  );

  revalidatePath(`/checkin/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/sessions');
  revalidatePath('/');

    return {
      success: true,
      message: status === 'PRESENT' ? 'เช็คชื่อเข้าซ้อมเรียบร้อยแล้ว!' : 'บันทึกการแจ้งลาซ้อมเรียบร้อยแล้ว',
    };
  } catch (err: unknown) {
    console.error('selfCheckInAction error:', err);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ฝึกสอน',
    };
  }
}

/**
 * ดึงรายการตารางซ้อมประจำทั้งหมดของสโมสร (รองรับหลายช่วงเวลาใน 1 วัน เช่น เช้า/เย็น)
 */
export async function getRecurringSchedulesAction(teamId: string) {
  return await db
    .select()
    .from(recurringSchedules)
    .where(eq(recurringSchedules.teamId, teamId))
    .orderBy(recurringSchedules.startTime);
}

/**
 * ดึงตารางซ้อมประจำหลัก (สำหรับ backward compatibility)
 */
export async function getRecurringScheduleAction(teamId: string) {
  const [schedule] = await db
    .select()
    .from(recurringSchedules)
    .where(eq(recurringSchedules.teamId, teamId))
    .limit(1);

  return schedule || null;
}

/**
 * บันทึกหรือสร้างช่วงเวลาซ้อมประจำสัปดาห์ (รองรับหลายรอบต่อวัน)
 */
export async function saveRecurringScheduleSlotAction(formData: FormData): Promise<void> {
  const currentSession = await getCurrentSession();
  const teamId = currentSession.team?.id || DEFAULT_TEAM_ID;

  const id = (formData.get('id') as string)?.trim();
  const daysOfWeek = formData.get('daysOfWeek') as string; // JSON e.g. "[1,2,3,4,5]"
  const startTime = (formData.get('startTime') as string)?.trim() || '17:00';
  const endTime = (formData.get('endTime') as string)?.trim() || '19:00';
  const title = (formData.get('title') as string)?.trim() || 'ซ้อมประจำวัน';
  const isActive = formData.get('isActive') === '0' ? 0 : 1;

  if (!daysOfWeek) {
    throw new Error('กรุณาเลือกวันฝึกซ้อมอย่างน้อย 1 วัน');
  }

  if (startTime >= endTime) {
    throw new Error('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
  }

  if (id) {
    await db
      .update(recurringSchedules)
      .set({
        daysOfWeek,
        startTime,
        endTime,
        title,
        isActive,
      })
      .where(and(eq(recurringSchedules.id, id), eq(recurringSchedules.teamId, teamId)));
  } else {
    await db.insert(recurringSchedules).values({
      id: `rec-${crypto.randomUUID().slice(0, 8)}`,
      teamId,
      daysOfWeek,
      startTime,
      endTime,
      title,
      isActive,
    });
  }

  revalidatePath('/sessions');
}

/**
 * ลบช่วงเวลาซ้อมประจำ
 */
export async function deleteRecurringScheduleSlotAction(slotId: string): Promise<void> {
  const currentSession = await getCurrentSession();
  const teamId = currentSession.team?.id || DEFAULT_TEAM_ID;

  await db
    .delete(recurringSchedules)
    .where(and(eq(recurringSchedules.id, slotId), eq(recurringSchedules.teamId, teamId)));

  revalidatePath('/sessions');
}

/**
 * บันทึกตารางซ้อมประจำสัปดาห์แบบเดี่ยว (สำหรับ backward compatibility)
 */
export async function saveRecurringScheduleAction(formData: FormData): Promise<void> {
  await saveRecurringScheduleSlotAction(formData);
}

/**
 * รีเซ็ตและสร้าง QR Token ใหม่สำหรับสโมสร (กรณีต้องการยกเลิกป้ายเก่า)
 */
export async function regeneratePermanentQrAction(teamId: string): Promise<{ success: boolean; token: string }> {
  const newToken = `qr_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  await db
    .update(teams)
    .set({ permanentQrToken: newToken })
    .where(eq(teams.id, teamId));

  try {
    revalidatePath('/sessions');
  } catch {
    // Graceful fallback in non-request test contexts
  }
  return { success: true, token: newToken };
}

/**
 * ตรวจสอบและสร้างรอบซ้อมประจำวันของวันนี้โดยอัตโนมัติ
 * รองรับหลายรอบใน 1 วัน (เช่น ซ้อมเช้า 06:00-08:00 และ ซ้อมเย็น 17:00-19:00)
 */
export async function ensureTodayRecurringSession(teamId: string) {
  try {
    const bkk = getBangkokDateTime();
    const todayStr = bkk.dateStr;
    const todayDayOfWeek = bkk.dayOfWeek; // 0=Sun, 1=Mon...

    // 1. ดึงตารางซ้อมประจำของทีมทั้งหมดที่เปิดใช้งานอยู่
    const schedules = await db
      .select()
      .from(recurringSchedules)
      .where(and(eq(recurringSchedules.teamId, teamId), eq(recurringSchedules.isActive, 1)));

    if (schedules.length === 0) {
      return [];
    }

    // 2. ดึงรอบซ้อมของวันนี้ทั้งหมดที่มีอยู่แล้ว
    const todaySessions = await db
      .select()
      .from(trainingSessions)
      .where(and(eq(trainingSessions.teamId, teamId), eq(trainingSessions.date, todayStr)));

    const [coach] = await db.select().from(users).where(eq(users.teamId, teamId)).limit(1);
    const [firstUser] = await db.select().from(users).limit(1);
    const creatorId = coach?.id || firstUser?.id || 'coach_default';

    const createdList = [];

    for (const schedule of schedules) {
      const days: number[] = JSON.parse(schedule.daysOfWeek || '[]');
      if (!days.includes(todayDayOfWeek)) continue;

      // ตรวจสอบว่ามีรอบซ้อมที่เวลาตรงกันถูกสร้างไว้แล้วหรือไม่
      const alreadyExists = todaySessions.some(
        (s) => s.startTime === schedule.startTime && s.endTime === schedule.endTime
      );

      if (!alreadyExists) {
        const newSessionId = `sess-${crypto.randomUUID().slice(0, 8)}`;
        await db.insert(trainingSessions).values({
          id: newSessionId,
          teamId,
          title: schedule.title || 'ซ้อมประจำวัน',
          date: todayStr,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          createdBy: creatorId,
          isClosed: 0,
        });

        const [createdSession] = await db
          .select()
          .from(trainingSessions)
          .where(eq(trainingSessions.id, newSessionId))
          .limit(1);

        if (createdSession) {
          createdList.push(createdSession);
        }
      }
    }

    return createdList;
  } catch (err: unknown) {
    console.error('ensureTodayRecurringSession error:', err);
    return [];
  }
}

/**
 * ค้นหาหรือจับคู่รอบซ้อมปัจจุบันของสโมสรสำหรับป้าย QR Code ถาวรประจำสนาม
 * รองรับการค้นหาผ่าน teamId หรือ permanentQrToken
 * รองรับหลายรอบต่อวัน (จับคู่รอบตามเวลาจริง ณ ขณะที่สแกน)
 */
export async function resolveClubActiveSession(clubIdOrToken: string): Promise<{
  activeSession: { id: string; title: string; date: string; startTime: string; endTime: string; isClosed: number } | null;
  clubName: string;
  nextScheduleInfo?: string;
}> {
  const [club] = await db
    .select()
    .from(teams)
    .where(or(eq(teams.id, clubIdOrToken), eq(teams.permanentQrToken, clubIdOrToken)))
    .limit(1);

  if (!club) {
    throw new Error('ไม่พบสโมสรนี้ในระบบ หรือคิวอาร์โค้ดนี้ถูกยกเลิกแล้ว');
  }

  const clubId = club.id;

  // สร้างรอบซ้อมประจำวันของวันนี้อัตโนมัติหากตรงกับตาราง (รองรับสร้างหลายรอบ)
  await ensureTodayRecurringSession(clubId);

  const bkk = getBangkokDateTime();
  const todayStr = bkk.dateStr;
  const currentMinutes = bkk.currentMinutes;

  // ค้นหารอบซ้อมของวันนี้ทั้งหมด
  const todaySessions = await db
    .select()
    .from(trainingSessions)
    .where(and(eq(trainingSessions.teamId, clubId), eq(trainingSessions.date, todayStr)))
    .orderBy(trainingSessions.startTime);

  // 1. ตรวจสอบรอบซ้อมของวันนี้ที่อยู่ในช่วงเวลาฝึกซ้อมจริง (ก่อนเริ่ม 30 นาที จนถึงเวลาเลิกซ้อม + 15 นาที)
  for (const s of todaySessions) {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const startM = Math.max(0, (sh || 0) * 60 + (sm || 0) - 30); // เปิดให้เช็คชื่อก่อนเริ่ม 30 นาที
    const endM = (eh || 0) * 60 + (em || 0) + 15; // ปิดหลังเวลาเลิก 15 นาที

    if (currentMinutes >= startM && currentMinutes <= endM && s.isClosed !== 1) {
      return {
        activeSession: {
          id: s.id,
          title: s.title,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          isClosed: s.isClosed ?? 0,
        },
        clubName: club.name,
      };
    }
  }

  // 2. หากยังไม่ถึงเวลาเปิดรอบ ให้ดูว่ามีรอบถัดไปของวันนี้ที่ยังไม่เริ่มหรือไม่
  const upcomingToday = todaySessions
    .filter((s) => s.isClosed !== 1)
    .find((s) => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const startM = Math.max(0, (sh || 0) * 60 + (sm || 0) - 30);
      return currentMinutes < startM;
    });

  if (upcomingToday) {
    return {
      activeSession: null,
      clubName: club.name,
      nextScheduleInfo: `รอบถัดไปของวันนี้: "${upcomingToday.title}" เวลา ${upcomingToday.startTime} - ${upcomingToday.endTime} น. (ระบบเปิดให้เช็คชื่อ 30 นาทีก่อนเริ่มซ้อม)`,
    };
  }

  // 3. หากรอบของวันนี้จบหมดแล้ว
  const allSchedules = await db
    .select()
    .from(recurringSchedules)
    .where(and(eq(recurringSchedules.teamId, clubId), eq(recurringSchedules.isActive, 1)))
    .orderBy(recurringSchedules.startTime);

  const hasExpiredSessionsToday =
    todaySessions.length > 0 &&
    todaySessions.every((s) => {
      if (s.isClosed === 1) return true;
      const [eh, em] = s.endTime.split(':').map(Number);
      return currentMinutes > (eh || 0) * 60 + (em || 0) + 15;
    });

  if (hasExpiredSessionsToday) {
    return {
      activeSession: null,
      clubName: club.name,
      nextScheduleInfo: 'รอบการฝึกซ้อมของวันนี้เสร็จสิ้นแล้ว ขอบคุณนักกีฬาทุกคนที่เข้าฝึกซ้อม!',
    };
  }

  if (allSchedules.length > 0) {
    const scheduleDescriptions = allSchedules.map((s) => `${s.title} (${s.startTime}-${s.endTime} น.)`).join(', ');
    return {
      activeSession: null,
      clubName: club.name,
      nextScheduleInfo: `ตารางซ้อมประจำสโมสร: ${scheduleDescriptions}`,
    };
  }

  return {
    activeSession: null,
    clubName: club.name,
    nextScheduleInfo: 'ยังไม่มีตารางการฝึกซ้อมที่เปิดอยู่ในขณะนี้',
  };
}
