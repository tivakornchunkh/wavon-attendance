'use client';

import React, { useState, useEffect } from 'react';
import QrCodeSvg from '../../components/QrCodeSvg';

interface PermanentQrModalProps {
  teamId: string;
  teamName: string;
}

export default function PermanentQrModal({ teamId, teamName }: PermanentQrModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrUrl(`${window.location.origin}/checkin/club/${teamId}?pitch=true`);
    }
  }, [teamId]);

  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition cursor-pointer min-h-[40px] flex items-center justify-center gap-2 active:scale-95"
        title="พิมพ์ป้าย QR Code ถาวรสำหรับติดไว้ริมสนาม"
      >
        <span>📌</span>
        <span>QR ประจำสนาม (A4)</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[95vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-8 print:max-h-none">
            {/* Header (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-bold">
                  📌
                </span>
                <div>
                  <h3 className="text-base font-black text-zinc-900">
                    ป้าย QR Code ประจำสนาม
                  </h3>
                  <p className="text-xs text-zinc-500">
                    พิมพ์ติดริมสนามครั้งเดียว สแกนได้ทุกวันตลอดฤดูกาล
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Poster Sheet Area (Rendered & Printable) */}
            <div className="flex flex-col items-center justify-center py-6 text-center print:py-12">
              {/* Club Badge & Title */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>🛡️</span>
                <span>PITCH VERIFIED • จุดเช็คชื่อริมสนาม</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                {teamName || 'สโมสรกีฬา'}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 mt-1 max-w-xs sm:max-w-sm">
                สแกนเช็คชื่อเข้าฝึกซ้อมประจำวันด้วยกล้องมือถือ หรือ LINE
              </p>

              {/* QR Code Container */}
              <div className="p-5 bg-white rounded-3xl shadow-xl border-2 border-zinc-900 inline-block my-5 print:shadow-none print:border-4">
                {qrUrl && (
                  <QrCodeSvg
                    value={qrUrl}
                    size={240}
                  />
                )}
              </div>

              {/* Steps for Athletes */}
              <div className="w-full max-w-sm bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-left space-y-2.5 print:bg-white print:border-zinc-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="text-xs font-bold text-zinc-800">
                    เปิดกล้องมือถือ หรือแอป LINE สแกน QR ด้านบน
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="text-xs font-bold text-zinc-800">
                    ค้นหาชื่อ หรือรหัสนักกีฬาของตนเอง
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    แตะปุ่ม &quot;✓ เช็คชื่อเข้าซ้อมทันที&quot;
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 mt-4 print:text-zinc-500">
                ระบบจะเปิดให้สแกนอัตโนมัติตามตารางฝึกซ้อมประจำของสโมสร
              </p>
            </div>

            {/* Link Copy & Actions (Hidden in Print) */}
            <div className="print:hidden pt-4 border-t border-zinc-100 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={qrUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 truncate min-h-[40px]"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[40px] ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  <span>{copied ? '✓' : '📋'}</span>
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] shadow-xs active:scale-95"
                >
                  <span>🖨️</span>
                  <span>พิมพ์ป้ายโปสเตอร์ (Print A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-bold transition cursor-pointer min-h-[42px]"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

