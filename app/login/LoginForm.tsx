'use client';

import React, { useState, useTransition } from 'react';
import WavonLogo from '../../components/WavonLogo';
import { formatUserFriendlyError } from '../../src/lib/error-formatter';
import { AuthActionResult } from '../actions/auth.actions';

interface LoginFormProps {
  loginAction: (formData: FormData) => Promise<AuthActionResult>;
}

interface DemoAccount {
  id: string;
  name: string;
  role: string;
  badge: string;
  badgeColor: string;
  username: string;
  password: string;
  icon: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'arm',
    name: 'โค้ชอาร์ม',
    role: 'ผู้ดูแล WAVON FC',
    badge: 'ADMIN',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    username: 'arm',
    password: '123456',
    icon: '⚡',
  },
  {
    id: 'coach_wavon',
    name: 'คนเช็คชื่อ WAVON',
    role: 'WAVON FC',
    badge: 'COACH',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    username: 'coach_wavon',
    password: 'pass1234',
    icon: '⚽',
  },
  {
    id: 'coach_thunder',
    name: 'คนเช็คชื่อ THUNDER',
    role: 'THUNDER CLUB',
    badge: 'COACH',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    username: 'coach_thunder',
    password: 'pass1234',
    icon: '🏃',
  },
  {
    id: 'admin',
    name: 'ผู้ดูแลกลาง',
    role: 'ระบบส่วนกลาง',
    badge: 'SUPER',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    username: 'admin',
    password: 'admin1234',
    icon: '👑',
  },
];

export function LoginForm({ loginAction }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'username' | 'password' | 'general' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>(null);

  const handleSelectDemo = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setSelectedDemoId(acc.id);
    setErrorMessage(null);
    setErrorField(null);
  };

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
        <div className="fixed inset-0 z-50 bg-white/75 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white/95 border border-zinc-200/90 rounded-3xl p-8 flex flex-col items-center gap-4 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] max-w-xs w-full animate-pop">
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

      {/* 1-Click Fast Login Demo Pills */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚡</span>
            <span>เลือกบัญชีทดสอบด่วน (1-Click Fast Login)</span>
          </label>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
            แตะเพื่อกรอกอัตโนมัติ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = selectedDemoId === acc.id || (username === acc.username);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                disabled={isPending}
                className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer min-h-[58px] ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-zinc-50/70 hover:bg-zinc-100/80 border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1 truncate">
                    <span>{acc.icon}</span>
                    <span className="truncate">{acc.name}</span>
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${acc.badgeColor}`}>
                    {acc.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between w-full mt-1 text-[10px] text-zinc-500">
                  <span className="truncate">{acc.role}</span>
                  <span className="font-mono text-[9px] text-zinc-400">@{acc.username}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Informative Error Alert Box */}
      {errorMessage && (
        <div className="w-full mb-5 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-900 shadow-xs animate-alert space-y-1.5">
          <div className="flex items-start gap-2.5">
            <span className="text-base shrink-0 leading-none mt-0.5">⚠️</span>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-rose-900 leading-snug">
                {errorMessage}
              </p>
              {errorField === 'username' && (
                <p className="text-[11px] text-rose-700 font-normal">
                  💡 หากยังไม่มีบัญชี สามารถกดปุ่ม <strong>&quot;เปิดสโมสรใหม่&quot;</strong> ด้านล่างเพื่อเริ่มใช้งานได้ฟรีทันที
                </p>
              )}
              {errorField === 'password' && (
                <p className="text-[11px] text-rose-700 font-normal">
                  💡 ตรวจสอบว่าปุ่ม <strong>Caps Lock</strong> เปิดอยู่หรือไม่ หรือแตะปุ่มชิปเลือกบัญชีด้านบนเพื่อกรอกรหัสที่ถูกต้อง
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form Fields */}
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
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
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
                setSelectedDemoId(null);
                if (errorField === 'username') setErrorField(null);
              }}
              required
              disabled={isPending}
              placeholder="กรอกชื่อผู้ใช้ เช่น arm, coach_wavon"
              className={`w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border transition min-h-[48px] disabled:opacity-60 focus:outline-none ${
                errorField === 'username'
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-zinc-900'
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
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
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
                setSelectedDemoId(null);
                if (errorField === 'password') setErrorField(null);
              }}
              required
              disabled={isPending}
              placeholder="กรอกรหัสผ่านของคุณ"
              className={`w-full text-xs sm:text-sm pl-10 pr-11 py-3 rounded-xl border transition min-h-[48px] disabled:opacity-60 focus:outline-none ${
                errorField === 'password'
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/30'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-zinc-900'
              }`}
            />
            {/* Show/Hide Password Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isPending}
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-3 px-5 py-3.5 bg-zinc-900 hover:bg-black active:bg-zinc-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-75 active:scale-[0.99]"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>กำลังตรวจสอบสิทธิ์...</span>
            </>
          ) : (
            <>
              <span>เข้าสู่ระบบสโมสร</span>
              <span className="text-emerald-400">&rarr;</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}
