import React from 'react';
import Link from 'next/link';
import { db } from '../../../src/server/db/client';
import { teams } from '../../../src/server/db/schema';
import { eq } from 'drizzle-orm';
import { SessionRepository } from '../../../src/server/repositories/session.repo';
import { AthleteRepository } from '../../../src/server/repositories/athlete.repo';
import { AttendanceRepository } from '../../../src/server/repositories/attendance.repo';
import AthleteCheckInView from './AthleteCheckInView';
import WavonLogo from '../../../components/WavonLogo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function CheckInPage({ params }: PageProps) {
  const { sessionId } = await params;

  const sessionRepo = new SessionRepository(db);
  const athleteRepo = new AthleteRepository(db);
  const attendanceRepo = new AttendanceRepository(db);

  const session = await sessionRepo.findById(sessionId);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 max-w-md w-full text-center shadow-xl">
          <WavonLogo theme="light" size="sm" className="justify-center mb-4" />
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-zinc-900">
            ไม่พบรอบการฝึกซ้อมนี้
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
            ลิงก์หรือคิวอาร์โค้ดนี้อาจไม่ถูกต้อง หรือรอบการซ้อมอาจถูกยกเลิกแล้ว กรุณาติดต่อโค้ชผู้ฝึกสอนของคุณ
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#0F1115] text-white text-xs font-bold hover:bg-zinc-800 transition"
            >
              เข้าสู่ระบบโค้ช
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [team] = await db.select().from(teams).where(eq(teams.id, session.teamId)).limit(1);
  const teamAthletes = await athleteRepo.findByTeam(session.teamId);
  const sessionAttendances = await attendanceRepo.findBySessionId(sessionId);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="py-4 px-4 border-b border-zinc-200/80 bg-white shadow-2xs flex items-center justify-between max-w-lg mx-auto">
        <WavonLogo theme="light" size="sm" />
        <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
          ระบบเช็คชื่อนักกีฬา
        </span>
      </header>

      <main className="pb-12">
        <AthleteCheckInView
          session={{
            id: session.id,
            title: session.title,
            date: session.date,
            startTime: session.startTime,
            endTime: session.endTime,
          }}
          team={{
            id: team?.id || session.teamId,
            name: team?.name || 'สโมสรกีฬา',
          }}
          athletes={teamAthletes.map((a) => ({
            id: a.id,
            athleteCode: a.athleteCode,
            name: a.name,
            phone: a.phone,
            status: a.status,
          }))}
          initialAttendances={sessionAttendances.map((att) => ({
            athleteId: att.athleteId,
            status: att.status,
            notes: att.notes,
          }))}
        />
      </main>

      <footer className="py-6 border-t border-zinc-200 text-center text-xs text-zinc-400">
        <p className="font-semibold text-zinc-500">WAVON Athlete Attendance</p>
        <p className="text-[10px] text-zinc-400 mt-0.5">ระบบเช็คชื่อนักกีฬาแบบไร้รอยต่อ</p>
      </footer>
    </div>
  );
}