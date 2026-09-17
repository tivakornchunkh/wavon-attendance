'use client';

import React, { useState } from 'react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
}

type PeriodType = 'all' | 'today' | 'this_month' | 'last_month' | 'this_year' | 'custom';
type ExportFormat = 'xlsx' | 'csv';

export default function ExportReportModal({
  isOpen,
  onClose,
  teamName = 'สโมสร',
  defaultStartDate,
  defaultEndDate,
}: ExportReportModalProps) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const firstDayOfMonth = `${currentYear}-${currentMonth}-01`;
  const lastDayOfMonth = new Date(currentYear, now.getMonth() + 1, 0).toISOString().split('T')[0];

  const firstDayOfYear = `${currentYear}-01-01`;
  const lastDayOfYear = `${currentYear}-12-31`;

  const [periodType, setPeriodType] = useState<PeriodType>(
    defaultStartDate ? 'custom' : 'all'
  );
  const [customStart, setCustomStart] = useState(defaultStartDate || firstDayOfMonth);
  const [customEnd, setCustomEnd] = useState(defaultEndDate || todayStr);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  // คำนวณช่วงวันตามตัวเลือก
  let targetStart = '';
  let targetEnd = '';
  let periodLabel = 'ข้อมูลทั้งหมดตั้งแต่เปิดสโมสร';

  if (periodType === 'today') {
    targetStart = todayStr;
    targetEnd = todayStr;
    periodLabel = `เฉพาะรอบซ้อมวันนี้ (${todayStr})`;
  } else if (periodType === 'this_month') {
    targetStart = firstDayOfMonth;
    targetEnd = lastDayOfMonth;
    periodLabel = `ประจำเดือนปัจจุบัน (${currentMonth}/${currentYear + 543})`;
  } else if (periodType === 'last_month') {
    const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
    const lmYear = lastMonthDate.getFullYear();
    const lmMonth = String(lastMonthDate.getMonth() + 1).padStart(2, '0');
    targetStart = `${lmYear}-${lmMonth}-01`;
    targetEnd = new Date(lmYear, lastMonthDate.getMonth() + 1, 0).toISOString().split('T')[0];
    periodLabel = `ประจำเดือนที่แล้ว (${lmMonth}/${lmYear + 543})`;
  } else if (periodType === 'this_year') {
    targetStart = firstDayOfYear;
    targetEnd = lastDayOfYear;
    periodLabel = `ประจำปี พ.ศ. ${currentYear + 543} (ค.ศ. ${currentYear})`;
  } else if (periodType === 'custom') {
    targetStart = customStart;
    targetEnd = customEnd;
    periodLabel = `ช่วงวันที่ ${customStart} ถึง ${customEnd}`;
  }

  const exportUrl = `/api/export/attendance?format=${format}${
    targetStart ? `&startDate=${targetStart}&endDate=${targetEnd}` : ''
  }`;

  const handleDownload = () => {
    setIsDownloading(true);
    // สร้าง element ดาวน์โหลดจำลอง
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white text-zinc-900 rounded-t-[28px] sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-zinc-200/80 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto overscroll-contain">
        {/* Mobile handle */}
        <div className="sm:hidden w-12 h-1 bg-zinc-300 rounded-full mx-auto mb-3" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center text-lg font-bold">
              📊
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                ส่งออกรายงานสถิติ (Excel / CSV)
              </h2>
              <p className="text-[11px] text-zinc-500 font-medium">
                สโมสร: <strong className="text-zinc-800">{teamName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 flex items-center justify-center transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <div className="py-4 space-y-4">
          {/* Section 1: เลือกระยะเวลาการสรุป */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              1. เลือกช่วงเวลาที่ต้องการสรุป (Timeframe)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs font-medium">
              {[
                { id: 'all', label: '🌐 ทั้งหมด', desc: 'ตั้งแต่เปิดทีม' },
                { id: 'today', label: '📅 วันนี้', desc: 'เฉพาะรอบวันนี้' },
                { id: 'this_month', label: '📆 เดือนนี้', desc: 'เดือนปัจจุบัน' },
                { id: 'last_month', label: '⏮️ เดือนที่แล้ว', desc: 'สรุปย้อนหลัง' },
                { id: 'this_year', label: '🗓️ ประจำปี', desc: `ปี ${currentYear + 543}` },
                { id: 'custom', label: '⚙️ กำหนดเอง', desc: 'ระบุช่วงวัน' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPeriodType(item.id as PeriodType)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    periodType === item.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <p className="font-bold text-xs">{item.label}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>

            {/* Custom Date Inputs */}
            {periodType === 'custom' && (
              <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1">ตั้งแต่วันที่</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50/80 px-3 py-1.5 rounded-lg border border-emerald-200/60 flex items-center gap-1.5 font-medium">
              <span>✓</span>
              <span>ช่วงข้อมูล: <strong>{periodLabel}</strong></span>
            </div>
          </div>

          {/* Section 2: เลือกรูปแบบไฟล์ */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
              2. รูปแบบไฟล์รายงาน (File Format)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  format === 'xlsx'
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                    : 'bg-white border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <span className="text-xl">📗</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-xs text-zinc-900">Microsoft Excel (.xlsx)</p>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-600 text-white font-bold rounded-full">
                      แนะนำ
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    มี 4 แผ่นงาน (ภาพรวม, รายปี/เดือน, รายวัน, สถิตินักกีฬา) พร้อมตารางสีสวยงาม
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  format === 'csv'
                    ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                    : 'bg-white border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <span className="text-xl">📄</span>
                <div>
                  <p className="font-bold text-xs text-zinc-900">ข้อความตาราง (.csv)</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    ไฟล์ตารางมาตรฐานภาษาไทย (UTF-8 BOM) รองรับโปรแกรมรุ่นเก่า
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: สิ่งที่จะได้รับในไฟล์ */}
          {format === 'xlsx' && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-3 text-[11px] text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-800 flex items-center gap-1">
                <span>📑</span>
                <span>แผ่นงานในไฟล์ Excel ที่ดาวน์โหลด:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-500 pl-1">
                <li><strong>ภาพรวมสโมสร:</strong> บัตร KPI สรุปเปอร์เซ็นต์, เกรดความพร้อม, ยอด มา/ขาด/ลา</li>
                <li><strong>สรุปรายเดือน & รายปี:</strong> สรุปยอดแยกตามแต่ละเดือนและแต่ละปี</li>
                <li><strong>สรุปรายวัน:</strong> บันทึกรายละเอียดการฝึกซ้อมแยกแต่ละรอบ</li>
                <li><strong>สถิตินักกีฬารายบุคคล:</strong> ตารางอันดับวินัยและการเข้าซ้อมของทุกคน</li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer / Action */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 min-h-[40px]"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>กำลังเตรียมไฟล์...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>ดาวน์โหลดรายงาน ({format.toUpperCase()})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

