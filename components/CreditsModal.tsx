'use client';

import { useState } from 'react';
import WavonLogo from './WavonLogo';
import { APP_VERSION, APP_RELEASE_NAME } from '../src/version';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0A0C10] text-white rounded-t-[32px] sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y relative">
        {/* Ambient Neon Glow Accents */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

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
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Cyber-Athlete Hero Banner */}
        <div className="my-5 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>CORE ARCHITECT PROFILE</span>
          </div>

          {/* Avatar with Glow Ring */}
          <div className="relative w-22 h-22 mx-auto mb-3">
            <div className="absolute -inset-1 bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-3xl blur-xs opacity-75 animate-pulse" />
            <div className="relative w-full h-full rounded-3xl overflow-hidden bg-zinc-900 border-2 border-emerald-400/80 shadow-2xl flex items-center justify-center">
              {!avatarError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="https://github.com/tivakornchunkh.png"
                  alt="Tivakorn Chunkh (Arm)"
                  onLoad={() => setAvatarLoaded(true)}
                  onError={() => setAvatarError(true)}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    avatarLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ) : null}

              {(!avatarLoaded || avatarError) && (
                <span className="text-3xl">👨‍💻</span>
              )}

              {/* Verified Pro Badge */}
              <span
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-[10px] shadow-md ring-2 ring-[#0A0C10]"
                title="Verified System Architect"
              >
                ✓
              </span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Tivakorn Chunkh</span>
            <span className="text-emerald-400 font-normal">(Arm)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-medium">
            Lead Software Architect & Creator of WAVON Systems
          </p>

          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
            <span>🚀 Release:</span>
            <span className="text-zinc-200">{APP_RELEASE_NAME}</span>
          </div>
        </div>

        {/* Bento Grid Layout Section */}
        <div className="space-y-3 relative z-10">
          {/* Bento Card 1: Official Social Channels (Neon Glowing Buttons) */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <span>🌐</span>
                <span>ช่องทางติดต่อและติดตามทางการ</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">OFFICIAL LINKS</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* GitHub */}
              <a
                href="https://github.com/tivakornchunkh"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-700/60 hover:border-zinc-500 text-white transition flex flex-col items-center justify-center gap-1 text-center shadow-xs hover-lift"
              >
                <svg className="w-5 h-5 fill-current text-zinc-300 group-hover:text-white transition" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="text-[11px] font-bold">GitHub</span>
                <span className="text-[9px] text-zinc-400 font-mono truncate max-w-full">tivakornchunkh</span>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/arm.x.tivakorn"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 hover:border-blue-500 text-blue-200 transition flex flex-col items-center justify-center gap-1 text-center shadow-xs hover-lift"
              >
                <svg className="w-5 h-5 fill-current text-blue-400 group-hover:text-blue-300 transition" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-[11px] font-bold">Facebook</span>
                <span className="text-[9px] text-blue-300 font-mono truncate max-w-full">Arm x tivakorn</span>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/arm_x_tivakorn"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-800/60 hover:border-pink-500 text-pink-200 transition flex flex-col items-center justify-center gap-1 text-center shadow-xs hover-lift"
              >
                <svg className="w-5 h-5 fill-current text-pink-400 group-hover:text-pink-300 transition" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span className="text-[11px] font-bold">Instagram</span>
                <span className="text-[9px] text-pink-300 font-mono truncate max-w-full">@arm_x_tivakorn</span>
              </a>
            </div>
          </div>

          {/* Bento Grid Widgets (2x2 Architecture Specs) */}
          <div className="grid grid-cols-2 gap-2.5 text-left">
            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-emerald-500/40 transition">
              <span className="text-lg block mb-1">⚡</span>
              <p className="text-xs font-black text-white">100x Fast Analytics</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Single Batch Join & In-Memory Aggregation Engine
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/40 transition">
              <span className="text-lg block mb-1">☁️</span>
              <p className="text-xs font-black text-white">Turso LibSQL Cloud</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Zero Data Loss & Permanent Cloud Database
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-amber-500/40 transition">
              <span className="text-lg block mb-1">📱</span>
              <p className="text-xs font-black text-white">Vector QR Engine</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Instant Pitch-side Check-In & Touch Leave System
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-purple-500/40 transition">
              <span className="text-lg block mb-1">🛡️</span>
              <p className="text-xs font-black text-white">Argon2id Multi-Tenant</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                Isolated Club Data & Cryptographic Security
              </p>
            </div>
          </div>
        </div>

        {/* Footer info & Close */}
        <div className="mt-5 pt-3 border-t border-zinc-800 text-center space-y-2 relative z-10">
          <p className="text-[10px] text-zinc-500">
            © 2026 WAVON Sports Management • Engineered by Tivakorn Chunkh (Arm)
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