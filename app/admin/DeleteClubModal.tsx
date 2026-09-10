'use client';

import React, { useState, useTransition } from 'react';
import { deleteClubAction } from '../actions/auth.actions';

interface DeleteClubModalProps {
  teamId: string;
  teamName: string;
  athleteCount: number;
  sessionCount: number;
  isOnlyClub: boolean;
}

export default function DeleteClubModal({
  teamId,
  teamName,
  athleteCount,
  sessionCount,
  isOnlyClub,
}: DeleteClubModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setTypedName('');
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setTypedName('');
    setError(null);
  };

  const isMatch = typedName.trim() === teamName.trim();

  const handleDelete = () => {
    if (!isMatch || isOnlyClub || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        await deleteClubAction(teamId, typedName);
        setIsOpen(false);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('เกิดข้อผิดพลาดในการลบสโมสร');
        }
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isOnlyClub}
        title={isOnlyClub ? 'ไม่สามารถลบสโมสรสุดท้ายได้' : 'ลบสโมสรนี้'}
        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer ${
          isOnlyClub
            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 active:bg-rose-200 border border-rose-200'
        }`}
      >
        <span>🗑️</span>
        <span>ลบ</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Warning Header */}
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold mb-4">
              ⚠️
            </div>

            <h3 className="text-lg font-black text-zinc-900">
              ยืนยันการลบสโมสร &quot;{teamName}&quot;
            </h3>

            <p className="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed">
              การดำเนินการนี้เป็นแบบ <strong className="text-rose-600 font-bold">ลบถาวร (Hard Delete)</strong> ไม่สามารถกู้คืนข้อมูลได้ ข้อมูลที่จะถูกลบทั้งหมดประกอบด้วย:
            </p>

            <ul className="mt-3 space-y-1.5 bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-900">
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>ข้อมูลนักกีฬาในสังกัด <strong>{athleteCount}</strong> คน</span>
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>ประวัติรอบการฝึกซ้อมทั้งหมด <strong>{sessionCount}</strong> รอบ</span>
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>ประวัติและสถิติการเข้าซ้อมทั้งหมด</span>
              </li>
              <li className="flex items-center gap-2">
                <span>•</span>
                <span>บัญชีผู้ใช้ของโค้ชประจำสโมสรนี้</span>
              </li>
            </ul>

            {error && (
              <div className="mt-3 p-3 bg-red-100 text-red-800 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                เพื่อความปลอดภัย กรุณาพิมพ์ชื่อสโมสร <code className="bg-zinc-100 text-zinc-900 px-1.5 py-0.5 rounded font-bold">{teamName}</code> ด้านล่าง:
              </label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={`พิมพ์ "${teamName}"`}
                disabled={isPending}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white min-h-[44px]"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[44px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isMatch || isPending}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 min-h-[44px] cursor-pointer ${
                  isMatch && !isPending
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/20'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังลบข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <span>🗑️ ยืนยันการลบถาวร</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
