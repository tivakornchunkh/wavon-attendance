'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../../src/server/db/client';
import { SessionRepository } from '../../src/server/repositories/session.repo';
import { AthleteRepository } from '../../src/server/repositories/athlete.repo';
import { AttendanceRepository } from '../../src/server/repositories/attendance.repo';
import { SessionService } from '../../src/core/services/session.service';
import { AttendanceService } from '../../src/core/services/attendance.service';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import { CreateSessionSchema } from '../../src/core/validators/session.validator';
import { AttendanceStatus } from '../../src/core/domain/attendance';

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

  // อ่านข้อมูลนักกีฬาทุกคนจาก form
  // รูปแบบ name: status_{athleteId}, notes_{athleteId}
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
 * นักกีฬาสแกน QR เช็คชื่อเข้าซ้อม หรือแจ้งลาซ้อมด้วยตนเอง (ไม่ต้องล็อกอิน)
 */
export async function selfCheckInAction(
  sessionId: string,
  athleteId: string,
  status: 'PRESENT' | 'LEAVE',
  notes?: string
): Promise<{ success: boolean; message: string }> {
  const session = await sessionRepo.findById(sessionId);
  if (!session) {
    throw new Error('ไม่พบข้อมูลรอบการฝึกซ้อมนี้');
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
    ? 'สแกน QR เช็คชื่อตนเอง'
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

