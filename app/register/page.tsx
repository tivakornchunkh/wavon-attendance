import React from 'react';
import Link from 'next/link';
import WavonLogo from '../../components/WavonLogo';
import RegisterForm from './RegisterForm';
import { APP_VERSION } from '../../src/version';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'เปิดสโมสรใหม่ | WAVON Athlete Attendance',
  description: 'ลงทะเบียนสร้างสโมสรและเริ่มต้นใช้งานระบบเช็คชื่อนักกีฬา WAVON',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-16 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Clean Brand Header */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-85">
            <WavonLogo theme="light" size="lg" className="justify-center" />
          </Link>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white text-zinc-600 border border-zinc-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>เปิดสโมสรใหม่</span>
            <span className="text-zinc-300">•</span>
            <span className="font-mono text-zinc-500">{APP_VERSION}</span>
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            ลงทะเบียนสโมสร
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-xs leading-relaxed">
            สร้างสโมสรและเริ่มใช้งานระบบเช็คชื่อนักกีฬาได้ทันที ฟรีไม่มีค่าใช้จ่าย
          </p>
        </div>

        {/* Clean Main Card */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <RegisterForm />
        </div>

        {/* Clean Footer */}
        <div className="text-center py-2 space-y-1 text-xs text-zinc-400">
          <p className="font-medium text-zinc-600">
            WAVON Sports Management System &bull; <span className="font-mono">{APP_VERSION}</span>
          </p>
          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} WAVON. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}


