'use client';

import WavonLogo from './WavonLogo';
import { APP_VERSION, APP_RELEASE_NAME } from '../src/version';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto touch-scroll text-center">
        {/* Logo & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <WavonLogo theme="light" size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg hover:bg-zinc-100 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Hero Section */}
        <div className="my-5">
          <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-500/25 mb-3 font-black">
            W
          </div>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">
            WAVON Athlete Attendance
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            ระบบติดตามสถิติและการเช็คชื่อนักกีฬาสำหรับการฝึกซ้อมมืออาชีพ
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold">
            <span>🚀</span>
            <span>{APP_VERSION}</span>
            <span className="text-zinc-400">•</span>
            <span className="text-zinc-600 font-sans">{APP_RELEASE_NAME}</span>
          </div>
        </div>

        {/* Developer & Creator Credits Card */}
        <div className="bg-zinc-50/80 rounded-2xl border border-zinc-200/80 p-4 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              ผู้พัฒนา & วิศวกรรมระบบ (CREATOR)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700">
              Lead Architect
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
              👨‍💻
            </div>
            <div>
              <p className="text-xs font-black text-zinc-900">Tivakorn Chunkh (Arm)</p>
              <p className="text-[11px] text-zinc-500">WAVON Sports Engineering</p>
            </div>
          </div>

          {/* Social Channels */}
          <div className="pt-2 border-t border-zinc-200/60 grid grid-cols-3 gap-2">
            {/* GitHub */}
            <a
              href="https://github.com/tivakornchunkh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-bold transition shadow-2xs hover-lift"
              title="GitHub Profile"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com/tivakornchunkh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white hover:bg-blue-50 border border-zinc-200 text-blue-600 text-xs font-bold transition shadow-2xs hover-lift"
              title="Facebook Profile"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/tivakornchunkh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white hover:bg-pink-50 border border-zinc-200 text-pink-600 text-xs font-bold transition shadow-2xs hover-lift"
              title="Instagram Profile"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram</span>
            </a>
          </div>
        </div>

        {/* Tech Stack Specs */}
        <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left text-[11px] text-zinc-500 space-y-2">
          <p className="font-bold text-zinc-700">⚡ สถาปัตยกรรมระบบ (Tech Architecture)</p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span className="font-bold text-zinc-800 block">Next.js 16.3</span>
              <span className="text-zinc-400">Turbopack & Actions</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span className="font-bold text-zinc-800 block">Turso Cloud LibSQL</span>
              <span className="text-zinc-400">Encrypted Cloud DB</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span className="font-bold text-zinc-800 block">Drizzle ORM</span>
              <span className="text-zinc-400">Type-safe queries</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-zinc-200/60">
              <span className="font-bold text-zinc-800 block">Argon2id + Secure Token</span>
              <span className="text-zinc-400">Multi-Club Isolation</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-[10px] text-zinc-400 space-y-1">
          <p>© 2026 WAVON Athlete Attendance • All Rights Reserved</p>
          <p>Built with ❤️ for Badminton & Sports Academies</p>
        </div>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-xs font-bold transition cursor-pointer min-h-[42px]"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}