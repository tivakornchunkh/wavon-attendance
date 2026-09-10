'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveRecurringScheduleSlotAction,
  deleteRecurringScheduleSlotAction,
} from '../actions/session.actions';

export interface RecurringScheduleSlot {
  id: string;
  teamId: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  title: string;
  isActive: number;
}

interface RecurringScheduleModalProps {
  schedules?: RecurringScheduleSlot[];
  // For backward compatibility:
  initialSchedule?: {
    daysOfWeek: string;
    startTime: string;
    endTime: string;
    title: string;
    isActive: number;
  } | null;
}

const DAYS_CONFIG = [
  { day: 1, label: 'จันทร์', short: 'จ.' },
  { day: 2, label: 'อังคาร', short: 'อ.' },
  { day: 3, label: 'พุธ', short: 'พ.' },
  { day: 4, label: 'พฤหัสบดี', short: 'พฤ.' },
  { day: 5, label: 'ศุกร์', short: 'ศ.' },
  { day: 6, label: 'เสาร์', short: 'ส.' },
  { day: 0, label: 'อาทิตย์', short: 'อา.' },
];

export default function RecurringScheduleModal({
  schedules: propSchedules,
  initialSchedule,
}: RecurringScheduleModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [title, setTitle] = useState('ซ้อมประจำวัน');
  const [isActive, setIsActive] = useState(1);

  // Normalize list of schedules
  const currentSchedules: RecurringScheduleSlot[] = React.useMemo(() => {
    if (propSchedules && propSchedules.length > 0) return propSchedules;
    if (initialSchedule) {
      return [
        {
          id: 'legacy-slot-1',
          teamId: '',
          daysOfWeek: initialSchedule.daysOfWeek,
          startTime: initialSchedule.startTime,
          endTime: initialSchedule.endTime,
          title: initialSchedule.title,
          isActive: initialSchedule.isActive,
        },
      ];
    }
    return [];
  }, [propSchedules, initialSchedule]);

  const resetForm = () => {
    setEditingId(null);
    setSelectedDays([1, 2, 3, 4, 5]);
    setStartTime('17:00');
    setEndTime('19:00');
    setTitle('ซ้อมประจำวัน');
    setIsActive(1);
    setError(null);
    setSuccess(null);
    setMode('list');
  };

  const handleStartAdd = () => {
    resetForm();
    setMode('add');
    setTitle(currentSchedules.length === 0 ? 'ซ้อมเช้า' : 'ซ้อมเย็น');
  };

  const handleStartEdit = (slot: RecurringScheduleSlot) => {
    setEditingId(slot.id);
    setSelectedDays(JSON.parse(slot.daysOfWeek || '[1,2,3,4,5]'));
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setTitle(slot.title);
    setIsActive(slot.isActive);
    setError(null);
    setSuccess(null);
    setMode('edit');
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (startTime >= endTime) {
      setError('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด');
      return;
    }

    const formData = new FormData();
    if (editingId && !editingId.startsWith('legacy-')) {
      formData.append('id', editingId);
    }
    formData.append('daysOfWeek', JSON.stringify(selectedDays));
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    formData.append('title', title.trim() || 'ซ้อมประจำวัน');
    formData.append('isActive', isActive ? '1' : '0');

    startTransition(async () => {
      try {
        await saveRecurringScheduleSlotAction(formData);
        setSuccess('บันทึกช่วงเวลาฝึกซ้อมประจำเรียบร้อยแล้ว!');
        setTimeout(() => {
          setSuccess(null);
          setMode('list');
          router.refresh();
        }, 800);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก');
      }
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!confirm('ต้องการลบช่วงเวลาฝึกซ้อมประจำนี้ใช่หรือไม่?')) return;
    startTransition(async () => {
      try {
        await deleteRecurringScheduleSlotAction(slotId);
        setSuccess('ลบช่วงเวลาเรียบร้อยแล้ว');
        setTimeout(() => {
          setSuccess(null);
          router.refresh();
        }, 800);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ');
      }
    });
  };

  const formatDays = (daysJson: string) => {
    try {
      const days: number[] = JSON.parse(daysJson);
      if (days.length === 7) return 'ทุกวัน (จ.-อา.)';
      if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'จันทร์ - ศุกร์';
      if (days.length === 2 && [6, 0].every((d) => days.includes(d))) return 'เสาร์ - อาทิตย์';
      return days
        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
        .map((d) => DAYS_CONFIG.find((c) => c.day === d)?.short)
        .join(', ');
    } catch {
      return 'ตามตาราง';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 shadow-xs hover:border-emerald-500/40 hover:shadow-emerald-500/10 transition flex items-center gap-2 cursor-pointer min-h-[40px] active:scale-95"
        title="ตั้งค่าตารางซ้อมประจำสโมสรคู่ป้าย QR ถาวร"
      >
        <span>⚙️</span>
        <span>ตารางซ้อมประจำ ({currentSchedules.length} รอบ/วัน)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200/90 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-base shadow-xs">
                  📅
                </span>
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <span>ตารางซ้อมประจำคู่ QR ถาวร</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-100 text-blue-800">
                      MULTI-SESSION
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    กำหนดเวลาซ้อมของสโมสรได้หลายรอบต่อวัน สแกน QR ถาวรอันเดิมจะจับคู่รอบให้อัตโนมัติ
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

            {/* Error & Success Alerts */}
            {error && (
              <div className="mt-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* MODE 1: LIST SLOTS */}
            {mode === 'list' && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    ช่วงเวลาซ้อมที่เปิดใช้งาน ({currentSchedules.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <span>+</span>
                    <span>เพิ่มช่วงเวลาซ้อม</span>
                  </button>
                </div>

                {currentSchedules.length === 0 ? (
                  <div className="py-8 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-6 space-y-2">
                    <span className="text-3xl block">⏱️</span>
                    <p className="text-xs font-bold text-zinc-700">ยังไม่มีการตั้งค่าตารางซ้อมประจำ</p>
                    <p className="text-[11px] text-zinc-400">
                      กดปุ่ม &quot;เพิ่มช่วงเวลาซ้อม&quot; เพื่อกำหนดเวลา เช่น ซ้อมเช้า 06:00-08:00 หรือ ซ้อมเย็น 17:00-19:00
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentSchedules.map((slot, idx) => (
                      <div
                        key={slot.id || idx}
                        className="p-3.5 rounded-2xl border border-zinc-200/90 bg-white hover:border-emerald-500/30 hover:shadow-xs transition flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-900">{slot.title}</span>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                slot.isActive
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-zinc-100 text-zinc-500'
                              }`}
                            >
                              {slot.isActive ? 'เปิดใช้งาน' : 'ปิด'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 font-semibold flex items-center gap-2">
                            <span>⏰ {slot.startTime} - {slot.endTime} น.</span>
                            <span className="text-zinc-300">•</span>
                            <span className="text-zinc-500 font-normal">📅 {formatDays(slot.daysOfWeek)}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(slot)}
                            className="p-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 border border-zinc-200 transition cursor-pointer"
                            title="แก้ไขช่วงเวลานี้"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                            title="ลบช่วงเวลานี้"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span>💡</span>
                    <span>ระบบ QR ถาวรทำงานอย่างไรกับหลายช่วงเวลา:</span>
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    เมื่อนักกีฬาสแกนป้าย QR ถาวรริมสนาม ระบบจะตรวจสอบเวลา ณ ตอนนั้นอัตโนมัติ: ถ้าสแกนตอนเช้าจะเข้าเช็คชื่อรอบเช้า, สแกนตอนเย็นจะเข้าเช็คชื่อรอบเย็น โค้ชไม่ต้องสร้างหรือสลับ QR Code เอง
                  </p>
                </div>
              </div>
            )}

            {/* MODE 2 & 3: ADD OR EDIT FORM */}
            {(mode === 'add' || mode === 'edit') && (
              <form onSubmit={handleSaveSlot} className="mt-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-xs font-black text-zinc-900">
                    {mode === 'add' ? '➕ เพิ่มช่วงเวลาซ้อมประจำใหม่' : '✏️ แก้ไขช่วงเวลาซ้อมประจำ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode('list')}
                    className="text-xs text-zinc-500 hover:text-zinc-800 font-bold"
                  >
                    &larr; กลับไปหน้ารายการ
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    ชื่อรอบการซ้อม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น ซ้อมเช้า, ซ้อมเย็น, เวทเทรนนิ่ง"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                  />
                </div>

                {/* Days of Week */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      วันฝึกซ้อมประจำสัปดาห์ <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                        className="text-emerald-700 hover:underline font-bold"
                      >
                        จ-ศ
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 0])}
                        className="text-emerald-700 hover:underline font-bold"
                      >
                        ทุกวัน
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                    {DAYS_CONFIG.map(({ day, short }) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`py-2 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-950 text-white shadow-xs'
                              : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                          }`}
                        >
                          {short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time range */}
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

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive === 1}
                    onChange={(e) => setIsActive(e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-zinc-700 cursor-pointer">
                    เปิดใช้งานช่วงเวลานี้ทันที (สร้างรอบและเปิดรับสแกนอัตโนมัติ)
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setMode('list')}
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
                    <span>{isPending ? 'กำลังบันทึก...' : '✓ บันทึกช่วงเวลา'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
