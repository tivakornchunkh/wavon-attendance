'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { db } from '../../src/server/db/client';
import { users, teams, athletes, trainingSessions, attendances } from '../../src/server/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { setAuthSession, clearAuthSession, setActiveTeamSession, getCurrentSession, ACTIVE_TEAM_COOKIE } from '../../src/server/helpers/auth';
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
  const username = ((formData.get('username') || formData.get('coachUsername')) as string)?.trim();
  const password = ((formData.get('password') || formData.get('coachPassword')) as string)?.trim() || '123456';

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

/**
 * ผู้ดูแล (ADMIN) ลบสโมสรแบบถาวร (Hard Cascade Delete)
 */
export async function deleteClubAction(teamId: string, confirmationName: string): Promise<void> {
  const session = await getCurrentSession();
  if (!session.isAdmin) {
    throw new Error('สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น');
  }

  const allTeams = await db.select().from(teams);
  if (allTeams.length <= 1) {
    throw new Error('ไม่สามารถลบสโมสรนี้ได้ เนื่องจากระบบต้องมีสโมสรเหลืออยู่อย่างน้อย 1 สโมสร');
  }

  const [targetTeam] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!targetTeam) {
    throw new Error('ไม่พบสโมสรที่ต้องการลบ');
  }

  if (confirmationName.trim() !== targetTeam.name.trim()) {
    throw new Error(`ชื่อสโมสรไม่ตรงกัน กรุณาพิมพ์ "${targetTeam.name}" ให้ถูกต้องเพื่อยืนยันการลบ`);
  }

  // 1. หา sessionIds ทั้งหมดของสโมสรนี้
  const teamSessions = await db.select().from(trainingSessions).where(eq(trainingSessions.teamId, teamId));
  const sessionIds = teamSessions.map((s) => s.id);

  // 2. ลบ attendances
  if (sessionIds.length > 0) {
    for (const sId of sessionIds) {
      await db.delete(attendances).where(eq(attendances.sessionId, sId));
    }
  }

  // 3. ลบ trainingSessions
  await db.delete(trainingSessions).where(eq(trainingSessions.teamId, teamId));

  // 4. ลบ athletes
  await db.delete(athletes).where(eq(athletes.teamId, teamId));

  // 5. ลบ users ที่สังกัดสโมสรนี้ (ที่ไม่ใช่ ADMIN)
  await db.delete(users).where(and(eq(users.teamId, teamId), ne(users.role, 'ADMIN')));

  // 6. ลบสโมสร
  await db.delete(teams).where(eq(teams.id, teamId));

  // 7. หาก session ปัจจุบันกำลังดูสโมสรนี้อยู่ ให้สลับไปยังสโมสรที่เหลืออยู่
  const cookieStore = await cookies();
  const currentActiveTeamId = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value;
  if (currentActiveTeamId === teamId) {
    const remainingTeams = allTeams.filter((t) => t.id !== teamId);
    if (remainingTeams.length > 0) {
      cookieStore.set(ACTIVE_TEAM_COOKIE, remainingTeams[0].id, { path: '/' });
    } else {
      cookieStore.delete(ACTIVE_TEAM_COOKIE);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/athletes');
  revalidatePath('/sessions');
}

/**
 * โค้ชลงทะเบียนเปิดสโมสรใหม่ (Self-Registration)
 */
export async function registerAction(formData: FormData): Promise<void> {
  await ensureDefaultTeamAndCoach();

  const clubName = (formData.get('clubName') as string)?.trim();
  const coachName = (formData.get('coachName') as string)?.trim();
  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const password = (formData.get('password') as string)?.trim();
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();

  if (!clubName || !coachName || !username || !password) {
    throw new Error('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
  }

  if (username.length < 3) {
    throw new Error('ชื่อผู้ใช้งาน (Username) ต้องมีอย่างน้อย 3 ตัวอักษร');
  }

  if (password.length < 4) {
    throw new Error('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
  }

  if (password !== confirmPassword) {
    throw new Error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
  }

  // ตรวจสอบ username ซ้ำ
  const [existingUser] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existingUser) {
    throw new Error(`ชื่อผู้ใช้งาน "${username}" มีผู้อื่นใช้งานแล้ว กรุณาเลือกชื่ออื่น`);
  }

  const newTeamId = `team-${crypto.randomUUID().slice(0, 8)}`;
  const newUserId = `user-${crypto.randomUUID().slice(0, 8)}`;

  // 1. สร้างสโมสรใหม่
  await db.insert(teams).values({
    id: newTeamId,
    name: clubName,
  });

  // 2. สร้างบัญชีโค้ช
  await db.insert(users).values({
    id: newUserId,
    teamId: newTeamId,
    name: coachName,
    username,
    passwordHash: password,
    role: 'COACH',
  });

  // 3. เข้าสู่ระบบทันที
  await setAuthSession(newUserId);
  await setActiveTeamSession(newTeamId);

  // 4. ตั้งค่าให้เปิดคู่มือแนะนำการใช้งานอัตโนมัติสำหรับสโมสรใหม่
  const cookieStore = await cookies();
  cookieStore.set('show_welcome_guide', 'true', { path: '/' });

  revalidatePath('/');
  redirect('/');
}

