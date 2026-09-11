'use client';

import { useState } from 'react';
import WavonLogo from './WavonLogo';
import { APP_VERSION, APP_RELEASE_NAME } from '../src/version';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [armLoaded, setArmLoaded] = useState(false);
  const [armError, setArmError] = useState(false);

  const [paoLoaded, setPaoLoaded] = useState(false);
  const [paoError, setPaoError] = useState(false);

  const [tangLoaded, setTangLoaded] = useState(false);
  const [tangError, setTangError] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0A0C10] text-white rounded-t-[32px] sm:rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto overscroll-contain touch-pan-y relative">
        {/* Ambient Neon Glow Accents */}
        <div className="absolute top-0 right-1/4 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-3" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 relative z-10">
          <div className="flex items-center gap-2">
            <WavonLogo theme="dark" size="sm" />
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {APP_VERSION}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเครดิต"
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Header Title Section */}
        <div className="my-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold mb-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>CORE DEVELOPMENT TEAM</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ทีมผู้สร้างสรรค์ระบบ WAVON
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            สร้างและพัฒนาโดยทีมงานคนรุ่นใหม่ เพื่อระบบเช็คชื่อนักกีฬาที่ดีและใช้งานง่ายที่สุดในสนามจริง
          </p>
        </div>

        {/* 1. Lead Developer (Arm) - Hero Bento Card */}
        <div className="mb-3.5 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 shadow-xl relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/10 border-b border-l border-emerald-500/20 rounded-bl-xl text-[9px] font-mono font-black text-emerald-400 uppercase tracking-wider">
            ★ PROJECT LEAD & ARCHITECT
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left mt-2 sm:mt-0">
            {/* Avatar with Glow */}
            <div className="relative w-20 h-20 shrink-0">
              <div className="absolute -inset-1 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl blur-xs opacity-75 animate-pulse" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-950 border-2 border-emerald-400/90 shadow-2xl flex items-center justify-center">
                {!armError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="https://github.com/tivakornchunkh.png"
                    alt="Tivakorn Chunkh (Arm)"
                    onLoad={() => setArmLoaded(true)}
                    onError={() => setArmError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      armLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ) : null}
                {(!armLoaded || armError) && <span className="text-2xl">👨‍💻</span>}
                <span
                  className="absolute bottom-1 right-1 w-4.5 h-4.5 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-[9px] shadow-md ring-2 ring-[#0A0C10]"
                  title="Lead Architect"
                >
                  ✓
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Tivakorn Chunkh
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  (Arm)
                </span>
              </div>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                Founder & Lead Software Architect
              </p>
              <p className="text-[11px] text-zinc-300 mt-1.5 leading-relaxed">
                ดูแลภาพรวมระบบทั้งหมด เขียนโค้ดหลังบ้าน วางฐานข้อมูล และคุมความปลอดภัยให้พร้อมใช้งานจริง
              </p>

              {/* Catchphrase / Quote */}
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium shadow-inner">
                <span>💬</span>
                <span className="italic font-mono">"นั่งเขียนแทบชัก เธอไม่รักแทบช็อค 💔💻"</span>
              </div>

              {/* Social Channels */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                <a
                  href="https://github.com/tivakornchunkh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white text-[10px] font-bold transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </a>

                <a
                  href="https://www.facebook.com/arm.x.tivakorn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-800/80 text-blue-200 hover:text-white text-[10px] font-bold transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-blue-400" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </a>

                <a
                  href="https://www.instagram.com/arm_x_tivakorn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900 border border-pink-800/80 text-pink-200 hover:text-white text-[10px] font-bold transition flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-pink-400" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 2 & 3. Assistant Developer & QA Tester - 2 Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 relative z-10">
          {/* Card 2: Aung Pao */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/40 transition flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-mono font-bold">
                  ASSISTANT DEV
                </span>
                <span className="text-base">💻</span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-cyan-400/80 shadow-md">
                  {!paoError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/team/aungpao.png"
                      alt="Bhumimekin Chaisuk-kosol (Aung Pao)"
                      onLoad={() => setPaoLoaded(true)}
                      onError={() => setPaoError(true)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        paoLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ) : null}
                  {(!paoLoaded || paoError) && (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      👨‍💻
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white truncate">
                    Bhumimekin Chaisuk-kosol
                  </h4>
                  <p className="text-cyan-400 font-bold text-xs">
                    (Aung Pao)
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    Assistant Software Developer
                  </p>
                </div>
              </div>

              <p className="text-[10.5px] text-zinc-300 leading-relaxed mb-2">
                ร่วมพัฒนาฟีเจอร์สำคัญ ดูแลส่วนติดต่อผู้ใช้ (UI) และช่วยดูแลความเรียบร้อยของโค้ดในโปรเจกต์
              </p>

              <div className="mb-3 px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-medium flex items-center gap-1.5 shadow-inner">
                <span>💬</span>
                <span className="italic font-mono">"ถึงผมจะหล่อไม่มาก แต่ผมมีท่ายากเยอะ 🤸‍♂️🔞😏"</span>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-zinc-800/80">
              <a
                href="https://www.facebook.com/aung.pxo.2025?locale=th_TH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 text-[10px] font-bold transition flex items-center justify-center gap-1"
                title="Facebook: Aung pao"
              >
                <span>FB: Aung pao</span>
              </a>

              <a
                href="https://www.instagram.com/Auxg_pao"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/60 text-pink-200 text-[10px] font-bold transition flex items-center justify-center gap-1"
                title="Instagram: @Auxg_pao"
              >
                <span>IG: @Auxg_pao</span>
              </a>
            </div>
          </div>

          {/* Card 3: Satang */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 transition flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold">
                  MANUAL QA TESTER
                </span>
                <span className="text-base">🎯</span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-amber-400/80 shadow-md">
                  {!tangError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src="/team/satang.jpg"
                      alt="Pasit Junta (Satang)"
                      onLoad={() => setTangLoaded(true)}
                      onError={() => setTangError(true)}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        tangLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  ) : null}
                  {(!tangLoaded || tangError) && (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🔍
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white truncate">
                    Pasit Junta
                  </h4>
                  <p className="text-amber-400 font-bold text-xs">
                    (Satang)
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    QA Tester / Manual Tester
                  </p>
                </div>
              </div>

              <p className="text-[10.5px] text-zinc-300 leading-relaxed mb-2">
                ตรวจสอบและทดสอบระบบด้วยมือ (Manual Testing) ค้นหาบัคหน้างานจริง และรายงานเพื่อแก้ไขจุดบกพร่อง
              </p>

              <div className="mb-3 px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-amber-500/30 text-amber-300 text-[10px] font-medium flex items-center gap-1.5 shadow-inner">
                <span>💬</span>
                <span className="italic font-mono">"แคปบัคส่งไว... แต่แชทส่งไปเธอไม่อ่าน 📸👻"</span>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-zinc-800/80">
              <a
                href="https://www.facebook.com/ph.sis.th.can.ta?locale=th_TH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-200 text-[10px] font-bold transition flex items-center justify-center gap-1"
                title="Facebook: Pasit Junta"
              >
                <span>FB: Pasit Junta</span>
              </a>

              <a
                href="https://www.instagram.com/pasit_junta"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 rounded-lg bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/60 text-pink-200 text-[10px] font-bold transition flex items-center justify-center gap-1"
                title="Instagram: @Pasit junta"
              >
                <span>IG: @Pasit junta</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bento Grid Widgets (2x2 Architecture Specs) */}
        <div className="grid grid-cols-2 gap-2 text-left relative z-10 mb-4">
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-sm block mb-0.5">⚡</span>
            <p className="text-[11px] font-black text-white">100x Fast Analytics</p>
            <p className="text-[9px] text-zinc-400 leading-tight">
              Single Batch Join & In-Memory Aggregation
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-sm block mb-0.5">☁️</span>
            <p className="text-[11px] font-black text-white">Turso LibSQL Cloud</p>
            <p className="text-[9px] text-zinc-400 leading-tight">
              Permanent Cloud Storage & Zero Loss
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-sm block mb-0.5">📱</span>
            <p className="text-[11px] font-black text-white">Vector QR Engine</p>
            <p className="text-[9px] text-zinc-400 leading-tight">
              Instant Pitch-side Check-In & Touch Leave
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <span className="text-sm block mb-0.5">🛡️</span>
            <p className="text-[11px] font-black text-white">Bcrypt & Signed HMAC</p>
            <p className="text-[9px] text-zinc-400 leading-tight">
              Tamper-proof Sessions & Password Hashes
            </p>
          </div>
        </div>

        {/* Footer info & Close */}
        <div className="pt-3 border-t border-zinc-800 text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
            <span>🚀 Active Release:</span>
            <span className="text-zinc-200">{APP_RELEASE_NAME}</span>
          </div>
          <p className="text-[9.5px] text-zinc-500">
            © 2026 WAVON Sports Management • Developed with pride by Tivakorn Chunkh, Bhumimekin Chaisuk-kosol & Pasit Junta
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white font-bold text-xs transition cursor-pointer border border-zinc-800 shadow-sm"
          >
            ปิดหน้าต่างเครดิต
          </button>
        </div>
      </div>
    </div>
  );
}