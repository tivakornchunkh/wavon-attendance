'use client';

import React, { useState, useTransition } from 'react';
import WavonLogo from '../../components/WavonLogo';

interface LoginFormProps {
  loginAction: (formData: FormData) => Promise<void>;
}

export function LoginForm({ loginAction }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await loginAction(formData);
      } catch (err: unknown) {
        const error = err as { message?: string; digest?: string };
        // Next.js redirect internally throws an error with NEXT_REDIRECT digest
        if (error?.message?.includes('NEXT_REDIRECT') || error?.digest?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrorMessage(error?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    });
  };

  return (
    <>
      {/* Fullscreen Backdrop Glass Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center animate-fade-in p-4">
          <div className="bg-[#0F1115]/95 border border-zinc-700/80 rounded-3xl p-7 flex flex-col items-center gap-4 text-center shadow-2xl max-w-xs w-full animate-pop">
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/25 animate-ping opacity-75" />
              <div className="relative animate-pulse">
                <WavonLogo theme="dark" size="lg" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                <span>กำลังเข้าสู่ระบบ</span>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">ตรวจสอบความถูกต้องและเตรียมข้อมูลสโมสร</p>
            </div>

            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden mt-1">
              <div className="h-full bg-emerald-500 rounded-full animate-indeterminate" />
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-toast">
          <span>⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            ชื่อผู้ใช้งาน (Username)
          </label>
          <input
            type="text"
            name="username"
            required
            disabled={isPending}
            placeholder="กรอกชื่อผู้ใช้งาน"
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 min-h-[44px] disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            รหัสผ่าน (Password)
          </label>
          <input
            type="password"
            name="password"
            required
            disabled={isPending}
            placeholder="กรอกรหัสผ่าน"
            className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50 min-h-[44px] disabled:opacity-60"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[46px] flex items-center justify-center gap-2 disabled:opacity-75"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <>
              <span>เข้าสู่ระบบ</span>
              <span>&rarr;</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
