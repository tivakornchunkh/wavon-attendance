'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { registerAction } from '../actions/auth.actions';

export default function RegisterForm() {
  const [clubName, setClubName] = useState('');
  const [coachName, setCoachName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        await registerAction(formData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง');
        }
      }
    });
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            1. ชื่อสโมสร / ทีมกีฬา <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="เช่น สโมสรฟุตบอลเยาวชน กทม., Dream Academy"
            disabled={isPending}
            className="w-full px-3.5 py-3 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[46px]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            2. ชื่อ-นามสกุล หรือชื่อเล่นโค้ช <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={coachName}
            onChange={(e) => setCoachName(e.target.value)}
            placeholder="เช่น โค้ชธงชัย หรือ อ. สุรชัย"
            disabled={isPending}
            className="w-full px-3.5 py-3 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[46px]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 mb-1.5">
            3. ชื่อผู้ใช้งาน (Username สำหรับล็อกอิน) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="เช่น coach_thong, coach123 (ภาษาอังกฤษหรือตัวเลข)"
            disabled={isPending}
            className="w-full px-3.5 py-3 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono min-h-[46px]"
          />
          <span className="text-[10px] text-zinc-400 mt-1 block">
            ตัวอักษรภาษาอังกฤษหรือตัวเลขอย่างน้อย 3 ตัว
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              4. ตั้งรหัสผ่าน <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 4 ตัวอักษร"
              disabled={isPending}
              className="w-full px-3.5 py-3 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[46px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              5. ยืนยันรหัสผ่านอีกครั้ง <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="พิมพ์รหัสผ่านเดิมซ้ำ"
              disabled={isPending}
              className={`w-full px-3.5 py-3 text-xs sm:text-sm border rounded-xl focus:outline-none bg-white min-h-[46px] ${
                passwordsMismatch
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-500'
                  : passwordsMatch
                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500'
                  : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
              }`}
            />
          </div>
        </div>

        {passwordsMismatch && (
          <p className="text-[11px] text-rose-600 font-medium">
            ❌ รหัสผ่านทั้งสองช่องยังไม่ตรงกัน
          </p>
        )}
        {passwordsMatch && (
          <p className="text-[11px] text-emerald-600 font-medium">
            ✓ รหัสผ่านตรงกันแล้ว
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-4 px-4 py-3.5 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>กำลังเปิดสโมสรใหม่...</span>
            </>
          ) : (
            <>
              <span>🚀 เปิดสโมสรและเริ่มต้นใช้งาน</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-zinc-200 text-center">
        <p className="text-xs text-zinc-600">
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
