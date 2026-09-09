import React from 'react';
import Link from 'next/link';
import WavonLogo from '../components/WavonLogo';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 shadow-lg max-w-md w-full flex flex-col items-center gap-4">
        <WavonLogo theme="light" size="md" className="justify-center" />
        
        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-rose-50 text-rose-700 border border-rose-200 mt-2">
          404 &bull; ไม่พบหน้าเว็บ
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          ขออภัย ไม่พบหน้าที่คุณค้นหา
        </h1>

        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-xs">
          หน้าที่คุณต้องการเข้าถึงอาจถูกย้าย ลบ หรือพิมพ์ที่อยู่ URL ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง
        </p>

        <div className="pt-3 w-full flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 px-5 py-3 rounded-xl bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>🏠</span>
            <span>กลับสู่หน้าหลัก</span>
          </Link>
          <Link
            href="/sessions"
            className="flex-1 px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs sm:text-sm font-bold border border-zinc-200 transition flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>⚽</span>
            <span>รอบฝึกซ้อม</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
