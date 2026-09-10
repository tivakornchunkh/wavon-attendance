'use client';

import React, { useState, useEffect, useTransition } from 'react';
import QrCodeSvg from '../../components/QrCodeSvg';
import { regeneratePermanentQrAction } from '../actions/session.actions';

interface PermanentQrModalProps {
  teamId: string;
  teamName: string;
  qrToken?: string | null;
  triggerButtonText?: string;
  triggerButtonClass?: string;
}

export default function PermanentQrModal({
  teamId,
  teamName,
  qrToken: initialQrToken,
  triggerButtonText = '📌 ป้าย QR ประจำสนาม (A4)',
  triggerButtonClass,
}: PermanentQrModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(initialQrToken || null);
  const [qrUrl, setQrUrl] = useState('');
  const [isConfirmingRegen, setIsConfirmingRegen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [regenSuccess, setRegenSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tokenToUse = currentToken || teamId;
      setQrUrl(`${window.location.origin}/checkin/club/${tokenToUse}?pitch=true`);
    }
  }, [teamId, currentToken]);

  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      try {
        const res = await regeneratePermanentQrAction(teamId);
        if (res.success) {
          setCurrentToken(res.token);
          setRegenSuccess(true);
          setIsConfirmingRegen(false);
          setTimeout(() => setRegenSuccess(false), 4000);
        }
      } catch (err) {
        console.error('Failed to regenerate QR token:', err);
      }
    });
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerButtonClass ||
          'px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs hover:shadow-emerald-500/10 hover:border-emerald-500/40 border border-transparent transition cursor-pointer min-h-[40px] flex items-center justify-center gap-2 active:scale-95'
        }
        title="พิมพ์ป้าย QR Code ถาวรสำหรับติดไว้ริมสนาม"
      >
        <span>{triggerButtonText}</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[95vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-8 print:max-h-none animate-in zoom-in-95 duration-150">
            {/* Header (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-base font-bold shadow-xs">
                  📌
                </span>
                <div>
                  <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                    <span>ป้าย QR Code ประจำสนามถาวร</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      PERMANENT
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    พิมพ์ติดริมสนามครั้งเดียว สแกนได้ทุกวันตลอดฤดูกาล แก้ไขรอบซ้อมไม่ต้องพิมพ์ใหม่
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Notification when token regenerated */}
            {regenSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 print:hidden animate-in fade-in">
                <span>✓</span>
                <span>สร้างคิวอาร์โค้ดใหม่เรียบร้อยแล้ว! ป้ายเดิมถูกยกเลิกแล้ว กรุณาพิมพ์ป้ายใหม่ติดริมสนาม</span>
              </div>
            )}

            {/* Poster Sheet Area (Rendered & Printable) */}
            <div className="flex flex-col items-center justify-center py-6 text-center print:py-12">
              {/* Club Badge & Title */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse print:hidden" />
                <span>PITCH VERIFIED • จุดเช็คชื่อริมสนาม</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                {teamName || 'สโมสรกีฬา'}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-zinc-500 mt-1 max-w-xs sm:max-w-sm">
                สแกนเช็คชื่อเข้าฝึกซ้อมประจำวันด้วยกล้องมือถือ หรือ LINE
              </p>

              {/* QR Code Container with Neon Glow */}
              <div className="p-5 bg-white rounded-3xl shadow-xl border-2 border-zinc-900 inline-block my-5 print:shadow-none print:border-4 ring-4 ring-emerald-500/10">
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

              <p className="text-[10px] text-zinc-400 mt-4 print:text-zinc-500 font-medium">
                ระบบจะเปิดให้สแกนอัตโนมัติตามตารางฝึกซ้อมประจำของสโมสร (รองรับหลายรอบต่อวัน)
              </p>
            </div>

            {/* Link Copy & Actions (Hidden in Print) */}
            <div className="print:hidden pt-4 border-t border-zinc-100 space-y-3.5">
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] shadow-xs active:scale-95"
                >
                  <span>🖨️</span>
                  <span>พิมพ์ป้ายโปสเตอร์ (Print A4)</span>
                </button>

                {!isConfirmingRegen ? (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingRegen(true)}
                    className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl border border-zinc-200 hover:border-rose-300 hover:bg-rose-50 text-zinc-600 hover:text-rose-700 text-xs font-bold transition cursor-pointer min-h-[42px]"
                    title="สร้างคิวอาร์โค้ดใหม่กรณีป้ายเดิมมีปัญหาหรือถูกนำไปใช้นอกสนาม"
                  >
                    <span>🔄 เจน QR ใหม่</span>
                  </button>
                ) : (
                  <div className="w-full sm:w-auto flex items-center gap-1.5 bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                    <span className="text-[10px] text-rose-800 font-bold px-1">
                      ยืนยันยกเลิกป้ายเดิม?
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isPending}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black hover:bg-rose-700 cursor-pointer"
                    >
                      {isPending ? '...' : 'ใช่, รีเซ็ต'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingRegen(false)}
                      className="px-2 py-1 rounded-lg bg-zinc-200 text-zinc-700 text-[10px] font-bold hover:bg-zinc-300 cursor-pointer"
                    >
                      ไม่
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-bold transition cursor-pointer min-h-[42px]"
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
