import React from 'react';
import { redirect } from 'next/navigation';
import { resolveClubActiveSession } from '../../../actions/session.actions';
import WavonLogo from '../../../../components/WavonLogo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    clubId: string;
  }>;
  searchParams: Promise<{
    pitch?: string;
  }>;
}

export default async function PermanentClubCheckInPage({ params, searchParams }: PageProps) {
  const { clubId } = await params;
  const { pitch } = await searchParams;

  const isPitch = pitch !== 'false';

  let resolution;
  try {
    resolution = await resolveClubActiveSession(clubId);
  } catch {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 max-w-md w-full text-center shadow-xl">
          <WavonLogo theme="light" size="sm" className="justify-center mb-4" />
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-black text-zinc-900">
            ไม่พบข้อมูลสโมสร
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
            คิวอาร์โค้ดประจำสนามนี้อาจไม่ถูกต้อง หรือมีการรีเซ็ตสร้างคิวอาร์โค้ดใหม่ กรุณาติดต่อโค้ชผู้ฝึกสอน
          </p>
        </div>
      </div>
    );
  }

  const { activeSession, clubName, nextScheduleInfo } = resolution;

  // หากพบรอบซ้อมที่กำลังเปิดอยู่ ให้นำไปยังหน้ารอบซ้อมนั้นทันที
  if (activeSession) {
    redirect(`/checkin/${activeSession.id}?pitch=${isPitch ? 'true' : 'false'}`);
  }

  // หากยังไม่มีรอบซ้อมเปิดอยู่ แสดงหน้าจอ Minimalist Cyberpass Waiting Screen พร้อม Auto Refresh
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Meta Auto-Refresh every 15s to automatically transition when session starts */}
      <meta httpEquiv="refresh" content="15" />

      {/* Ambient Neon Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <WavonLogo theme="light" size="md" className="justify-center mb-5" />

        {/* Minimalist Cyberpass Waiting Card */}
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl shadow-emerald-950/5 rounded-3xl border border-zinc-200/90 relative overflow-hidden">
          {/* Top Neon Border Line */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-500" />

          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
            ⏱️
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800 border border-zinc-200">
            <span>🛡️</span>
            <span>{clubName}</span>
          </div>

          <h2 className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
            ยังไม่ถึงเวลาเปิดรอบซ้อม
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
            ระบบเช็คชื่อจะเปิดรับอัตโนมัติตามตารางฝึกซ้อมของสโมสร (เปิดก่อนเริ่ม 30 นาที)
          </p>

          <div className="mt-5 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-700 font-semibold space-y-1 text-left">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">ข้อมูลตารางซ้อมประจำ:</p>
            <p className="text-zinc-900 text-sm font-black leading-snug">{nextScheduleInfo}</p>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-100 space-y-2">
            <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>หน้านี้จะรีเฟรชตรวจเช็คเวลาเปิดรอบให้อัตโนมัติทุก 15 วินาที</span>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400 font-mono">
          WAVON Athlete Attendance • ป้าย QR Code ประจำสนามถาวร
        </p>
      </div>
    </div>
  );
}
