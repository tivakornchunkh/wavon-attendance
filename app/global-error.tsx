'use client';

import React from 'react';
import { formatUserFriendlyError } from '../src/lib/error-formatter';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendlyMessage = formatUserFriendlyError(
    error,
    'ระบบพบข้อขัดข้องในโครงสร้างหลัก กรุณากดลองใหม่อีกครั้ง'
  );

  return (
    <html lang="th">
      <body className="bg-zinc-50 font-sans antialiased text-zinc-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold mx-auto">
            ⚠️
          </div>

          <h1 className="text-xl font-black text-zinc-900">
            ระบบขัดข้องชั่วคราว
          </h1>

          <p className="text-xs text-zinc-600 leading-relaxed">
            {friendlyMessage}
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              🔄 ลองใหม่อีกครั้ง
            </button>
            <a
              href="/"
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm shadow-sm transition"
            >
              🏠 กลับสู่หน้าหลัก
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
