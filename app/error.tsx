'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import WavonLogo from '../components/WavonLogo';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-8 sm:p-10 shadow-lg max-w-md w-full flex flex-col items-center gap-4">
        <WavonLogo theme="light" size="md" className="justify-center" />

        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mt-2">
          SYSTEM ERROR &bull; เกิดข้อผิดพลาด
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          เกิดข้อผิดพลาดในการประมวลผล
        </h1>

        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-xs">
          ระบบพบข้อขัดข้องชั่วคราว ข้อมูลของคุณยังปลอดภัย กรุณากดลองใหม่อีกครั้ง หรือกลับสู่แดชบอร์ด
        </p>

        {error?.message && (
          <div className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] font-mono text-zinc-600 text-left overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="pt-3 w-full flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          >
            <span>🔄</span>
            <span>ลองใหม่อีกครั้ง</span>
          </button>
          <Link
            href="/"
            className="flex-1 px-5 py-3 rounded-xl bg-[#0F1115] hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <span>🏠</span>
            <span>หน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
