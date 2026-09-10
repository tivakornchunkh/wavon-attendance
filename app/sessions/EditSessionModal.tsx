'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateSessionAction } from '../actions/session.actions';

interface EditSessionModalProps {
  session: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  triggerButtonText?: string;
  triggerButtonClass?: string;
}

export default function EditSessionModal({
  session,
  triggerButtonText = '✏️ แก้ไขรอบซ้อม',
  triggerButtonClass,
}: EditSessionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(session.title);
  const [date, setDate] = useState(session.date);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (startTime >= endTime) {
      setError('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
      return;
    }

    const formData = new FormData();
    formData.append('sessionId', session.id);
    formData.append('title', title.trim() || session.title);
    formData.append('date', date);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);

    startTransition(async () => {
      try {
        await updateSessionAction(formData);
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          router.refresh();
        }, 1000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTitle(session.title);
          setDate(session.date);
          setStartTime(session.startTime);
          setEndTime(session.endTime);
          setError(null);
          setSuccess(false);
          setIsOpen(true);
        }}
        className={
          triggerButtonClass ||
          'px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 shadow-xs hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] active:scale-95'
        }
        title="แก้ไขวัน เวลา หรือหัวข้อรอบซ้อมนี้"
      >
        <span>{triggerButtonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/90 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm">
                  ✏️
                </span>
                <div>
                  <h3 className="text-base font-black text-zinc-900">
                    แก้ไขรอบการฝึกซ้อม
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    QR Code ประจำสนามจะอัปเดตตามเวลาใหม่อัตโนมัติ (ไม่ต้องพิมพ์ป้ายใหม่)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer transition text-xs"
              >
                ✕
              </button>
            </div>

            {/* Notification Messages */}
            {error && (
              <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <span>✓</span>
                <span>บันทึกการแก้ไขรอบซ้อมเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  หัวข้อรอบการฝึกซ้อม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ซ้อมแท็กติก / ทำกำลัง"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  วันที่ฝึกซ้อม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    เวลาเริ่มต้น <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    เวลาสิ้นสุด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                  />
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-[11px] text-zinc-500 space-y-1">
                <p className="font-bold text-zinc-700">💡 คำแนะนำ:</p>
                <p>การแก้ไขเวลานี้จะอัปเดตระบบตรวจสอบการสแกนทันที โดยที่นักกีฬายังคงสแกนผ่านป้าย QR Code เดิมได้ตามปกติ</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-bold transition cursor-pointer min-h-[42px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[42px] active:scale-95 disabled:opacity-50"
                >
                  <span>{isPending ? 'กำลังบันทึก...' : '✓ บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

