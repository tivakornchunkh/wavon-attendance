'use client';

import React, { useState, useTransition } from 'react';
import { saveRecurringScheduleAction } from '../actions/session.actions';

interface RecurringScheduleModalProps {
  initialSchedule?: {
    daysOfWeek: string;
    startTime: string;
    endTime: string;
    title: string;
    isActive: number;
  } | null;
}

export default function RecurringScheduleModal({ initialSchedule }: RecurringScheduleModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  const defaultDays: number[] = initialSchedule?.daysOfWeek
    ? JSON.parse(initialSchedule.daysOfWeek)
    : [1, 2, 3, 4, 5]; // Default to Mon-Fri

  const [selectedDays, setSelectedDays] = useState<number[]>(defaultDays);
  const [startTime, setStartTime] = useState(initialSchedule?.startTime || '17:00');
  const [endTime, setEndTime] = useState(initialSchedule?.endTime || '19:00');
  const [title, setTitle] = useState(initialSchedule?.title || 'ซ้อมประจำวัน');
  const [isActive, setIsActive] = useState(initialSchedule?.isActive ?? 1);

  const daysConfig = [
    { day: 1, label: 'จันทร์', short: 'จ.' },
    { day: 2, label: 'อังคาร', short: 'อ.' },
    { day: 3, label: 'พุธ', short: 'พ.' },
    { day: 4, label: 'พฤหัสบดี', short: 'พฤ.' },
    { day: 5, label: 'ศุกร์', short: 'ศ.' },
    { day: 6, label: 'เสาร์', short: 'ส.' },
    { day: 0, label: 'อาทิตย์', short: 'อา.' },
  ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Keep at least 1 day
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSelectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('daysOfWeek', JSON.stringify(selectedDays));
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('title', title.trim() || 'ซ้อมประจำวัน');
    formData.append('isActive', isActive ? '1' : '0');

    startTransition(async () => {
      try {
        await saveRecurringScheduleAction(formData);
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1200);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 shadow-xs transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
        title="ตั้งค่าตารางซ้อมประจำสัปดาห์ (เปิดรอบอัตโนมัติ)"
      >
        <span>📅</span>
        <span>ตารางซ้อมประจำ (จ-ศ)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  📅
                </span>
                <div>
                  <h3 className="text-base font-black text-zinc-900">
                    ตารางฝึกซ้อมประจำสัปดาห์
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    ระบบจะเปิดรับเช็คชื่ออัตโนมัติตามวันและเวลานี้
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-2">
                <span>✓</span>
                <span>บันทึกตารางฝึกซ้อมประจำเรียบร้อยแล้ว!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Day selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    วันฝึกซ้อมประจำสัปดาห์ <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectWeekdays}
                    className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    เลือก จันทร์ - ศุกร์
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {daysConfig.map((d) => {
                    const isSelected = selectedDays.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => toggleDay(d.day)}
                        className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer min-h-[44px] ${
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                      >
                        <span>{d.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    เวลาเริ่มซ้อม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    เวลาเลิกซ้อม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[42px]"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  ชื่อรอบซ้อมประจำ
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น ซ้อมประจำวัน, ช่วงฝึกทักษะ"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[42px]"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-zinc-800">เปิดใช้งานระบบตารางอัตโนมัติ</p>
                  <p className="text-[10px] text-zinc-400">ระบบจะจับคู่รอบซ้อมประจำให้อัตโนมัติเมื่อเด็กสแกน QR</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(isActive === 1 ? 0 : 1)}
                  className={`w-12 h-6 rounded-full transition-colors p-1 cursor-pointer flex items-center ${
                    isActive === 1 ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-50 min-h-[42px] cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 min-h-[42px] cursor-pointer"
                >
                  {isPending ? 'กำลังบันทึก...' : '💾 บันทึกตารางซ้อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

