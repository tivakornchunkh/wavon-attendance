'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../../src/server/db/client';
import { athletes, trainingSessions, attendances, attendanceLogs } from '../../src/server/db/schema';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import { eq, and, like, inArray, or } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * ล้างเฉพาะข้อมูลทดสอบ (Demo) โดยไม่แตะต้องข้อมูลจริงของโค้ชเลยเด็ดขาด
 * ระบุข้อมูล Demo จาก ID ที่ขึ้นต้นด้วย 'demo-' หรือ 'ath-' (เวอร์ชันเก่า)
 */
export async function clearDemoDataAction(): Promise<void> {
  const session = await getCurrentSession();
  if (!session.isAdmin) {
    throw new Error('สงวนสิทธิ์การจัดการชุดข้อมูลจำลองเฉพาะผู้ดูแลระบบ (Admin) เท่านั้น');
  }
  const teamId = session.team?.id || DEFAULT_TEAM_ID;

  // 1. ค้นหา Demo Sessions ของทีมนี้
  const demoSessions = await db
    .select({ id: trainingSessions.id })
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.teamId, teamId),
        or(like(trainingSessions.id, 'demo-%'), like(trainingSessions.id, 'demo-sess-%'))
      )
    );
  const demoSessionIds = demoSessions.map((s) => s.id);

  // 2. ค้นหา Demo Athletes ของทีมนี้
  const demoAthletes = await db
    .select({ id: athletes.id })
    .from(athletes)
    .where(
      and(
        eq(athletes.teamId, teamId),
        or(like(athletes.id, 'demo-%'), like(athletes.id, 'ath-%'))
      )
    );
  const demoAthleteIds = demoAthletes.map((a) => a.id);

  // 3. ลบ Attendance และ Audit Logs ที่ผูกกับ Demo
  if (demoSessionIds.length > 0) {
    await db.delete(attendanceLogs).where(inArray(attendanceLogs.sessionId, demoSessionIds));
    await db.delete(attendances).where(inArray(attendances.sessionId, demoSessionIds));
    await db.delete(trainingSessions).where(inArray(trainingSessions.id, demoSessionIds));
  }

  if (demoAthleteIds.length > 0) {
    await db.delete(athletes).where(inArray(athletes.id, demoAthleteIds));
  }

  revalidatePath('/');
  revalidatePath('/athletes');
  revalidatePath('/sessions');
}

export async function seedRealisticDataAction(): Promise<void> {
  const session = await getCurrentSession();
  if (!session.isAdmin) {
    throw new Error('สงวนสิทธิ์การจัดการชุดข้อมูลจำลองเฉพาะผู้ดูแลระบบ (Admin) เท่านั้น');
  }
  const teamId = session.team?.id || DEFAULT_TEAM_ID;
  const coachId = session.user.id;

  // 1. เคลียร์เฉพาะข้อมูล DEMO เก่าก่อน (ข้อมูลจริงของผู้ใช้จะไม่หายเด็ดขาด)
  await clearDemoDataAction();

  // 2. สร้างนักกีฬาจำลอง 32 คน (รหัส DEMO-01 ถึง DEMO-32 และ ID ไม่ซ้ำกันด้วย UUID)
  const nicknames = [
    'ต้น', 'เจ', 'มิว', 'บิว', 'นนท์', 'เบนซ์', 'อาร์ม', 'แบงค์',
    'ก้อง', 'เจมส์', 'เต้', 'มาร์ค', 'โอ๊ต', 'ปอนด์', 'บอส', 'ไอซ์',
    'ฟลุ๊ค', 'กาย', 'พีช', 'วิน', 'มิกซ์', 'ตั้ม', 'ดิว', 'นัท',
    'กอล์ฟ', 'บาส', 'ท็อป', 'ภูมิ', 'นิว', 'ไม้', 'โบ๊ท', 'คิม'
  ];

  const generatedAthletes: {
    id: string;
    teamId: string;
    athleteCode: string;
    name: string;
    phone: string;
    startDate: string;
    status: 'ACTIVE' | 'INACTIVE';
    attendanceTendency: 'VERY_HIGH' | 'HIGH' | 'AVERAGE' | 'OFTEN_LEAVE' | 'OFTEN_ABSENT';
  }[] = [];

  for (let i = 0; i < nicknames.length; i++) {
    const id = `demo-ath-${crypto.randomUUID()}`;
    const athleteCode = `DEMO-${String(i + 1).padStart(2, '0')}`;
    const name = `น้อง${nicknames[i]}`;
    const phone = `08${(10000000 + i * 123456).toString().slice(0, 8)}`;

    // นักกีฬา 2 คนหลังเป็น Inactive, นักกีฬาคนที่ 28-30 เพิ่งเข้าทีมกลางเดือน
    let status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
    let startDate = '2026-01-01';
    let tendency: 'VERY_HIGH' | 'HIGH' | 'AVERAGE' | 'OFTEN_LEAVE' | 'OFTEN_ABSENT' = 'HIGH';

    if (i >= 30) {
      status = 'INACTIVE';
    } else if (i >= 26) {
      startDate = '2026-03-05'; // เข้าร่วมทีมกลางเดือนมีนา
    }

    // กำหนดพฤติกรรมการเข้าซ้อมจำลอง
    if (i % 6 === 0) tendency = 'VERY_HIGH';     // มาเกือบ 100%
    else if (i % 6 === 1 || i % 6 === 2) tendency = 'HIGH'; // มาประมาณ 80-90%
    else if (i % 6 === 3) tendency = 'AVERAGE';  // มา 70%
    else if (i % 6 === 4) tendency = 'OFTEN_LEAVE'; // ลาบ่อย (Attendance Rate ยังสูงเพราะวันลาไม่ถูกหัก)
    else tendency = 'OFTEN_ABSENT';              // ขาดบ่อย

    generatedAthletes.push({
      id,
      teamId,
      athleteCode,
      name,
      phone,
      startDate,
      status,
      attendanceTendency: tendency,
    });
  }

  for (const a of generatedAthletes) {
    await db.insert(athletes).values({
      id: a.id,
      teamId,
      athleteCode: a.athleteCode,
      name: a.name,
      phone: a.phone,
      startDate: a.startDate,
      status: a.status,
    });
  }

  // 3. สร้างรอบการซ้อม 8 รอบ (ย้อนหลัง 7 รอบ + รอบวันนี้ 1 รอบ โดยใช้ UUID ป้องกัน ID ชนกันข้ามสโมสร)
  const todayStr = new Date().toISOString().split('T')[0];
  const sessionsList = [
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) ซ้อมเช้า - คาร์ดิโอ & ยืดหยุ่น', date: '2026-03-01', startTime: '07:00', endTime: '09:00' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) ซ้อมเย็น - ความแข็งแกร่งกล้ามเนื้อ', date: '2026-03-02', startTime: '16:30', endTime: '18:30' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) ซ้อมทักษะเฉพาะตำแหน่ง', date: '2026-03-04', startTime: '08:00', endTime: '10:00' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) ซ้อมกลยุทธ์ทีม & ซ้อมแผน', date: '2026-03-05', startTime: '16:00', endTime: '18:00' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) อุ่นเครื่องและแมตช์จำลอง', date: '2026-03-06', startTime: '08:00', endTime: '11:00' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) วิเคราะห์วิดีโอ & ปรับแท็กติก', date: '2026-03-07', startTime: '15:00', endTime: '17:00' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) ซ้อมเตรียมความพร้อมแข่งขัน', date: '2026-03-08', startTime: '08:00', endTime: '10:00' },
    { id: `demo-sess-${crypto.randomUUID()}`, title: '(Demo) ซ้อมประจำวัน (รอบวันนี้)', date: todayStr, startTime: '08:00', endTime: '10:00' },
  ];

  for (const s of sessionsList) {
    await db.insert(trainingSessions).values({
      id: s.id,
      teamId,
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      createdBy: coachId,
    });
  }

  // 4. บันทึกข้อมูลการเช็คชื่อจำลองสำหรับนักกีฬาที่มีสิทธิ์ในแต่ละรอบ
  const attendanceValues: {
    id: string;
    sessionId: string;
    athleteId: string;
    status: 'PRESENT' | 'ABSENT' | 'LEAVE';
    notes: string | null;
    checkedBy: string;
  }[] = [];

  for (const sess of sessionsList) {
    for (const athlete of generatedAthletes) {
      if (athlete.status === 'ACTIVE' && athlete.startDate <= sess.date) {
        let status: 'PRESENT' | 'ABSENT' | 'LEAVE' = 'PRESENT';
        let notes: string | null = null;

        const rand = Math.random();
        if (athlete.attendanceTendency === 'VERY_HIGH') {
          status = 'PRESENT';
        } else if (athlete.attendanceTendency === 'HIGH') {
          status = rand < 0.88 ? 'PRESENT' : rand < 0.95 ? 'LEAVE' : 'ABSENT';
        } else if (athlete.attendanceTendency === 'AVERAGE') {
          status = rand < 0.70 ? 'PRESENT' : rand < 0.85 ? 'LEAVE' : 'ABSENT';
        } else if (athlete.attendanceTendency === 'OFTEN_LEAVE') {
          status = rand < 0.50 ? 'PRESENT' : 'LEAVE';
          if (status === 'LEAVE') notes = 'ลาป่วย / ติดภารกิจ';
        } else if (athlete.attendanceTendency === 'OFTEN_ABSENT') {
          status = rand < 0.45 ? 'PRESENT' : 'ABSENT';
          if (status === 'ABSENT') notes = 'ขาดโดยไม่แจ้ง';
        }

        attendanceValues.push({
          id: crypto.randomUUID(),
          sessionId: sess.id,
          athleteId: athlete.id,
          status,
          notes,
          checkedBy: coachId,
        });
      }
    }
  }

  for (const val of attendanceValues) {
    await db.insert(attendances).values(val);
  }

  revalidatePath('/');
  revalidatePath('/athletes');
  revalidatePath('/sessions');
}
