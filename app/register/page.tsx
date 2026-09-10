import React from 'react';
import Link from 'next/link';
import WavonLogo from '../../components/WavonLogo';
import RegisterForm from './RegisterForm';
import { APP_VERSION } from '../../src/version';

export const metadata = {
  title: 'เปิดสโมสรใหม่ | WAVON Athlete Attendance',
  description: 'ลงทะเบียนสร้างสโมสรและเริ่มต้นใช้งานระบบเช็คชื่อนักกีฬา WAVON',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-28 -right-28 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 w-96 h-96 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]">
          <WavonLogo theme="light" size="lg" className="justify-center" />
        </Link>
        
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-emerald-800 border border-emerald-200/80 shadow-2xs backdrop-blur-xs">
          <span>✨</span>
          <span>เปิดสโมสรใหม่ ฟรี ไม่มีค่าบริการ</span>
          <span className="text-zinc-300">•</span>
          <span className="font-mono text-zinc-500">{APP_VERSION}</span>
        </div>

        <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
          สร้างสโมสรกีฬาของคุณ
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
          กรอกข้อมูลเพื่อเปิดสโมสรและบัญชีโค้ช พร้อมเริ่มเพิ่มนักกีฬาและเช็คชื่อเข้าซ้อมได้ทันที
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-7 px-6 sm:px-9 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] rounded-3xl border border-zinc-200/90">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          ระบบเช็คชื่อนักกีฬา WAVON • ข้อมูลแยกเป็นสัดส่วนเฉพาะสโมสรของคุณ
        </p>
      </div>
    </div>
  );
}

