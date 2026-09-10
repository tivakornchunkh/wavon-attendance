'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WavonLogo from './WavonLogo';
import UserGuideModal from './UserGuideModal';
import CreditsModal from './CreditsModal';
import FeedbackModal from './FeedbackModal';
import { APP_VERSION } from '../src/version';

interface AppShellProps {
  children: React.ReactNode;
  session: {
    user: {
      id: string;
      name: string;
      username: string;
      role: string;
      teamId: string | null;
    };
    team: {
      id: string;
      name: string;
    } | null;
    isAdmin: boolean;
  };
  logoutAction: () => Promise<void>;
}

export default function AppShell({ children, session, logoutAction }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Clean Standalone Layout for Login, Register, and Public Check-In Pages (No sidebars, headers, or navbars)
  if (pathname === '/login' || pathname === '/register' || pathname.startsWith('/checkin')) {
    return (
      <main className="min-h-screen bg-[#F8FAFC]">
        {children}
      </main>
    );
  }

  const navItems = [
    {
      label: 'แดชบอร์ด',
      sublabel: 'Dashboard',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      active: pathname === '/',
    },
    {
      label: 'นักกีฬา',
      sublabel: 'Athletes',
      href: '/athletes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      active: pathname.startsWith('/athletes'),
    },
    {
      label: 'รอบซ้อม & เช็คชื่อ',
      sublabel: 'Sessions & Check-in',
      href: '/sessions',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      active: pathname.startsWith('/sessions'),
    },
    ...(session.isAdmin
      ? [
          {
            label: 'แผงผู้ดูแล',
            sublabel: 'Admin Console',
            href: '/admin',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            active: pathname.startsWith('/admin'),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR (Visible on lg and up >= 1024px) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 bg-[#0F1115] text-white border-r border-zinc-800/80 fixed inset-y-0 z-40">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-zinc-800/60">
          <Link href="/" className="transition hover:opacity-90">
            <WavonLogo theme="dark" size="md" />
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs">
            {APP_VERSION}
          </span>
        </div>

        {/* Current Active Team / Club Badge */}
        {session.team && (
          <div className="px-5 py-3.5 mx-3 mt-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                🏢
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">สโมสรปัจจุบัน</p>
                <p className="text-xs font-semibold text-zinc-100 truncate">{session.team.name}</p>
              </div>
            </div>
            {session.isAdmin && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                ADMIN
              </span>
            )}
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            เมนูหลัก / Menu
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition group ${
                item.active
                  ? 'bg-white text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <span className={`${item.active ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <div>
                <p className="leading-tight">{item.label}</p>
                <p className={`text-[10px] font-normal leading-tight mt-0.5 ${
                  item.active ? 'text-zinc-500' : 'text-zinc-500 group-hover:text-zinc-400'
                }`}>
                  {item.sublabel}
                </p>
              </div>
            </Link>
          ))}

          <div className="pt-2 mt-2 border-t border-zinc-800/60">
            <UserGuideModal />
          </div>
        </nav>

        {/* User Profile & Actions Footer */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2 bg-[#0C0E12]">
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-bold text-zinc-200 shrink-0">
                {session.user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{session.user.name}</p>
                <p className="text-[10px] text-zinc-400">
                  {session.isAdmin ? '👑 ผู้ดูแลระบบ' : '👤 โค้ชผู้ฝึกสอน'}
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
              title="สลับผู้ใช้ หรือสลับสโมสร"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="flex-1 py-1.5 text-center text-[11px] font-medium text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 transition"
            >
              สลับบทบาท
            </Link>
            <form action={logoutAction} className="flex-1">
              <button
                type="submit"
                className="w-full py-1.5 text-center text-[11px] font-medium text-rose-400/80 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] px-1">
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className="text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
            >
              <span>🐞</span>
              <span>แจ้งปัญหา</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCredits(true)}
              className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
            >
              <span>⭐</span>
              <span>Credits</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE & TABLET TOP HEADER (< lg screens) */}
      {/* ========================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#0F1115] text-white border-b border-zinc-800 shadow-md">
        <div className="px-4 h-16 flex items-center justify-between">
          {/* Hamburger Menu Toggle (Touch target min 44x44px) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:bg-zinc-800 transition cursor-pointer shrink-0"
            aria-label="เปิดเมนูนำทาง"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo Center */}
          <Link href="/" className="transition hover:opacity-90 flex items-center gap-1.5">
            <WavonLogo theme="dark" size="sm" />
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {APP_VERSION}
            </span>
          </Link>

          {/* Right Action: User Icon / Team */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5 active:bg-zinc-800"
            >
              <span>👤</span>
              <span className="max-w-[70px] truncate">{session.user.name.split(' ')[0]}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Active Team subheader bar */}
        {session.team && (
          <div className="px-4 py-1.5 bg-zinc-900/90 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1.5 truncate">
              <span>🏢 สโมสร:</span>
              <strong className="text-zinc-200 truncate">{session.team.name}</strong>
            </span>
            {session.isAdmin ? (
              <span className="text-[10px] text-amber-300 font-semibold shrink-0">👑 ผู้ดูแล</span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-semibold shrink-0">● พร้อมใช้งาน</span>
            )}
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 3. MOBILE & TABLET SLIDE-OVER DRAWER (< lg screens) */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0F1115] text-white shadow-2xl border-r border-zinc-800">
            {/* Drawer Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <WavonLogo theme="dark" size="sm" />
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {APP_VERSION}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                aria-label="ปิดเมนู"
              >
                ✕
              </button>
            </div>

            {/* Current Team in Drawer */}
            {session.team && (
              <div className="p-4 bg-zinc-900/60 border-b border-zinc-800">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">สังกัดสโมสร</p>
                <p className="text-sm font-bold text-zinc-100 mt-0.5">{session.team.name}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span>ผู้ใช้: <strong>{session.user.name}</strong></span>
                  {session.isAdmin && <span className="text-amber-400 font-bold">(ผู้ดูแล)</span>}
                </div>
              </div>
            )}

            {/* Drawer Navigation Links */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                เมนูนำทางหลัก
              </p>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition min-h-[48px] ${
                    item.active
                      ? 'bg-white text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <span className={item.active ? 'text-zinc-950' : 'text-zinc-400'}>
                    {item.icon}
                  </span>
                  <div>
                    <p className="leading-tight">{item.label}</p>
                    <p className={`text-[11px] mt-0.5 ${item.active ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {item.sublabel}
                    </p>
                  </div>
                </Link>
              ))}

              <div className="pt-2 mt-2 border-t border-zinc-800/60">
                <UserGuideModal />
              </div>
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-zinc-800 bg-[#0C0E12] space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition min-h-[44px]"
              >
                <span>🔄</span>
                <span>สลับผู้ใช้ / สลับสโมสร</span>
              </Link>
              <form action={logoutAction} className="w-full">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-rose-400 text-xs font-medium hover:bg-rose-500/10 transition cursor-pointer min-h-[44px]"
                >
                  ออกจากระบบ (Logout)
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MAIN CONTENT AREA (Offset on Desktop by lg:pl-64) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Desktop Bar (Breadcrumb & Live Status) */}
        <div className="hidden lg:flex h-16 bg-white border-b border-zinc-200/80 px-8 items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-zinc-500">ระบบเช็คชื่อนักกีฬา</span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-bold text-zinc-900">
              {pathname === '/'
                ? 'แดชบอร์ดสถิติ'
                : pathname.startsWith('/athletes')
                ? 'ระบบจัดการนักกีฬา'
                : pathname.startsWith('/sessions')
                ? 'รอบการฝึกซ้อมและเช็คชื่อ'
                : pathname.startsWith('/admin')
                ? 'แผงควบคุมสโมสร'
                : 'WAVON'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>เชื่อมต่อฐานข้อมูลพร้อมใช้งาน</span>
            </div>

            <div className="h-4 w-px bg-zinc-200" />

            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition"
              title="สลับสโมสรหรือเข้าสู่ระบบผู้ดูแล"
            >
              สลับผู้ใช้
            </Link>
          </div>
        </div>

        {/* Page Children Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-12">
          {children}
        </main>

        {/* Bottom Brand Stamp & Professional Credits / Social Links */}
        <footer className="py-6 px-4 border-t border-zinc-200/80 text-xs text-zinc-500 bg-white/70">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <span className="font-bold text-zinc-800 tracking-wider">Built by WAVON</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold">
                {APP_VERSION}
              </span>
              <span className="text-zinc-300 hidden sm:inline">•</span>
              <span className="text-zinc-500 text-[11px]">ระบบติดตามสถิติและการเช็คชื่อนักกีฬา</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Social Links */}
              <a
                href="https://github.com/tivakornchunkh/wavon-attendance"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
                title="GitHub Project"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>

              <a
                href="https://www.facebook.com/arm.x.tivakorn"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 transition"
                title="Facebook: Arm x tivakorn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              <a
                href="https://www.instagram.com/arm_x_tivakorn"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-pink-600 hover:bg-zinc-100 transition"
                title="Instagram: arm_x_tivakorn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              <div className="h-3 w-px bg-zinc-300 mx-1" />

              <button
                type="button"
                onClick={() => setShowFeedback(true)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
              >
                <span>🐞</span>
                <span>แจ้งปัญหา</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCredits(true)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>⭐</span>
                <span>Credits</span>
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* 5. TABLET / MOBILE BOTTOM NAVIGATION BAR (< lg screens) */}
      {/* ========================================================= */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium min-w-[60px] min-h-[48px] ${
            pathname === '/' ? 'text-zinc-950 font-bold' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span className="text-lg">📊</span>
          <span>แดชบอร์ด</span>
        </Link>
        <Link
          href="/athletes"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium min-w-[60px] min-h-[48px] ${
            pathname.startsWith('/athletes') ? 'text-zinc-950 font-bold' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span className="text-lg">🏃</span>
          <span>นักกีฬา</span>
        </Link>
        <Link
          href="/sessions"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium min-w-[60px] min-h-[48px] ${
            pathname.startsWith('/sessions') ? 'text-zinc-950 font-bold' : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <span className="text-lg">⏱️</span>
          <span>รอบซ้อม</span>
        </Link>
        {session.isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium min-w-[60px] min-h-[48px] ${
              pathname.startsWith('/admin') ? 'text-amber-700 font-bold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span className="text-lg">👑</span>
            <span>ผู้ดูแล</span>
          </Link>
        )}
      </nav>

      {/* Modals */}
      <CreditsModal isOpen={showCredits} onClose={() => setShowCredits(false)} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}

