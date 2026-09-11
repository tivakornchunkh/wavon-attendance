'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { db } from '../../src/server/db/client';
import { users, teams, athletes, trainingSessions, attendances } from '../../src/server/db/schema';
import { eq, ne, and, sql, inArray } from 'drizzle-orm';
import { setAuthSession, clearAuthSession, setActiveTeamSession, getCurrentSession, ACTIVE_TEAM_COOKIE } from '../../src/server/helpers/auth';
import { ensureDefaultTeamAndCoach } from '../../src/server/helpers/default-team';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  field?: 'username' | 'password' | 'general';
  redirectTo?: string;
}

/**
 * เข้าสู่ระบบแบบด่วน (สำหรับพรีเซนต์ / สลับบทบาทในคลิกเดียว)
 */
export async function quickLoginAction(username: string): Promise<AuthActionResult> {
  try {
    await ensureDefaultTeamAndCoach();

    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    if (!user) {
      return { success: false, error: `ไม่พบผู้ใช้งาน "${username}" ในระบบ` };
    }

    // ป้องกันการเข้าสู่ระบบแบบไม่ผ่านรหัสผ่านสำหรับ Admin
    if (user.role === 'ADMIN') {
      return { success: false, error: 'บัญชีผู้ดูแลระบบ (Admin) ต้องเข้าสู่ระบบด้วยรหัสผ่านเท่านั้น' };
    }

    await setAuthSession(user.id, user.role);
    return { success: true, redirectTo: '/' };
  } catch (err: unknown) {
    return { success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด่วน' };
  }
}

/**
 * เข้าสู่ระบบแบบกรอกแบบฟอร์ม
 * ส่งคืนผลลัพธ์พร้อมข้อความภาษาไทยที่ชัดเจน และไม่ throw error ข้าม network
 * เพื่อป้องกัน Next.js masked production error และ Minified React error #441
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  try {
    await ensureDefaultTeamAndCoach();

    const username = (formData.get('username') as string)?.trim();
    const password = (formData.get('password') as string)?.trim();

    if (!username) {
      return {
        success: false,
        error: 'กรุณากรอกชื่อผู้ใช้งาน (Username)',
        field: 'username',
      };
    }

    if (!password) {
      return {
        success: false,
        error: 'กรุณากรอกรหัสผ่าน (Password)',
        field: 'password',
      };
    }

    // ค้นหาชื่อผู้ใช้แบบไม่สนตัวพิมพ์เล็ก-ใหญ่ (Case-insensitive)
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: `ไม่พบบัญชีผู้ใช้งาน "${username}" ในระบบ กรุณาตรวจสอบตัวสะกด หรือเปิดสโมสรใหม่ด้านล่าง`,
        field: 'username',
      };
    }

    // ตรวจสอบความถูกต้องของรหัสผ่าน (รองรับ bcrypt hash + auto-migration จาก plaintext)
    let isPasswordCorrect = false;
    const isHashed = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$');

    if (isHashed) {
      // รหัสผ่านถูกเข้ารหัสแล้ว ใช้ bcrypt.compare
      isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    } else {
      // รหัสผ่านยังเป็น plaintext (จากเวอร์ชันเก่า) ให้เทียบตรงแล้ว auto-migrate
      isPasswordCorrect = user.passwordHash === password;
      if (isPasswordCorrect) {
        // Auto-migration: อัปเกรดรหัสผ่านเป็น bcrypt hash อัตโนมัติ
        const hashed = await bcrypt.hash(password, 10);
        await db.update(users).set({ passwordHash: hashed }).where(eq(users.id, user.id));
      }
    }

    if (!isPasswordCorrect) {
      return {
        success: false,
        error: 'รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบตัวพิมพ์เล็ก-ใหญ่ (Caps Lock) แล้วลองใหม่อีกครั้ง',
        field: 'password',
      };
    }

    await setAuthSession(user.id, user.role);

    const targetUrl = user.role === 'ADMIN' ? '/admin' : '/';
    return {
      success: true,
      redirectTo: targetUrl,
    };
  } catch (err: unknown) {
    console.error('Login action error:', err);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบสัญญาณอินเทอร์เน็ต',
      field: 'general',
    };
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

  // 2. สร้างบัญชีคนเช็คชื่อประจำสโมสร (เข้ารหัสรหัสผ่านด้วย bcrypt)
  const hashedPassword = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    id: newUserId,
    teamId: newTeamId,
    name: coachName,
    username,
    passwordHash: hashedPassword,
    role: 'USER',
  });

  revalidatePath('/admin');
}

/**
 * ผู้ดูแล (ADMIN) ลบสโมสรแบบถาวร (Hard Cascade Delete)
 */
export async function deleteClubAction(teamId: string, confirmationName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isAdmin) {
      return { success: false, error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น' };
    }

    const allTeams = await db.select().from(teams);
    if (allTeams.length <= 1) {
      return { success: false, error: 'ไม่สามารถลบสโมสรนี้ได้ เนื่องจากระบบต้องมีสโมสรเหลืออยู่อย่างน้อย 1 สโมสร' };
    }

    const [targetTeam] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (!targetTeam) {
      return { success: false, error: 'ไม่พบสโมสรที่ต้องการลบในระบบ' };
    }

    if (confirmationName.trim() !== targetTeam.name.trim()) {
      return { success: false, error: `ชื่อสโมสรไม่ตรงกัน กรุณาพิมพ์ "${targetTeam.name}" ให้ถูกต้องเพื่อยืนยันการลบ` };
    }

    // 1. หา sessionIds ทั้งหมดของสโมสรนี้
    const teamSessions = await db.select().from(trainingSessions).where(eq(trainingSessions.teamId, teamId));
    const sessionIds = teamSessions.map((s) => s.id);

    // 2. ลบ attendances (ใช้ batch delete แทน N+1 loop เพื่อประสิทธิภาพ)
    if (sessionIds.length > 0) {
      await db.delete(attendances).where(inArray(attendances.sessionId, sessionIds));
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
    return { success: true };
  } catch (err: unknown) {
    console.error('Delete club error:', err);
    return { success: false, error: 'เกิดข้อผิดพลาดในการลบสโมสร กรุณาลองใหม่อีกครั้ง' };
  }
}

export interface RegisterActionResult {
  success: boolean;
  error?: string;
  field?: 'clubName' | 'coachName' | 'username' | 'password' | 'confirmPassword' | 'general';
  redirectTo?: string;
}

/**
 * โค้ชลงทะเบียนเปิดสโมสรใหม่ (Self-Registration)
 */
export async function registerAction(formData: FormData): Promise<RegisterActionResult> {
  try {
    await ensureDefaultTeamAndCoach();

    const clubName = (formData.get('clubName') as string)?.trim();
    const coachName = (formData.get('coachName') as string)?.trim();
    const username = (formData.get('username') as string)?.trim().toLowerCase();
    const password = (formData.get('password') as string)?.trim();
    const confirmPassword = (formData.get('confirmPassword') as string)?.trim();

    if (!clubName) {
      return { success: false, error: 'กรุณากรอกชื่อสโมสร / ทีมกีฬา', field: 'clubName' };
    }
    if (!coachName) {
      return { success: false, error: 'กรุณากรอกชื่อ-นามสกุล ของโค้ช', field: 'coachName' };
    }
    if (!username) {
      return { success: false, error: 'กรุณากรอกชื่อผู้ใช้งาน (Username)', field: 'username' };
    }
    if (username.length < 3) {
      return { success: false, error: 'ชื่อผู้ใช้งาน (Username) ต้องมีอย่างน้อย 3 ตัวอักษร', field: 'username' };
    }
    if (!password) {
      return { success: false, error: 'กรุณากรอกรหัสผ่าน', field: 'password' };
    }
    if (password.length < 4) {
      return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', field: 'password' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง', field: 'confirmPassword' };
    }

    // ตรวจสอบ username ซ้ำ (Case-insensitive)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        error: `ชื่อผู้ใช้งาน "${username}" มีผู้อื่นใช้งานแล้ว กรุณาเลือกชื่ออื่น`,
        field: 'username',
      };
    }

    const newTeamId = `team-${crypto.randomUUID().slice(0, 8)}`;
    const newUserId = `user-${crypto.randomUUID().slice(0, 8)}`;

    // 1. สร้างสโมสรใหม่
    await db.insert(teams).values({
      id: newTeamId,
      name: clubName,
    });

    // 2. สร้างบัญชีโค้ช (เข้ารหัสรหัสผ่านด้วย bcrypt)
    const hashedPw = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      id: newUserId,
      teamId: newTeamId,
      name: coachName,
      username,
      passwordHash: hashedPw,
      role: 'COACH',
    });

    // 3. เข้าสู่ระบบทันที
    await setAuthSession(newUserId, 'COACH');
    await setActiveTeamSession(newTeamId);

    // 4. ตั้งค่าให้เปิดคู่มือแนะนำการใช้งานอัตโนมัติสำหรับสโมสรใหม่
    const cookieStore = await cookies();
    cookieStore.set('show_welcome_guide', 'true', { path: '/' });

    revalidatePath('/');
    return { success: true, redirectTo: '/' };
  } catch (err: unknown) {
    console.error('Register action error:', err);
    return {
      success: false,
      error: 'เกิดข้อผิดพลาดในการลงทะเบียนเปิดสโมสร กรุณาลองใหม่อีกครั้ง',
      field: 'general',
    };
  }
}

