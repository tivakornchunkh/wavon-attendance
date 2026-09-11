'use client';

import React, { useState, useEffect, useRef } from 'react';
import QrCodeSvg from '../../../components/QrCodeSvg';

interface QrCheckInModalProps {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  livePresent: number;
  liveLeave: number;
  totalAthletes: number;
}

export default function QrCheckInModal({
  sessionId,
  sessionTitle,
  sessionDate,
  sessionTime,
  livePresent,
  liveLeave,
  totalAthletes,
}: QrCheckInModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedType, setCopiedType] = useState<'pitch' | 'leave' | null>(null);
  const [pitchUrl, setPitchUrl] = useState('');
  const [leaveUrl, setLeaveUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPitchUrl(`${window.location.origin}/checkin/${sessionId}?pitch=true`);
      setLeaveUrl(`${window.location.origin}/checkin/${sessionId}`);
    }
  }, [sessionId]);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = (url: string, type: 'pitch' | 'leave') => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopiedType(type);
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedType(null);
      copyTimeoutRef.current = null;
    }, 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 active:scale-95"
        title="เปิด QR Code ให้นักกีฬาสแกนเช็คชื่อด้วยตัวเอง"
      >
        <span>📱</span>
        <span>QR Code เช็คชื่อ</span>
      </button>

      {isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static ${
          isFullscreen ? 'p-0' : ''
        }`}>
          <div
            className={`bg-white rounded-3xl w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col transition-all print:max-w-none print:shadow-none print:border-none print:p-8 print:max-h-none ${
              isFullscreen
                ? 'h-full max-w-none rounded-none bg-[#0F1115] text-white'
                : 'max-w-lg p-6 max-h-[95vh] overflow-y-auto'
            }`}
          >
            {/* Header (Hidden in print) */}
            <div className={`flex items-center justify-between pb-4 border-b print:hidden ${
              isFullscreen ? 'p-6 border-zinc-800' : 'border-zinc-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                  📱
                </span>
                <div>
                  <h3 className={`text-base font-black ${isFullscreen ? 'text-white' : 'text-zinc-900'}`}>
                    QR Code เช็คชื่อนักกีฬา
                  </h3>
                  <p className={`text-xs ${isFullscreen ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {sessionTitle} • {sessionDate} ({sessionTime})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isFullscreen
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                  title={isFullscreen ? 'ย่อหน้าจอปกติ' : 'โหมดเต็มจอ iPad'}
                >
                  {isFullscreen ? '✕ ย่อจอ' : '🖥️ เต็มจอ'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsFullscreen(false);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition cursor-pointer ${
                    isFullscreen
                      ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex flex-col items-center justify-center py-6 text-center ${
              isFullscreen ? 'flex-1 p-8' : ''
            }`}>
              {/* Pitch Verified Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-[11px] font-black uppercase tracking-wider mb-3">
                <span>🛡️</span>
                <span>PITCH VERIFIED • สแกนเข้าซ้อมทันที</span>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-3xl shadow-lg border-2 border-zinc-900 inline-block">
                {pitchUrl && (
                  <QrCodeSvg
                    value={pitchUrl}
                    size={isFullscreen ? 320 : 230}
                  />
                )}
              </div>

              <p className={`mt-4 text-xs sm:text-sm font-bold ${
                isFullscreen ? 'text-zinc-200' : 'text-zinc-800'
              }`}>
                นักกีฬาสแกนคิวอาร์โค้ดนี้ด้วยกล้องมือถือ หรือแอป LINE
              </p>
              <p className={`text-[11px] mt-0.5 ${
                isFullscreen ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                ยืนยันการอยู่สนามจริงอัตโนมัติ • ไม่ต้องลงชื่อเข้าใช้
              </p>

              {/* Headcount Live Counter Strip */}
              <div className="mt-5 w-full max-w-sm grid grid-cols-3 gap-2 text-center print:hidden">
                <div className={`p-2.5 rounded-2xl border ${
                  isFullscreen
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                }`}>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">ทั้งหมด</p>
                  <p className="text-lg font-black">{totalAthletes} คน</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <p className="text-[10px] uppercase font-bold">มาแล้ว</p>
                  <p className="text-lg font-black text-emerald-500">{livePresent} คน</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <p className="text-[10px] uppercase font-bold">แจ้งลา</p>
                  <p className="text-lg font-black text-amber-500">{liveLeave} คน</p>
                </div>
              </div>

              {/* URL Copy Actions (Hidden in Print) */}
              <div className="mt-5 w-full max-w-md space-y-2 print:hidden">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pitchUrl}
                    className={`flex-1 px-3 py-2 text-xs font-mono rounded-xl border truncate ${
                      isFullscreen
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(pitchUrl, 'pitch')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px] ${
                      copiedType === 'pitch'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    }`}
                    title="คัดลอกลิงก์ที่มีสิทธิ์เข้าซ้อมทันที"
                  >
                    <span>{copiedType === 'pitch' ? '✓' : '⚡'}</span>
                    <span>{copiedType === 'pitch' ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์เข้าซ้อม'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-left px-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(leaveUrl, 'leave')}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 underline transition cursor-pointer"
                    title="คัดลอกลิงก์สำหรับส่งให้นักกีฬาที่บ้านเพื่อแจ้งลาซ้อมเท่านั้น"
                  >
                    {copiedType === 'leave' ? '✓ คัดลอกลิงก์แจ้งลาเรียบร้อย!' : '📝 คัดลอกลิงก์ส่งกลุ่ม LINE (สำหรับแจ้งลาจากที่บ้าน)'}
                  </button>
                </div>
              </div>

              {/* Print Button (Only in window mode, hidden in print) */}
              {!isFullscreen && (
                <div className="mt-4 pt-4 border-t border-zinc-100 w-full flex items-center justify-between gap-3 print:hidden">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <span>🖨️</span>
                    <span>พิมพ์ใบ QR ติดสนาม (Print A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="py-2.5 px-5 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-bold transition cursor-pointer min-h-[40px]"
                  >
                    ปิด
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}