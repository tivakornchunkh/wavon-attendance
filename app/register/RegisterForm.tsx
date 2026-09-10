'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { registerAction } from '../actions/auth.actions';
import { formatUserFriendlyError } from '../../src/lib/error-formatter';

export default function RegisterForm() {
  const [clubName, setClubName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const formData = new FormData();
    formData.append('clubName', clubName.trim());
    formData.append('coachName', coachName.trim());
    formData.append('username', username.trim().toLowerCase());
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    startTransition(async () => {
      try {
        const res = await registerAction(formData);
        if (!res.success) {
          setError(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียน');
          return;
        }
        if (res.redirectTo) {
          window.location.href = res.redirectTo;
        }
      } catch (err: unknown) {
        const friendly = formatUserFriendlyError(err, 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        if (friendly) setError(friendly);
      }
    });
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-4 bg-rose-50/90 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-2xl font-medium flex items-center gap-2.5 animate-alert shadow-2xs">
          <span className="text-base shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            1. ชื่อสโมสร / ทีมกีฬา <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              🏢
            </div>
            <input
              type="text"
              required
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="เช่น สโมสรฟุตบอลเยาวชน กทม., Dream Academy"
              disabled={isPending}
              className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50/50 hover:bg-white focus:bg-white text-zinc-900 min-h-[48px] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            2. ชื่อ-นามสกุล หรือชื่อเล่นโค้ช <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              👤
            </div>
            <input
              type="text"
              required
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              placeholder="เช่น โค้ชธงชัย หรือ อ. สุรชัย"
              disabled={isPending}
              className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50/50 hover:bg-white focus:bg-white text-zinc-900 min-h-[48px] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            3. ชื่อผู้ใช้งาน (Username สำหรับล็อกอิน) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              🔐
            </div>
            <input
              type="text"
              required
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น coach_thong, coach123 (ภาษาอังกฤษ/ตัวเลข)"
              disabled={isPending}
              className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50/50 hover:bg-white focus:bg-white font-mono text-zinc-900 min-h-[48px] transition"
            />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">
            ตัวอักษรภาษาอังกฤษหรือตัวเลขอย่างน้อย 3 ตัว
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              4. ตั้งรหัสผ่าน <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 4 ตัวอักษร"
                disabled={isPending}
                className="w-full pl-3.5 pr-10 py-3 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-zinc-50/50 hover:bg-white focus:bg-white text-zinc-900 min-h-[48px] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
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

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              5. ยืนยันรหัสผ่านอีกครั้ง <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="พิมพ์รหัสผ่านเดิมซ้ำ"
              disabled={isPending}
              className={`w-full px-3.5 py-3 text-xs sm:text-sm border rounded-xl focus:outline-none min-h-[48px] transition ${
                passwordsMismatch
                  ? 'border-rose-400 ring-2 ring-rose-200 bg-rose-50/20 text-rose-900'
                  : passwordsMatch
                  ? 'border-emerald-500 ring-2 ring-emerald-200/50 bg-emerald-50/20 text-emerald-900'
                  : 'border-zinc-200 bg-zinc-50/50 hover:bg-white focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-zinc-900'
              }`}
            />
          </div>
        </div>

        {passwordsMismatch && (
          <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
            <span>✕</span>
            <span>รหัสผ่านทั้งสองช่องยังไม่ตรงกัน</span>
          </p>
        )}
        {passwordsMatch && (
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <span>✓</span>
            <span>รหัสผ่านตรงกันแล้ว</span>
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-5 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/25 transition-all cursor-pointer min-h-[52px] flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>กำลังเปิดสโมสรใหม่...</span>
            </>
          ) : (
            <>
              <span>Sign Up / เปิดสโมสรใหม่</span>
              <span className="text-white/80">&rarr;</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
        <p className="text-xs text-zinc-500">
          มีบัญชีสโมสรอยู่แล้ว?{' '}
          <Link
            href="/login"
            className="font-bold text-zinc-900 hover:text-emerald-600 underline transition"
          >
            เข้าสู่ระบบที่นี่
          </Link>
        </p>
      </div>
    </div>
  );
}

