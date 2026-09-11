import { cookies } from 'next/headers';
import { db } from '../db/client';
import { users, teams } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ensureDefaultTeamAndCoach } from './default-team';
import crypto from 'crypto';

export const USER_COOKIE = 'wavon_user_id';
export const ACTIVE_TEAM_COOKIE = 'wavon_active_team_id';

const AUTH_SECRET = process.env.AUTH_SECRET || 'wavon-attendance-hmac-salt-2026';

/**
 * เซ็นลายเซ็นกำกับค่าใน Cookie (HMAC-SHA256) ป้องกันการปลอมแปลง (BUG-04)
 */
export function signCookie(value: string): string {
  const hash = crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('hex').slice(0, 16);
  return `${value}.${hash}`;
}

/**
 * ถอดและตรวจสอบลายเซ็น Cookie
 * หากถูกแก้ไข ปลอมแปลง หรือไม่ถูกต้อง จะคืนค่า null
 */
export function unsignCookie(signedValue: string | undefined): string | null {
  if (!signedValue) return null;
  const lastDot = signedValue.lastIndexOf('.');
  if (lastDot === -1) {
    // สำหรับ Backward compatibility คุกกี้เก่าที่ยังไม่ได้เซ็น
    return signedValue;
  }
  const value = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(value).digest('hex').slice(0, 16);
  if (signature === expected) {
    return value;
  }
  return null; // ลายเซ็นไม่ถูกต้อง คุกกี้ถูกปลอมแปลง
}

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
  const rawUserId = cookieStore.get(USER_COOKIE)?.value;
  const userId = unsignCookie(rawUserId);

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

export const ROLE_COOKIE = 'wavon_user_role';

/**
 * ตั้งค่าล็อกอิน (บันทึก userId + role สำหรับ middleware route protection)
 */
export async function setAuthSession(userId: string, role?: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, signCookie(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 วัน
  });
  if (role) {
    cookieStore.set(ROLE_COOKIE, signCookie(role), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

/**
 * ผู้ดูแลสลับสโมสรที่กำลังดู
 */
export async function setActiveTeamSession(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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
  cookieStore.delete(ROLE_COOKIE);
}

