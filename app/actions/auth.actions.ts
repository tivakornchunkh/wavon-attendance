'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '../../src/server/db/client';
import { users, teams } from '../../src/server/db/schema';
import { eq } from 'drizzle-orm';
import { setAuthSession, clearAuthSession, setActiveTeamSession, getCurrentSession } from '../../src/server/helpers/auth';
import { ensureDefaultTeamAndCoach } from '../../src/server/helpers/default-team';
import crypto from 'crypto';

/**
 * เข้าสู่ระบบแบบด่วน (สำหรับพรีเซนต์ / สลับบทบาทในคลิกเดียว)
 */
export async function quickLoginAction(username: string): Promise<void> {
  await ensureDefaultTeamAndCoach();

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) {
    throw new Error(`ไม่พบผู้ใช้งาน ${username}`);
  }

  // ป้องกันการเข้าสู่ระบบแบบไม่ผ่านรหัสผ่านสำหรับ Admin
  if (user.role === 'ADMIN') {
    throw new Error('บัญชีผู้ดูแลระบบ (Admin) ต้องเข้าสู่ระบบด้วยรหัสผ่านเท่านั้น');
  }

  await setAuthSession(user.id);
  redirect('/');
}

/**
 * เข้าสู่ระบบแบบกรอกแบบฟอร์ม
 */
export async function loginAction(formData: FormData): Promise<void> {
  await ensureDefaultTeamAndCoach();

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !username.trim()) {
    throw new Error('กรุณาระบุ Username');
  }

  if (!password || !password.trim()) {
    throw new Error('กรุณาระบุรหัสผ่าน');
  }

  const [user] = await db.select().from(users).where(eq(users.username, username.trim())).limit(1);
  if (!user) {
    throw new Error('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ');
  }

  // ตรวจสอบความถูกต้องของรหัสผ่าน
  if (user.passwordHash !== password.trim()) {
    throw new Error('รหัสผ่านไม่ถูกต้อง');
  }

  await setAuthSession(user.id);

  if (user.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/');
  }
}

/**
 * ออกจากระบบ
 */
export async function logoutAction(): Promise<void> {
  await clearAuthSession();
  redirect('/login');
}

/**
 * ผู้ดูแล (ADMIN) สลับเข้าไปดูสโมสรที่เลือก
 */
export async function switchClubAction(teamId: string): Promise<void> {
  const session = await getCurrentSession();
  if (!session.isAdmin) {
    throw new Error('สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น');
  }

  await setActiveTeamSession(teamId);
  revalidatePath('/');
  revalidatePath('/athletes');
  revalidatePath('/sessions');
  redirect('/');
}

/**
 * ผู้ดูแล (ADMIN) สร้างสโมสรใหม่ พร้อมสร้างบัญชีคนเช็คชื่อ
 */
export async function createClubAction(formData: FormData): Promise<void> {
  const session = await getCurrentSession();
  if (!session.isAdmin) {
    throw new Error('สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น');
  }

  const clubName = (formData.get('clubName') as string)?.trim();
  const coachName = (formData.get('coachName') as string)?.trim();
  const username = (formData.get('username') as string)?.trim();
  const password = (formData.get('password') as string)?.trim() || '123456';

  if (!clubName || !coachName || !username) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
  }

  // ตรวจสอบ username ซ้ำ
  const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existingUser) {
    throw new Error(`Username "${username}" มีผู้ใช้งานแล้ว`);
  }

  const newTeamId = `team-${crypto.randomUUID().slice(0, 8)}`;
  const newUserId = `user-${crypto.randomUUID().slice(0, 8)}`;

  // 1. สร้างสโมสร
  await db.insert(teams).values({
    id: newTeamId,
    name: clubName,
  });

  // 2. สร้างบัญชีคนเช็คชื่อประจำสโมสร
  await db.insert(users).values({
    id: newUserId,
    teamId: newTeamId,
    name: coachName,
    username,
    passwordHash: password,
    role: 'USER',
  });

  revalidatePath('/admin');
}

