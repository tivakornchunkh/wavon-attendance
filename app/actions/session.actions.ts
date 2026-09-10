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

export async function cancelSessionAction(sessionId: string): Promise<void> {
  await sessionService.cancelSession(sessionId);

  revalidatePath('/sessions');
  revalidatePath('/');
  redirect('/sessions');
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
 * นักกีฬาสแกน QR เช็คชื่อเข้าซ้อม หรือแจ้งลาซ้อมด้วยตนเอง (4A, 3A, 10B)
 */
export async function selfCheckInAction(
  sessionId: string,
  athleteId: string,
  status: 'PRESENT' | 'LEAVE',
  notes?: string,
  isPitchVerified = true
): Promise<{ success: boolean; message: string }> {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    throw new Error('ไม่พบข้อมูลรอบการฝึกซ้อมนี้');
  }

  // ป้องกันการเช็คชื่อหากรอบถูกปิดแล้ว (3A)
  if (session.isClosed === 1) {
    throw new Error('รอบการฝึกซ้อมนี้ปิดรับการเช็คชื่อแล้ว กรุณาติดต่อโค้ชผู้ฝึกสอน');
  }

  // ป้องกันการแอบกด "เข้าซ้อม" จากที่บ้านหากไม่ได้สแกนที่สนามจริง (4A)
  if (status === 'PRESENT' && !isPitchVerified) {
    throw new Error('ต้องสแกน QR Code ริมสนามจริงเพื่อเช็คชื่อเข้าซ้อม (หากไม่ได้มาสนาม สามารถกดแท็บ "แจ้งลาซ้อม" ได้ทันที)');
  }

  const athlete = await athleteRepo.findById(athleteId);
  if (!athlete) {
    throw new Error('ไม่พบข้อมูลนักกีฬาในระบบ');
  }

  if (athlete.teamId !== session.teamId) {
    throw new Error('นักกีฬาไม่ได้สังกัดในสโมสรของรอบฝึกซ้อมนี้');
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

  const bkk = getBangkokDateTime();
  const todayStr = bkk.dateStr;
  const currentMinutes = bkk.currentMinutes;

  // 1. ค้นหารอบซ้อมของวันนี้ที่ยังไม่ถูกปิด
  const todaySessions = await db
    .select()
    .from(trainingSessions)
    .where(and(eq(trainingSessions.teamId, clubId), eq(trainingSessions.date, todayStr)))
    .orderBy(desc(trainingSessions.startTime));

  // เลือกรอบที่อยู่ในช่วงเวลา หรือรอบล่าสุดของวันนี้
  for (const s of todaySessions) {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const startM = (sh || 0) * 60 + (sm || 0) - 30; // เปิดให้เช็คชื่อก่อนเริ่ม 30 นาที
    const endM = (eh || 0) * 60 + (em || 0);

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

  // ถ้ารอบซ้อมวันนี้มีอยู่แล้วแต่เลยเวลาไปแล้วและยังไม่ปิด ให้ส่งรอบนั้น
  if (todaySessions.length > 0 && todaySessions[0].isClosed !== 1) {
    const s = todaySessions[0];
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

  // 2. ถ้ายังไม่มีรอบซ้อมวันนี้ ให้ตรวจสอบตารางซ้อมประจำ (Recurring Schedule)
  const [schedule] = await db
    .select()
    .from(recurringSchedules)
    .where(and(eq(recurringSchedules.teamId, clubId), eq(recurringSchedules.isActive, 1)))
    .limit(1);

  if (schedule) {
    const days: number[] = JSON.parse(schedule.daysOfWeek || '[]');
    const todayDayOfWeek = bkk.dayOfWeek; // 0=Sun, 1=Mon...

    if (days.includes(todayDayOfWeek)) {
      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      const startM = (sh || 0) * 60 + (sm || 0) - 60; // เปิดก่อนเวลา 60 นาที
      const endM = (eh || 0) * 60 + (em || 0) + 60;

      // ถ้าอยู่ในช่วงเวลาซ้อมของวันนี้ ให้สร้างรอบซ้อมของวันนี้อัตโนมัติ
      if (currentMinutes >= startM && currentMinutes <= endM) {
        // หา coach ประจำทีมเพื่อใช้เป็น createdBy (ไม่ใช้ 'system' เพื่อป้องกัน foreign key error)
        const [coach] = await db.select().from(users).where(eq(users.teamId, clubId)).limit(1);
        const [firstUser] = await db.select().from(users).limit(1);
        const creatorId = coach?.id || firstUser?.id || 'coach_default';
        const newSessionId = `sess-${crypto.randomUUID().slice(0, 8)}`;
        
        await db.insert(trainingSessions).values({
          id: newSessionId,
          teamId: clubId,
          title: schedule.title || 'ซ้อมประจำวัน',
          date: todayStr,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          createdBy: creatorId,
          isClosed: 0,
        });

        return {
          activeSession: {
            id: newSessionId,
            title: schedule.title || 'ซ้อมประจำวัน',
            date: todayStr,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isClosed: 0,
          },
          clubName: club.name,
        };
      }
    }

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
