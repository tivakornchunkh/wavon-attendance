'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardFilterBarProps {
  currentPeriod?: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
}

export default function DashboardFilterBar({
  currentPeriod,
  periodLabel,
  startDate: initialStart,
  endDate: initialEnd,
}: DashboardFilterBarProps) {
  const router = useRouter();
  const [showCustomPicker, setShowCustomPicker] = useState(currentPeriod === 'custom');
  const [customStart, setCustomStart] = useState(initialStart || '');
  const [customEnd, setCustomEnd] = useState(initialEnd || '');

  const periods = [
    { key: 'all', label: 'ทั้งหมด', href: '/' },
    { key: 'today', label: 'วันนี้', href: '/?period=today' },
    { key: 'last_7_days', label: '7 วันล่าสุด', href: '/?period=last_7_days' },
    { key: 'this_week', label: 'สัปดาห์นี้', href: '/?period=this_week' },
    { key: 'this_month', label: 'เดือนนี้', href: '/?period=this_month' },
    { key: 'last_month', label: 'เดือนที่แล้ว', href: '/?period=last_month' },
    { key: 'last_3_months', label: '3 เดือนล่าสุด', href: '/?period=last_3_months' },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    router.push(`/?period=custom&startDate=${customStart}&endDate=${customEnd}`);
  };

  const isCurrent = (key: string) => {
    if (!currentPeriod || currentPeriod === 'all') return key === 'all';
    return currentPeriod === key;
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
            <span>📅</span>
            <span>ช่วงเวลา:</span>
          </span>

          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs overflow-x-auto max-w-full touch-scroll">
            {periods.map((p) => {
              const active = isCurrent(p.key) && !showCustomPicker;
              return (
                <Link
                  key={p.key}
                  href={p.href}
                  onClick={() => setShowCustomPicker(false)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold transition shrink-0 min-h-[32px] sm:min-h-[36px] flex items-center text-[11px] sm:text-xs ${
                    active
                      ? 'bg-white text-zinc-950 shadow-xs border border-zinc-200/60'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}

            {/* Custom Range Button */}
            <button
              type="button"
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className={`px-3 py-2 rounded-lg font-bold transition shrink-0 min-h-[36px] flex items-center gap-1 cursor-pointer ${
                showCustomPicker || currentPeriod === 'custom'
                  ? 'bg-white text-emerald-700 shadow-xs border border-emerald-300'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <span>⚙️</span>
              <span>กำหนดเอง</span>
            </button>
          </div>

          <span className="text-xs text-zinc-500 font-medium px-2 py-1 rounded-lg bg-zinc-50 border border-zinc-100">
            {periodLabel}
          </span>
        </div>

        {/* Export Button */}
        <a
          href={`/api/export/attendance${initialStart ? `?startDate=${initialStart}&endDate=${initialEnd}` : ''}`}
          download
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer min-h-[42px] shrink-0"
          title="ดาวน์โหลดรายงานสรุปเป็นไฟล์ Excel/CSV (ภาษาไทยสมบูรณ์)"
        >
          <span>📥</span>
          <span>ส่งออกรายงาน (Excel / CSV)</span>
        </a>
      </div>

      {/* Collapsible Custom Date Range Form */}
      {showCustomPicker && (
        <form
          onSubmit={handleApplyCustom}
          className="p-3.5 bg-zinc-50/80 border border-zinc-200 rounded-xl flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center gap-2 text-xs">
            <label className="font-bold text-zinc-700">เริ่มต้น:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="font-bold text-zinc-700">สิ้นสุด:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer min-h-[34px]"
          >
            กรองข้อมูล
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCustomPicker(false);
              router.push('/');
            }}
            className="px-3 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-xs rounded-lg transition cursor-pointer min-h-[34px]"
          >
            รีเซ็ต
          </button>
        </form>
      )}
    </div>
  );
}