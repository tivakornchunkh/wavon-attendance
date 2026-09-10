import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
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

  const isPitch = pitch !== 'false'; // Default to true from pitch QR

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
            คิวอาร์โค้ดประจำสนามนี้อาจไม่ถูกต้อง หรือสโมสรถูกยกเลิกไปแล้ว
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

  // หากยังไม่มีรอบซ้อมเปิดอยู่ ให้แสดงหน้าจอแจ้งเตือนรอบถัดไป
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <WavonLogo theme="light" size="md" className="justify-center mb-4" />

        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-zinc-200/50 rounded-3xl border border-zinc-200/80">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl mx-auto mb-4 shadow-xs">
            ⏱️
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-800">
            🏢 {clubName}
          </span>

          <h2 className="mt-4 text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
            ยังไม่ถึงเวลาเปิดรอบซ้อม
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-zinc-500 leading-relaxed">
            ระบบเช็คชื่อจะเปิดรับอัตโนมัติตามตารางฝึกซ้อมของสโมสร
          </p>

          <div className="mt-5 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs text-zinc-700 font-semibold space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">ข้อมูลตารางซ้อม</p>
            <p className="text-zinc-900 text-sm font-black">{nextScheduleInfo}</p>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              กรุณาสแกน QR Code ใหม่อีกครั้งเมื่อถึงเวลาฝึกซ้อม
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          WAVON Athlete Attendance • ป้าย QR Code ประจำสนามถาวร
        </p>
      </div>
    </div>
  );
}

