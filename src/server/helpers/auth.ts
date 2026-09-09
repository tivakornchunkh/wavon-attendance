import { cookies } from 'next/headers';
import { db } from '../db/client';
import { users, teams } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ensureDefaultTeamAndCoach } from './default-team';

export const USER_COOKIE = 'wavon_user_id';
export const ACTIVE_TEAM_COOKIE = 'wavon_active_team_id';

export interface AuthSession {
  user: {
    id: string;
    name: string;
    username: string;
    role: 'ADMIN' | 'USER' | 'COACH';
    teamId: string | null;
  };
  team: {
    id: string;
    name: string;
  } | null;
  isAdmin: boolean;
}

/**
 * ดึงข้อมูล Session ของผู้ใช้ปัจจุบันที่ล็อกอินอยู่
 */
export async function getCurrentSession(): Promise<AuthSession> {
  await ensureDefaultTeamAndCoach();

  const cookieStore = await cookies();
  const userId = cookieStore.get(USER_COOKIE)?.value;

  let currentUser = null;
  if (userId) {
    const [found] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (found) currentUser = found;
  }

  // หากไม่มี session หรือหาไม่เจอ ให้ default เป็นโค้ช WAVON
  if (!currentUser) {
    const [defaultCoach] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'coach_wavon'))
      .limit(1);

    if (defaultCoach) {
      currentUser = defaultCoach;
    } else {
      const [anyCoach] = await db.select().from(users).limit(1);
      currentUser = anyCoach;
    }
  }

  const isAdmin = currentUser.role === 'ADMIN';
  let activeTeam = null;

  if (isAdmin) {
    // ผู้ดูแล สามารถสลับดูสโมสรใดก็ได้ตามที่เลือกไว้ใน cookie
    const activeTeamId = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value;
    if (activeTeamId) {
      const [team] = await db.select().from(teams).where(eq(teams.id, activeTeamId)).limit(1);
      if (team) activeTeam = team;
    }

    // ถ้ายังไม่ได้เลือกสโมสร ให้เลือกสโมสรแรกเป็นค่าเริ่มต้น
    if (!activeTeam) {
      const [firstTeam] = await db.select().from(teams).limit(1);
      activeTeam = firstTeam || null;
    }
  } else {
    // คนเช็คชื่อ (User) บังคับสังกัดเฉพาะสโมสรของตนเอง 100%
    if (currentUser.teamId) {
      const [team] = await db.select().from(teams).where(eq(teams.id, currentUser.teamId)).limit(1);
      activeTeam = team || null;
    }
  }

  return {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      role: currentUser.role as 'ADMIN' | 'USER' | 'COACH',
      teamId: currentUser.teamId,
    },
    team: activeTeam,
    isAdmin,
  };
}

/**
 * ตั้งค่าล็อกอิน
 */
export async function setAuthSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
  });
}

/**
 * ผู้ดูแลสลับสโมสรที่กำลังดู
 */
export async function setActiveTeamSession(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * ออกจากระบบ
 */
export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_COOKIE);
  cookieStore.delete(ACTIVE_TEAM_COOKIE);
}

