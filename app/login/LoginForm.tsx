'use client';

import React, { useState, useTransition } from 'react';
import WavonLogo from '../../components/WavonLogo';
import { formatUserFriendlyError } from '../../src/lib/error-formatter';
import { AuthActionResult } from '../actions/auth.actions';

interface LoginFormProps {
  loginAction: (formData: FormData) => Promise<AuthActionResult>;
}

export function LoginForm({ loginAction }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'username' | 'password' | 'general' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorField(null);

    const formData = new FormData();
    formData.append('username', username.trim());
    formData.append('password', password);

    startTransition(async () => {
      try {
        const res = await loginAction(formData);

        if (!res.success) {
          setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
          setErrorField(res.field || 'general');
          return;
        }

        if (res.redirectTo) {
          window.location.href = res.redirectTo;
        }
      } catch (err: unknown) {
        const friendlyMsg = formatUserFriendlyError(
          err,
          'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
        );
        if (friendlyMsg) {
          setErrorMessage(friendlyMsg);
          setErrorField('general');
        }
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

      {/* Clear, Informative Error Alert Box */}
      {errorMessage && (
        <div className="w-full mb-5 p-4 rounded-2xl bg-rose-50/90 border-2 border-rose-300 text-rose-900 shadow-sm animate-alert space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="text-lg shrink-0 leading-none mt-0.5">⚠️</span>
            <div className="space-y-1 text-xs">
              <p className="font-black text-rose-900 leading-snug">
                {errorMessage}
              </p>
              {errorField === 'username' && (
                <p className="text-[11px] text-rose-700 font-medium">
                  💡 หากยังไม่เคยมีบัญชี สามารถกดปุ่ม <strong>&quot;เปิดสโมสรใหม่&quot;</strong> ด้านล่างเพื่อเริ่มใช้งานได้ฟรีทันที
                </p>
              )}
              {errorField === 'password' && (
                <p className="text-[11px] text-rose-700 font-medium">
                  💡 ตรวจสอบว่าปุ่ม <strong>Caps Lock</strong> เปิดค้างอยู่หรือไม่ แล้วลองใหม่อีกครั้ง
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-zinc-700">
              ชื่อผู้ใช้งาน (Username) <span className="text-rose-500">*</span>
            </label>
            {errorField === 'username' && (
              <span className="text-[11px] font-bold text-rose-600 animate-pulse">
                ✕ ตรวจสอบชื่อผู้ใช้
              </span>
            )}
          </div>
          <input
            type="text"
            name="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errorField === 'username') setErrorField(null);
            }}
            required
            disabled={isPending}
            placeholder="เช่น coach_wavon, coach_thunder"
            className={`w-full text-xs sm:text-sm px-4 py-3 rounded-xl border transition min-h-[46px] disabled:opacity-60 focus:outline-none ${
              errorField === 'username'
                ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-zinc-700">
              รหัสผ่าน (Password) <span className="text-rose-500">*</span>
            </label>
            {errorField === 'password' && (
              <span className="text-[11px] font-bold text-rose-600 animate-pulse">
                ✕ รหัสผ่านไม่ถูกต้อง
              </span>
            )}
          </div>
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorField === 'password') setErrorField(null);
            }}
            required
            disabled={isPending}
            placeholder="กรอกรหัสผ่าน"
            className={`w-full text-xs sm:text-sm px-4 py-3 rounded-xl border transition min-h-[46px] disabled:opacity-60 focus:outline-none ${
              errorField === 'password'
                ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-zinc-50/50'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[46px] flex items-center justify-center gap-2 disabled:opacity-75 active:scale-[0.99]"
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
