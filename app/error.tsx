'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import WavonLogo from '../components/WavonLogo';
import { formatUserFriendlyError } from '../src/lib/error-formatter';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  const friendlyMessage = formatUserFriendlyError(
    error,
    'ระบบพบข้อขัดข้องชั่วคราวในการประมวลผลข้อมูล กรุณารอสักครู่แล้วลองใหม่อีกครั้ง'
  );

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-7 sm:p-9 shadow-lg max-w-md w-full flex flex-col items-center gap-4">
        <WavonLogo theme="light" size="md" className="justify-center" />

        <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider bg-rose-50 text-rose-800 border border-rose-200 mt-2">
          SYSTEM NOTICE &bull; แจ้งเตือนข้อผิดพลาด
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
          พบข้อขัดข้องในการดำเนินการ
        </h1>

        <div className="w-full p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-xs sm:text-sm text-amber-900 space-y-1.5 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span>
            <span>คำอธิบาย:</span>
          </p>
          <p>{friendlyMessage}</p>
          <p className="text-[11px] text-amber-700/90 pt-1">
            💡 ข้อมูลของคุณปลอดภัยและไม่สูญหาย ท่านสามารถกดปุ่มลองใหม่อีกครั้ง หรือกลับสู่หน้าหลัก
          </p>
        </div>

        {/* Collapsible Technical Details for Admins / Developers */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 font-mono flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <span>{showDetails ? '▲ ซ่อนรายละเอียดทางเทคนิค' : '▼ ดูข้อมูลทางเทคนิค (Technical Details)'}</span>
          </button>

          {showDetails && (
            <div className="mt-2.5 p-3 rounded-xl bg-zinc-900 text-zinc-300 text-[10px] font-mono text-left overflow-x-auto space-y-1">
              <div><strong>Message:</strong> {error?.message || 'None'}</div>
              {error?.digest && <div><strong>Digest:</strong> {error.digest}</div>}
              {error?.stack && (
                <div className="max-h-28 overflow-y-auto text-zinc-400 whitespace-pre text-[9px] pt-1 border-t border-zinc-800">
                  {error.stack}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 w-full flex flex-col sm:flex-row gap-2.5">
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

        <Link
          href="/login"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition pt-1"
        >
          🔐 เข้าสู่ระบบใหม่ด้วยบัญชีอื่น
        </Link>
      </div>
    </div>
  );
}
