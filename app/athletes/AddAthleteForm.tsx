'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createAthleteAction } from '../actions/athlete.actions';
import { playTactileFeedback } from '../../components/feedback';

interface AddAthleteFormProps {
  todayStr: string;
}

interface SuccessToastData {
  name: string;
  athleteCode: string;
}

export default function AddAthleteForm({ todayStr }: AddAthleteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<SuccessToastData | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);

    try {
      const res = await createAthleteAction(formData);

      if (res.success && res.athlete) {
        // Haptic & synthetic audio feedback
        playTactileFeedback('SAVE');

        // Show top-right popup toast
        setToast({
          name: res.athlete.name,
          athleteCode: res.athlete.athleteCode,
        });

        // Reset form inputs & focus back to name input
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
                    บันทึกสำเร็จ
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 font-bold">
                    {toast.athleteCode}
                  </span>
                </div>

                <h4 className="text-sm font-black text-white mt-1 truncate">
                  {toast.name}
                </h4>

                <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  เพิ่มเข้าสู่รายชื่อสังกัดสโมสรเรียบร้อยแล้ว พร้อมเช็คชื่อในรอบซ้อม
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
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full animate-[shrink_4.5s_linear_forwards]"
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
      {/* 📝 ATHLETE REGISTRATION FORM */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24">
        <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>เพิ่มนักกีฬาใหม่</span>
        </h2>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </>
  );
}
