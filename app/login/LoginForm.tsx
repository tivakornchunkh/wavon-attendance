'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
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
  const [showPassword, setShowPassword] = useState(false);

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
      {/* High-Fidelity Clean Frost Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-8 flex flex-col items-center gap-4 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] max-w-xs w-full animate-pop">
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute w-20 h-20 rounded-full bg-emerald-500/15 animate-ping opacity-75" />
              <div className="relative animate-pulse">
                <WavonLogo theme="light" size="lg" />
              </div>
            </div>

            <div className="space-y-1 mt-1">
              <h3 className="text-sm font-black text-zinc-900 flex items-center justify-center gap-2">
                <span>กำลังเข้าสู่ระบบ</span>
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500">กำลังตรวจสอบข้อมูลสโมสรและสิทธิ์การใช้งาน</p>
            </div>

            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden mt-1">
              <div className="h-full bg-emerald-500 rounded-full animate-indeterminate" />
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="w-full mb-5 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 shadow-xs animate-alert space-y-1">
          <div className="flex items-start gap-2.5">
            <span className="text-base shrink-0 leading-none mt-0.5">⚠️</span>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-rose-900 leading-snug">
                {errorMessage}
              </p>
              {errorField === 'username' && (
                <p className="text-[11px] text-rose-700 font-normal">
                  💡 หากยังไม่มีบัญชี สามารถกดปุ่ม <strong>&quot;เปิดสโมสรใหม่&quot;</strong> ด้านล่างเพื่อเริ่มใช้งานฟรีทันที
                </p>
              )}
              {errorField === 'password' && (
                <p className="text-[11px] text-rose-700 font-normal">
                  💡 ตรวจสอบว่าปุ่ม <strong>Caps Lock</strong> เปิดอยู่หรือไม่ แล้วลองกรอกใหม่อีกครั้ง
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Fields (Refined Pill Style from Reference Mockup) */}
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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              name="username"
              value={username}
              autoComplete="username"
              onChange={(e) => {
                setUsername(e.target.value);
                if (errorField === 'username') setErrorField(null);
              }}
              required
              disabled={isPending}
              placeholder="Enter your username"
              className={`w-full text-xs sm:text-sm pl-11 pr-4 py-3.5 rounded-2xl border transition-all min-h-[50px] disabled:opacity-60 focus:outline-none ${
                errorField === 'username'
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30 text-rose-900'
                  : 'border-zinc-200/90 bg-zinc-100/75 hover:bg-zinc-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
          </div>
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
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorField === 'password') setErrorField(null);
              }}
              required
              disabled={isPending}
              placeholder="Enter your password"
              className={`w-full text-xs sm:text-sm pl-11 pr-12 py-3.5 rounded-2xl border transition-all min-h-[50px] disabled:opacity-60 focus:outline-none ${
                errorField === 'password'
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30 text-rose-900'
                  : 'border-zinc-200/90 bg-zinc-100/75 hover:bg-zinc-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            {/* Show/Hide Password Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Vibrant Emerald Submit Button (Matching Reference Mockup) */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-5 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/25 transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2 disabled:opacity-75 active:scale-[0.98]"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>กำลังตรวจสอบสิทธิ์...</span>
            </>
          ) : (
            <>
              <span>Log In / เข้าสู่ระบบ</span>
              <span className="text-white/80">&rarr;</span>
            </>
          )}
        </button>
      </form>

      {/* Bottom Switch to Register (Clean App Style) */}
      <div className="pt-5 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-500">
          ยังไม่มีสโมสรในระบบ?{' '}
          <Link
            href="/register"
            className="font-black text-emerald-700 hover:text-emerald-800 transition hover:underline ml-1"
          >
            เปิดสโมสรใหม่ฟรี
          </Link>
        </p>
      </div>
    </>
  );
}

