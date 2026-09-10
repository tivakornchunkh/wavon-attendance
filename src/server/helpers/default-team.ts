import { db } from '../db/client';
import { teams, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const DEFAULT_TEAM_ID = 'team-wavon-default';
export const DEFAULT_COACH_ID = 'user-coach-wavon';

export const THUNDER_TEAM_ID = 'team-thunder';
export const THUNDER_COACH_ID = 'user-coach-thunder';

export const ADMIN_USER_ID = 'user-admin';
export const ARM_USER_ID = 'user-arm';

export async function ensureDefaultTeamAndCoach() {
  // 1. ตรวจสอบและสร้างสโมสร 1: WAVON FC
  const [team1] = await db.select().from(teams).where(eq(teams.id, DEFAULT_TEAM_ID)).limit(1);
  if (!team1) {
    await db.insert(teams).values({
      id: DEFAULT_TEAM_ID,
      name: 'WAVON FC',
    });
  }

  // คนเช็คชื่อ WAVON
  const [coach1] = await db.select().from(users).where(eq(users.id, DEFAULT_COACH_ID)).limit(1);
  if (!coach1) {
    await db.insert(users).values({
      id: DEFAULT_COACH_ID,
      teamId: DEFAULT_TEAM_ID,
      name: 'คนเช็คชื่อ WAVON',
      username: 'coach_wavon',
      passwordHash: 'pass1234',
      role: 'USER',
    });
  }

  // 2. ตรวจสอบและสร้างสโมสร 2: THUNDER CLUB
  const [team2] = await db.select().from(teams).where(eq(teams.id, THUNDER_TEAM_ID)).limit(1);
  if (!team2) {
    await db.insert(teams).values({
      id: THUNDER_TEAM_ID,
      name: 'THUNDER CLUB',
    });
  }

  // คนเช็คชื่อ THUNDER
  const [coach2] = await db.select().from(users).where(eq(users.id, THUNDER_COACH_ID)).limit(1);
  if (!coach2) {
    await db.insert(users).values({
      id: THUNDER_COACH_ID,
      teamId: THUNDER_TEAM_ID,
      name: 'คนเช็คชื่อ THUNDER',
      username: 'coach_thunder',
      passwordHash: 'pass1234',
      role: 'USER',
    });
  }

  // 3. ตรวจสอบและสร้างบัญชี: ผู้ดูแล (ADMIN)
  const [admin] = await db.select().from(users).where(eq(users.id, ADMIN_USER_ID)).limit(1);
  if (!admin) {
    await db.insert(users).values({
      id: ADMIN_USER_ID,
      teamId: DEFAULT_TEAM_ID,
      name: 'ผู้ดูแล',
      username: 'admin',
      passwordHash: 'admin1234',
      role: 'ADMIN',
    });
  }

  // 4. ตรวจสอบและสร้างบัญชี: โค้ชอาร์ม (Arm) ให้คงอยู่เสมอ ไม่หายเวลาอัปเดตระบบ
  const [armUser] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.username}) = 'arm'`)
    .limit(1);
  if (!armUser) {
    await db.insert(users).values({
      id: ARM_USER_ID,
      teamId: DEFAULT_TEAM_ID,
      name: 'โค้ชอาร์ม (Arm)',
      username: 'arm',
      passwordHash: '123456',
      role: 'ADMIN',
    });
  }

  return { teamId: DEFAULT_TEAM_ID, coachId: DEFAULT_COACH_ID };
}
