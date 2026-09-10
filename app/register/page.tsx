import React from 'react';
import Link from 'next/link';
import WavonLogo from '../../components/WavonLogo';
import RegisterForm from './RegisterForm';

export const metadata = {
  title: 'เปิดสโมสรใหม่ | WAVON Athlete Attendance',
  description: 'ลงทะเบียนสร้างสโมสรและเริ่มต้นใช้งานระบบเช็คชื่อนักกีฬา WAVON',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block transition hover:opacity-90">
          <WavonLogo theme="light" size="lg" />
        </Link>
        
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span>✨</span>
          <span>เปิดสโมสรใหม่ ฟรี ไม่มีค่าบริการ</span>
        </div>

        <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
          สร้างสโมสรกีฬาของคุณ
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
          กรอกข้อมูลเพื่อเปิดสโมสรและบัญชีโค้ช พร้อมเริ่มเพิ่มนักกีฬาและเช็คชื่อเข้าซ้อมได้ทันที
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-zinc-200/50 rounded-3xl border border-zinc-200/80">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          ระบบเช็คชื่อนักกีฬา WAVON • ข้อมูลแยกเป็นสัดส่วนเฉพาะสโมสรของคุณ
        </p>
      </div>
    </div>
  );
}
