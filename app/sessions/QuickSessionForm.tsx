'use client';

import React, { useState, useEffect, useId } from 'react';

interface QuickSessionFormProps {
  action: (formData: FormData) => Promise<void>;
  defaultTodayStr?: string;
}

export function QuickSessionForm({ action, defaultTodayStr }: QuickSessionFormProps) {
  const [durationHours, setDurationHours] = useState<number>(2);
  const [startTime, setStartTime] = useState<string>('16:00');
  const [title, setTitle] = useState<string>('');
  const [isCustomTitle, setIsCustomTitle] = useState<boolean>(false);
  const titleInputId = useId();

  // Initialize with current local time on client mount
  useEffect(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const initialStart = `${hh}:${mm}`;
    setStartTime(initialStart);
  }, []);

  // Compute End Time based on Start Time and Duration Hours
  const calculateEndTime = (start: string, hours: number): string => {
    try {
      const [hStr, mStr] = start.split(':');
      const h = parseInt(hStr, 10) || 0;
      const m = parseInt(mStr, 10) || 0;
      const totalMinutes = h * 60 + m + Math.round(hours * 60);
      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;

      // If exceeds 23:59 within same day, cap at 23:59 to avoid string comparison error
      if (endH >= 24) {
        return '23:59';
      }
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {
      return '18:00';
    }
  };

  const endTime = calculateEndTime(startTime, durationHours);

  // Auto-sync default title unless user customizes it
  useEffect(() => {
    if (!isCustomTitle) {
      setTitle(`ซ้อมด่วน ${startTime} น. (${durationHours} ชม.)`);
    }
  }, [startTime, durationHours, isCustomTitle]);

  const presetDurations = [1, 2, 3, 4, 5];

  const handleAdjustDuration = (delta: number) => {
    setDurationHours((prev) => {
      const next = Math.min(8, Math.max(1, prev + delta));
      return next;
    });
  };

  return (
    <div className="bg-[#0F1115] text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-zinc-800 transition">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-zinc-950">
            ริมสนาม ⚡
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white">
            เริ่มเช็คชื่อทันที (Quick Session)
          </h2>
        </div>
        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
          {durationHours} ชั่วโมง
        </span>
      </div>

      <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
        เปิดรอบซ้อมทันที พร้อมปรับเลือกระยะเวลาการซ้อม (+1, +2, +3, +4, +5 ชม.) ได้ตามหน้างานจริง
      </p>

      {/* Duration Adjuster Section */}
      <div className="mb-4 bg-zinc-900/90 rounded-xl p-3.5 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <span>⏱️ เลือกระยะเวลาซ้อม:</span>
          </span>
          {/* Stepper +/- */}
          <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
            <button
              type="button"
              onClick={() => handleAdjustDuration(-1)}
              disabled={durationHours <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs bg-zinc-700/80 hover:bg-zinc-600 active:bg-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition text-white cursor-pointer"
              title="ลด 1 ชั่วโมง"
            >
              -
            </button>
            <span className="px-2 font-mono font-bold text-xs text-emerald-400">
              {durationHours} ชม.
            </span>
            <button
              type="button"
              onClick={() => handleAdjustDuration(1)}
              disabled={durationHours >= 8}
              className="w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs bg-zinc-700/80 hover:bg-zinc-600 active:bg-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition text-white cursor-pointer"
              title="เพิ่ม 1 ชั่วโมง"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Pills: 1, 2, 3, 4, 5 ชม. */}
        <div className="grid grid-cols-5 gap-1.5">
          {presetDurations.map((hours) => {
            const isSelected = durationHours === hours;
            return (
              <button
                key={hours}
                type="button"
                onClick={() => setDurationHours(hours)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 shadow-md ring-2 ring-emerald-400 font-black scale-[1.02]'
                    : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-750 hover:text-white border border-zinc-700/60'
                }`}
              >
                <span>+{hours} ชม.</span>
              </button>
            );
          })}
        </div>

        {/* Live Time Range Preview */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800 text-zinc-400">
          <span className="flex items-center gap-1 text-zinc-300 font-medium">
            🕒 เวลาซ้อม:
          </span>
          <span className="font-mono font-semibold text-emerald-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
            {startTime} - {endTime} น. ({durationHours} ชั่วโมง)
          </span>
        </div>
      </div>

      <form action={action} className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={titleInputId} className="block text-xs font-semibold text-zinc-300">
              หัวข้อรอบซ้อมด่วน
            </label>
            <span className="text-[10px] text-zinc-400">เปลี่ยนชื่อได้ตามต้องการ</span>
          </div>
          <input
            id={titleInputId}
            type="text"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsCustomTitle(true);
            }}
            required
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          />
        </div>

        {/* Hidden Form Inputs */}
        <input
          type="hidden"
          name="date"
          value={defaultTodayStr || new Date().toISOString().split('T')[0]}
        />
        <input type="hidden" name="startTime" value={startTime} />
        <input type="hidden" name="endTime" value={endTime} />

        <button
          type="submit"
          className="w-full mt-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer min-h-[48px] flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span className="text-base">⚡</span>
          <span>เริ่มเช็คชื่อทันที ({durationHours} ชม.)</span>
        </button>
      </form>
    </div>
  );
}
