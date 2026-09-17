'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAthleteAction } from '../../actions/athlete.actions';

interface EditAthleteModalProps {
  athlete: {
    id: string;
    name: string;
    athleteCode: string;
    phone?: string | null;
    startDate: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  triggerButtonText?: string;
  triggerButtonClass?: string;
}

export default function EditAthleteModal({
  athlete,
  triggerButtonText = '✏️ แก้ไขข้อมูล',
  triggerButtonClass,
}: EditAthleteModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(athlete.name);
  const [athleteCode, setAthleteCode] = useState(athlete.athleteCode);
  const [phone, setPhone] = useState(athlete.phone || '');
  const [startDate, setStartDate] = useState(athlete.startDate);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(athlete.status);

  const handleOpen = () => {
    setName(athlete.name);
    setAthleteCode(athlete.athleteCode);
    setPhone(athlete.phone || '');
    setStartDate(athlete.startDate);
    setStatus(athlete.status);
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError('กรุณาระบุชื่อนักกีฬา');
      return;
    }
    if (!athleteCode.trim()) {
      setError('กรุณาระบุรหัสนักกีฬา');
      return;
    }

    const formData = new FormData();
    formData.append('id', athlete.id);
    formData.append('name', name.trim());
    formData.append('athleteCode', athleteCode.trim());
    formData.append('phone', phone.trim());
    formData.append('startDate', startDate);
    formData.append('status', status);

    startTransition(async () => {
      const res = await updateAthleteAction(formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
          router.refresh();
        }, 800);
      } else {
        setError(res.error || 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          triggerButtonClass ||
          'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 font-bold text-xs rounded-xl border border-zinc-200 hover:border-zinc-300 shadow-xs transition min-h-[42px] cursor-pointer active:scale-95'
        }
        title="แก้ไขข้อมูลนักกีฬา"
      >
        <span>{triggerButtonText}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-athlete-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-700">
                  แก้ไขข้อมูล
                </span>
                <h3 id="edit-athlete-title" className="text-xl font-black text-zinc-900 mt-1">
                  แก้ไขข้อมูลนักกีฬา
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  ปรับปรุงชื่อ รหัสประจำตัว เบอร์โทร หรือสถานะ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center text-sm font-bold transition cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                ✕
              </button>
            </div>

            {/* Error / Success feedback */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <span>✓</span>
                <span>บันทึกการแก้ไขเรียบร้อยแล้ว</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น กิตติศักดิ์ ชัยชนะ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    รหัสนักกีฬา / เบอร์ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={athleteCode}
                    onChange={(e) => setAthleteCode(e.target.value)}
                    placeholder="เช่น A01 หรือ 10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    สถานะปัจจุบัน
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                  >
                    <option value="ACTIVE">● ปกติ (Active)</option>
                    <option value="INACTIVE">○ พักสังกัด (Inactive)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  เบอร์โทรศัพท์ผู้ปกครอง / ติดต่อ
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  วันที่เริ่มเข้าสังกัด
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer min-h-[40px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0F1115] hover:bg-zinc-800 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]"
                >
                  {isPending ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <span>บันทึกการแก้ไข</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

