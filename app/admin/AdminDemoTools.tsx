'use client';

import React, { useState, useTransition } from 'react';
import { seedRealisticDataAction, clearDemoDataAction } from '../actions/seed.actions';

export default function AdminDemoTools() {
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSeed = () => {
    setStatusMessage(null);
    startTransition(async () => {
      try {
        await seedRealisticDataAction();
        setStatusMessage({
          type: 'success',
          text: 'สร้างข้อมูลจำลอง (32 นักกีฬา, 8 รอบซ้อม, สถิติเช็คชื่อสมจริง) สำเร็จเรียบร้อยแล้ว',
        });
      } catch (err: unknown) {
        setStatusMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง',
        });
      }
    });
  };

  const handleClear = () => {
    setShowClearConfirm(false);
    setStatusMessage(null);
    startTransition(async () => {
      try {
        await clearDemoDataAction();
        setStatusMessage({
          type: 'success',
          text: 'ล้างข้อมูลจำลองของสโมสรนี้เรียบร้อยแล้ว (ข้อมูลจริงไม่ถูกแตะต้อง)',
        });
      } catch (err: unknown) {
        setStatusMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการล้างข้อมูลตัวอย่าง',
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 font-mono">
              DEVELOPER TOOLS
            </span>
            <span className="text-xs font-semibold text-emerald-600">● สโมสรปัจจุบัน</span>
          </div>
          <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
            <span>ชุดข้อมูลจำลองสำหรับทดสอบ (Demo Seeder)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl">
            สร้างหรือล้างข้อมูลทดสอบ (นักกีฬาจำลอง 32 คน, 8 รอบการฝึกซ้อม, และสถิติการเช็คชื่อสมจริง) โดยระบบจะแยกเฉพาะข้อมูล Demo และไม่กระทบข้อมูลจริงของนักกีฬาและรอบซ้อมจริง
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSeed}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-xs font-bold transition disabled:opacity-50 min-h-[42px] flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>กำลังประมวลผล...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>โหลด Demo Data</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-zinc-700 border border-zinc-200 text-xs font-bold transition disabled:opacity-50 min-h-[42px] flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>ล้างข้อมูล Demo</span>
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Confirmation Modal for Clearing Demo */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-xl border border-zinc-200 text-zinc-900 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black">ยืนยันการล้างข้อมูลจำลอง?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                ระบบจะลบเฉพาะนักกีฬา รอบซ้อม และประวัติการเช็คชื่อที่มีรหัสระบุว่าเป็น Demo เท่านั้น ข้อมูลจริงจะไม่ได้รับผลกระทบ
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer min-h-[42px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleClear}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition cursor-pointer min-h-[42px] shadow-xs"
              >
                {isPending ? 'กำลังล้าง...' : 'ยืนยันล้าง Demo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
