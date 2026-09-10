'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createAthleteAction, createBatchAthletesAction } from '../actions/athlete.actions';
import { parseRosterText, ParsedRosterItem } from '../../src/core/validators/athlete.validator';
import { playTactileFeedback } from '../../components/feedback';

interface AddAthleteFormProps {
  todayStr: string;
}

interface ToastData {
  type: 'single' | 'bulk';
  title: string;
  subtitle: string;
  badgeText: string;
  code?: string;
  count?: number;
}

export default function AddAthleteForm({ todayStr }: AddAthleteFormProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Single form refs
  const singleFormRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Bulk form state
  const [bulkText, setBulkText] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState(todayStr);

  // Parse bulk text in real-time
  const parsedAthletes: ParsedRosterItem[] = useMemo(() => {
    return parseRosterText(bulkText);
  }, [bulkText]);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Handle Single Athlete Submission
  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      const res = await createAthleteAction(formData);

      if (res.success && res.athlete) {
        playTactileFeedback('SAVE');

        setToast({
          type: 'single',
          title: res.athlete.name,
          subtitle: 'เพิ่มเข้าสู่รายชื่อสังกัดสโมสรเรียบร้อยแล้ว พร้อมเช็คชื่อในรอบซ้อม',
          badgeText: 'บันทึกสำเร็จ',
          code: res.athlete.athleteCode,
        });

        form.reset();
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการเพิ่มนักกีฬา');
      }
    } catch (err: unknown) {
      console.error('Submit athlete error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bulk Athlete Submission
  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (parsedAthletes.length === 0) {
      setErrorMessage('กรุณาระบุรายชื่อนักกีฬาอย่างน้อย 1 คน');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('rosterText', bulkText);
      formData.set('startDate', bulkStartDate);

      const res = await createBatchAthletesAction(formData);

      if (res.success && res.count) {
        playTactileFeedback('SAVE');

        setToast({
          type: 'bulk',
          title: `นำเข้ารายชื่อสำเร็จ ${res.count} คน!`,
          subtitle: `เพิ่มนักกีฬาทั้งหมด ${res.count} คนเข้าสู่สังกัดสโมสรเรียบร้อยแล้ว`,
          badgeText: `สำเร็จ +${res.count}`,
          count: res.count,
        });

        setBulkText('');
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการนำเข้ารายชื่อ');
      }
    } catch (err: unknown) {
      console.error('Submit bulk athletes error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 🔔 TOP-RIGHT FLOATING POPUP TOAST (ใช้ได้สมบูรณ์แบบทั้งบนมือถือและคอมพิวเตอร์) */}
      {/* ========================================================================= */}
      {toast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-[380px] pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="relative overflow-hidden rounded-2xl bg-[#0B0F15]/95 backdrop-blur-xl border border-emerald-500/40 text-white shadow-2xl shadow-emerald-500/10 p-4 ring-1 ring-emerald-500/30">
            {/* Ambient emerald radial glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start gap-3">
              {/* Checkmark Icon with Pulse */}
              <div className="relative w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <span className="text-lg font-black">✓</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {toast.badgeText}
                  </span>
                  {toast.code && (
                    <span className="text-[11px] font-mono text-zinc-400 font-bold">
                      {toast.code}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-white mt-1 truncate">
                  {toast.title}
                </h4>

                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  {toast.subtitle}
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setToast(null)}
                className="absolute top-0 right-0 w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-xs transition cursor-pointer"
                title="ปิดการแจ้งเตือน"
              >
                ✕
              </button>
            </div>

            {/* Countdown Progress Bar Indicator */}
            <div className="mt-3 w-full bg-zinc-800/80 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                style={{
                  animation: 'shrinkBar 4.5s linear forwards',
                }}
              />
            </div>
          </div>
        </aside>
      )}

      {/* Global inline keyframe for progress bar */}
      <style jsx>{`
        @keyframes shrinkBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 📝 ATHLETE REGISTRATION CARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24">
        {/* Header & Mode Switcher */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>เพิ่มนักกีฬา</span>
          </h2>

          {/* Segmented Mode Switcher */}
          <div className="flex bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setMode('single');
                setErrorMessage(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                mode === 'single'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>👤</span>
              <span>ทีละคน</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('bulk');
                setErrorMessage(null);
              }}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                mode === 'bulk'
                  ? 'bg-white text-zinc-900 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>👥</span>
              <span>นำเข้าเป็นชุด</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: SINGLE ATHLETE REGISTRATION */}
        {/* ------------------------------------------------------------- */}
        {mode === 'single' ? (
          <form ref={singleFormRef} onSubmit={handleSingleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ชื่อ - นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                name="name"
                required
                disabled={isSubmitting}
                placeholder="เช่น สมชาย วิ่งเร็ว"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px] disabled:opacity-60 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                รหัสนักกีฬา (Athlete Code)
              </label>
              <input
                type="text"
                name="athleteCode"
                disabled={isSubmitting}
                placeholder="เว้นว่างไว้เพื่อรัน ATH-001 อัตโนมัติ"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white placeholder:text-zinc-400 min-h-[44px] disabled:opacity-60 transition"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                กำหนดเองได้ เช่น เบอร์เสื้อ &quot;10&quot; หรือรหัสบัตร
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                เบอร์โทรศัพท์ (ถ้ามี)
              </label>
              <input
                type="tel"
                name="phone"
                disabled={isSubmitting}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px] disabled:opacity-60 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                วันที่เริ่มเข้าทีม <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                required
                disabled={isSubmitting}
                defaultValue={todayStr}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px] disabled:opacity-60 transition"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                * ใช้กำหนดสิทธิ์เข้าซ้อม (จะไม่ปรากฏในรอบซ้อมที่จัดก่อนวันที่นี้)
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black disabled:bg-zinc-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-black">+</span>
                  <span>บันทึกเพิ่มนักกีฬา</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* ------------------------------------------------------------- */
          /* TAB 2: BULK IMPORT (วางรายชื่อทีละหลายคน) */
          /* ------------------------------------------------------------- */
          <form onSubmit={handleBulkSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-700">
                  วางรายชื่อนักกีฬา <span className="text-rose-500">*</span>
                </label>
                {parsedAthletes.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 animate-in fade-in">
                    ตรวจพบ {parsedAthletes.length} คน
                  </span>
                )}
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                disabled={isSubmitting}
                rows={6}
                placeholder={`วางรายชื่อตรงนี้ได้เลย (1 บรรทัดต่อ 1 คน หรือคัดลอกจาก Excel / LINE)
ตัวอย่าง:
สมชาย วิ่งเร็ว
10, กิตติศักดิ์ ชัยชนะ
#7 วรวุฒิ สปีดดี
1. ธีรศิลป์ แดงดา`}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white placeholder:text-zinc-400 placeholder:font-sans transition"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block leading-relaxed">
                💡 รองรับทั้งชื่อล้วน, มีเบอร์เสื้อนำหน้า เช่น <code className="text-zinc-800 bg-zinc-100 px-1 rounded">10, สมชาย</code> หรือลำดับข้อ <code className="text-zinc-800 bg-zinc-100 px-1 rounded">1. ชนาธิป</code>
              </span>
            </div>

            {/* Live Preview of parsed names */}
            {parsedAthletes.length > 0 && (
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-700 pb-1 border-b border-zinc-200">
                  <span>ตัวอย่างรายชื่อที่จะถูกเพิ่ม ({parsedAthletes.length} คน)</span>
                  <span className="text-[10px] text-emerald-600 font-mono">READY</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {parsedAthletes.slice(0, 8).map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] bg-white border border-zinc-200 text-zinc-800 font-medium shadow-2xs"
                    >
                      {p.athleteCode ? (
                        <span className="font-bold font-mono text-emerald-600">#{p.athleteCode}</span>
                      ) : (
                        <span className="text-zinc-400 font-mono">ATH-auto</span>
                      )}
                      <span>{p.name}</span>
                    </span>
                  ))}
                  {parsedAthletes.length > 8 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] bg-zinc-200/80 text-zinc-600 font-bold">
                      +{parsedAthletes.length - 8} คนที่เหลือ...
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                วันที่เริ่มเข้าทีมของทั้งชุด <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isSubmitting}
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px] disabled:opacity-60 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || parsedAthletes.length === 0}
              className="w-full mt-3 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black disabled:bg-zinc-300 disabled:text-zinc-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึก {parsedAthletes.length} คน...</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-black">+</span>
                  <span>
                    {parsedAthletes.length > 0
                      ? `บันทึกเพิ่มนักกีฬาทั้งหมด (${parsedAthletes.length} คน)`
                      : 'วางรายชื่อเพื่อเริ่มบันทึก'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}
