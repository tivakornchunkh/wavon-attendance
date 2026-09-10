'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../../src/server/db/client';
import { trainingSessions, recurringSchedules, teams, users } from '../../src/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
 * บันทึกตารางซ้อมประจำสัปดาห์ (12A)
 */
export async function saveRecurringScheduleAction(formData: FormData): Promise<void> {
  const currentSession = await getCurrentSession();
  const teamId = currentSession.team?.id || DEFAULT_TEAM_ID;

  const daysOfWeek = formData.get('daysOfWeek') as string; // JSON e.g. "[1,2,3,4,5]"
  const startTime = (formData.get('startTime') as string)?.trim() || '17:00';
  const endTime = (formData.get('endTime') as string)?.trim() || '19:00';
  const title = (formData.get('title') as string)?.trim() || 'ซ้อมประจำวัน';
  const isActive = formData.get('isActive') === '0' ? 0 : 1;

  if (!daysOfWeek) {
    throw new Error('กรุณาเลือกวันฝึกซ้อมอย่างน้อย 1 วัน');
  }

  // ตรวจสอบว่ามีตารางเดิมอยู่แล้วหรือไม่
  const [existing] = await db
    .select()
    .from(recurringSchedules)
    .where(eq(recurringSchedules.teamId, teamId))
    .limit(1);

  if (existing) {
    await db
      .update(recurringSchedules)
      .set({
        daysOfWeek,
        startTime,
        endTime,
        title,
        isActive,
      })
      .where(eq(recurringSchedules.id, existing.id));
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
 * ดึงตารางซ้อมประจำสัปดาห์ของสโมสร
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
 * ตรวจสอบและสร้างรอบซ้อมประจำวันของวันนี้โดยอัตโนมัติ หากวันนี้ตรงกับตารางซ้อมประจำ (Recurring Schedule)
 * ทำให้รอบซ้อมปรากฏขึ้นในรายการรอบซ้อมโดยอัตโนมัติทันทีที่ถึงวันซ้อม โดยที่โค้ชไม่ต้องกดสร้างเอง
 */
export async function ensureTodayRecurringSession(teamId: string) {
  try {
    const bkk = getBangkokDateTime();
    const todayStr = bkk.dateStr;
    const todayDayOfWeek = bkk.dayOfWeek; // 0=Sun, 1=Mon...

    // 1. ตรวจสอบตารางซ้อมประจำของทีมว่าเปิดใช้งานอยู่หรือไม่
    const [schedule] = await db
      .select()
      .from(recurringSchedules)
      .where(and(eq(recurringSchedules.teamId, teamId), eq(recurringSchedules.isActive, 1)))
      .limit(1);

    if (!schedule) {
      return null;
    }

    const days: number[] = JSON.parse(schedule.daysOfWeek || '[]');
    if (!days.includes(todayDayOfWeek)) {
      return null;
    }

    // 2. ตรวจสอบว่ามีรอบซ้อมของวันนี้อยู่แล้วหรือไม่ (ป้องกันการสร้างซ้ำ)
    const todaySessions = await db
      .select()
      .from(trainingSessions)
      .where(and(eq(trainingSessions.teamId, teamId), eq(trainingSessions.date, todayStr)))
      .orderBy(desc(trainingSessions.startTime));

    if (todaySessions.length > 0) {
      return todaySessions[0];
    }

    // 3. ถ้ายังไม่มีรอบซ้อมของวันนี้ ให้สร้างขึ้นมาอัตโนมัติทันที
    const [coach] = await db.select().from(users).where(eq(users.teamId, teamId)).limit(1);
    const [firstUser] = await db.select().from(users).limit(1);
    const creatorId = coach?.id || firstUser?.id || 'coach_default';
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

    return createdSession || null;
  } catch (err: unknown) {
    console.error('ensureTodayRecurringSession error:', err);
    return null;
  }
}

/**
 * ค้นหาหรือสร้างรอบซ้อมปัจจุบันของสโมสรสำหรับป้าย QR Code ถาวรประจำสนาม (11A)
 */
export async function resolveClubActiveSession(clubId: string): Promise<{
  activeSession: { id: string; title: string; date: string; startTime: string; endTime: string; isClosed: number } | null;
  clubName: string;
  nextScheduleInfo?: string;
}> {
  const [club] = await db.select().from(teams).where(eq(teams.id, clubId)).limit(1);
  if (!club) {
    throw new Error('ไม่พบสโมสรนี้ในระบบ');
  }

  // สร้างรอบซ้อมประจำวันของวันนี้อัตโนมัติหากตรงกับตาราง
  await ensureTodayRecurringSession(clubId);

  const bkk = getBangkokDateTime();
  const todayStr = bkk.dateStr;
  const currentMinutes = bkk.currentMinutes;

  // 1. ค้นหารอบซ้อมของวันนี้ที่ยังไม่ถูกปิด
  const todaySessions = await db
    .select()
    .from(trainingSessions)
    .where(and(eq(trainingSessions.teamId, clubId), eq(trainingSessions.date, todayStr)))
    .orderBy(desc(trainingSessions.startTime));

  // 1. ตรวจสอบรอบซ้อมของวันนี้ที่อยู่ในช่วงเวลาฝึกซ้อมจริง (ก่อนเริ่ม 30 นาที จนถึงเวลาเลิกซ้อม + 15 นาที)
  for (const s of todaySessions) {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const startM = (sh || 0) * 60 + (sm || 0) - 30; // เปิดให้เช็คชื่อก่อนเริ่ม 30 นาที
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

  // 2. หากยังไม่ถึงเวลา หรือรอบก่อนหน้าปิดไปแล้ว ให้ตรวจสอบว่ามีรอบถัดไปของวันนี้หรือไม่
  const upcomingToday = todaySessions
    .filter((s) => s.isClosed !== 1)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  if (upcomingToday) {
    return {
      activeSession: null,
      clubName: club.name,
      nextScheduleInfo: `รอบถัดไปของวันนี้: "${upcomingToday.title}" เวลา ${upcomingToday.startTime} - ${upcomingToday.endTime} น. (ระบบจะเปิดให้เช็คชื่อ 30 นาทีก่อนเริ่มซ้อม)`,
    };
  }

  // 3. ดึงข้อมูลตารางซ้อมประจำเพื่อแจ้งผู้ใช้
  const [schedule] = await db
    .select()
    .from(recurringSchedules)
    .where(and(eq(recurringSchedules.teamId, clubId), eq(recurringSchedules.isActive, 1)))
    .limit(1);

  if (schedule) {
    return {
      activeSession: null,
      clubName: club.name,
      nextScheduleInfo: `ตารางซ้อมประจำสโมสร: ${schedule.startTime} - ${schedule.endTime} น.`,
    };
  }

  return {
    activeSession: null,
    clubName: club.name,
    nextScheduleInfo: 'ยังไม่มีตารางการฝึกซ้อมที่เปิดอยู่ในขณะนี้',
  };
}
