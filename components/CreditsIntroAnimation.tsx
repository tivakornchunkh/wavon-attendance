'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import WavonLogo from './WavonLogo';
import {
  playSpotlightAmbience,
  playSpotlightSnap,
  playSpotlightChime,
} from './feedback';

interface CreditsIntroAnimationProps {
  onComplete: () => void;
}

interface TeamMemberIntro {
  name: string;
  nickname: string;
  role: string;
  badge: string;
  quote: string;
  hudCode: string;
  avatar: string;
  colorScheme: {
    accent: string;
    border: string;
    glow: string;
    beamGradient: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    boxBorder: string;
    boxGlow: string;
  };
}

const TEAM_MEMBERS: TeamMemberIntro[] = [
  {
    name: 'Tivakorn Chunkh',
    nickname: 'Arm',
    role: 'Founder & Lead Software Architect',
    badge: '★ PROJECT LEAD & ARCHITECT',
    quote: 'นั่งเขียนแทบชัก เธอไม่รักแทบช็อค 💔💻',
    hudCode: 'SYS_ARCH // 01',
    avatar: 'https://github.com/tivakornchunkh.png',
    colorScheme: {
      accent: '#10B981',
      border: 'border-emerald-400',
      glow: 'shadow-[0_0_60px_rgba(16,185,129,0.6)]',
      beamGradient: 'from-emerald-400/40 via-emerald-500/15 to-transparent',
      badgeBg: 'bg-emerald-950/90',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/50',
      boxBorder: 'border-emerald-500/40',
      boxGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    },
  },
  {
    name: 'Bhumimekin Chaisuk-kosol',
    nickname: 'Aung Pao',
    role: 'Assistant Software Developer',
    badge: '💻 ASSISTANT DEVELOPER',
    quote: 'ถึงผมจะหล่อไม่มาก แต่ผมมีท่ายากเยอะ 🤸‍♂️🔞😏',
    hudCode: 'CORE_DEV // 02',
    avatar: '/team/aungpao.png',
    colorScheme: {
      accent: '#06B6D4',
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_60px_rgba(6,182,212,0.6)]',
      beamGradient: 'from-cyan-400/40 via-cyan-500/15 to-transparent',
      badgeBg: 'bg-cyan-950/90',
      badgeText: 'text-cyan-300',
      badgeBorder: 'border-cyan-500/50',
      boxBorder: 'border-cyan-500/40',
      boxGlow: 'shadow-[0_0_25px_rgba(6,182,212,0.2)]',
    },
  },
  {
    name: 'Pasit Junta',
    nickname: 'Satang',
    role: 'Manual QA Tester',
    badge: '🎯 MANUAL QA TESTER',
    quote: 'แคปบัคส่งไว... แต่แชทส่งไปเธอไม่อ่าน 📸👻',
    hudCode: 'QA_FIELD // 03',
    avatar: '/team/satang.jpg',
    colorScheme: {
      accent: '#F59E0B',
      border: 'border-amber-400',
      glow: 'shadow-[0_0_60px_rgba(245,158,11,0.6)]',
      beamGradient: 'from-amber-400/40 via-amber-500/15 to-transparent',
      badgeBg: 'bg-amber-950/90',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/50',
      boxBorder: 'border-amber-500/40',
      boxGlow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    },
  },
];

export default function CreditsIntroAnimation({ onComplete }: CreditsIntroAnimationProps) {
  // Stage:
  // 0 = Dark ambiance & "THE MINDS BEHIND WAVON" intro (0.4s)
  // 1 = Focus 1: Arm (2.2s)
  // 2 = Focus 2: Aung Pao (2.2s)
  // 3 = Focus 3: Satang (2.2s)
  // 4 = Giant Spotlight & WAVON 3D Logo Convergence (1.4s)
  const [stage, setStage] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [shockwave, setShockwave] = useState<boolean>(false);
  const [typedQuote, setTypedQuote] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const soundRef = useRef<boolean>(true);
  soundRef.current = soundEnabled;

  const timerRefs = useRef<NodeJS.Timeout[]>([]);
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);

  const handleSkip = useCallback(() => {
    timerRefs.current.forEach(clearTimeout);
    intervalRefs.current.forEach(clearInterval);
    onComplete();
  }, [onComplete]);

  // Preload avatars & keyboard shortcuts
  useEffect(() => {
    TEAM_MEMBERS.forEach((member) => {
      const img = new Image();
      img.src = member.avatar;
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSkip]);

  // Helper for starting typewriter effect on a quote
  const startTypewriter = useCallback((fullText: string) => {
    setTypedQuote('');
    intervalRefs.current.forEach(clearInterval);
    let currIdx = 0;
    const interval = setInterval(() => {
      currIdx += 1;
      setTypedQuote(fullText.slice(0, currIdx));
      if (currIdx >= fullText.length) {
        clearInterval(interval);
      }
    }, 32);
    intervalRefs.current.push(interval);
  }, []);

  // Master timeline controller (~8.2 seconds total, ~2.2s per person)
  useEffect(() => {
    const clearAll = () => {
      timerRefs.current.forEach(clearTimeout);
      intervalRefs.current.forEach(clearInterval);
    };
    clearAll();

    // Stage 0: Initial ambience sound & title rise
    if (soundRef.current) {
      playSpotlightAmbience();
    }

    // Schedule Stage 1: Arm (Starts at 400ms -> ends at 2600ms, duration 2200ms)
    const t1 = setTimeout(() => {
      setStage(1);
      setRevealed(false);
      setShockwave(true);
      if (soundRef.current) playSpotlightSnap(0);

      // Shockwave reset
      const t1Sw = setTimeout(() => setShockwave(false), 700);

      // Reveal photo at 150ms and start typewriter at 280ms
      const t1Rev = setTimeout(() => setRevealed(true), 150);
      const t1Type = setTimeout(() => startTypewriter(TEAM_MEMBERS[0].quote), 300);
      timerRefs.current.push(t1Sw, t1Rev, t1Type);
    }, 400);

    // Schedule Stage 2: Aung Pao (Starts at 2600ms -> ends at 4800ms, duration 2200ms)
    const t2 = setTimeout(() => {
      setStage(2);
      setRevealed(false);
      setShockwave(true);
      if (soundRef.current) playSpotlightSnap(1);

      const t2Sw = setTimeout(() => setShockwave(false), 700);
      const t2Rev = setTimeout(() => setRevealed(true), 150);
      const t2Type = setTimeout(() => startTypewriter(TEAM_MEMBERS[1].quote), 300);
      timerRefs.current.push(t2Sw, t2Rev, t2Type);
    }, 2600);

    // Schedule Stage 3: Satang (Starts at 4800ms -> ends at 7000ms, duration 2200ms)
    const t3 = setTimeout(() => {
      setStage(3);
      setRevealed(false);
      setShockwave(true);
      if (soundRef.current) playSpotlightSnap(2);

      const t3Sw = setTimeout(() => setShockwave(false), 700);
      const t3Rev = setTimeout(() => setRevealed(true), 150);
      const t3Type = setTimeout(() => startTypewriter(TEAM_MEMBERS[2].quote), 300);
      timerRefs.current.push(t3Sw, t3Rev, t3Type);
    }, 4800);

    // Schedule Stage 4: Grand Giant Convergence (7000ms -> 8400ms, duration 1400ms)
    const t4 = setTimeout(() => {
      setStage(4);
      setShockwave(true);
      if (soundRef.current) playSpotlightChime();
    }, 7000);

    // Finish & Transition to full modal (8400ms)
    const tEnd = setTimeout(() => {
      onComplete();
    }, 8400);

    timerRefs.current.push(t1, t2, t3, t4, tEnd);

    return () => clearAll();
  }, [onComplete, startTypewriter]);

  // Current active member
  const activeMember = stage >= 1 && stage <= 3 ? TEAM_MEMBERS[stage - 1] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="WAVON Dev Team Intro Animation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none font-sans"
    >
      {/* 1. Deep Obsidian Radial Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0c1424_0%,_#020408_100%)]" />

      {/* Cyber Scanline Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 bg-repeat bg-[length:100%_4px]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)',
        }}
      />

      {/* 2. Floating Glow Neon Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${(i % 3) * 2 + 2.5}px`,
              height: `${(i % 3) * 2 + 2.5}px`,
              top: `${(i * 17 + 9) % 92}%`,
              left: `${(i * 23 + 13) % 96}%`,
              backgroundColor:
                i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#06B6D4' : '#F59E0B',
              opacity: 0.3 + (i % 4) * 0.18,
              filter: 'blur(1px)',
              animationDuration: `${2.2 + (i % 3) * 0.8}s`,
              animationDelay: `${(i * 0.15).toFixed(1)}s`,
            }}
          />
        ))}
      </div>

      {/* 3. Top Action Controls */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-40">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          aria-label={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-mono transition backdrop-blur-md cursor-pointer"
        >
          <span>{soundEnabled ? '🔊' : '🔇'}</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">
            {soundEnabled ? 'Audio On' : 'Muted'}
          </span>
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          aria-label="ข้ามอนิเมชั่น"
          className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-mono font-bold tracking-wide transition backdrop-blur-md cursor-pointer shadow-lg hover:shadow-emerald-500/25"
        >
          <span>ข้าม (Skip)</span>
          <span className="group-hover:translate-x-1 transition-transform">⏭</span>
          <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline ml-1">
            [ESC]
          </span>
        </button>
      </div>

      {/* 4. Top Header Typography */}
      <div className="absolute top-14 sm:top-18 inset-x-0 text-center z-30 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono tracking-widest uppercase shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>The Minds Behind WAVON</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-400 tracking-wider uppercase font-mono mt-1">
          Core Software Architecture & QA Engineering
        </p>
      </div>

      {/* 5. Central Showcase Stage */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full max-w-lg px-6 text-center">
        {/* Stage 0: Initial Ambient Rise */}
        {stage === 0 && (
          <div className="flex flex-col items-center justify-center animate-in fade-in duration-300 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-emerald-500/40 flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
              ⚡
            </div>
            <h2 className="text-lg font-black text-white tracking-widest font-mono">
              INITIALIZING CREW...
            </h2>
          </div>
        )}

        {/* Stages 1, 2, 3: Center Solo Showcase */}
        {activeMember && (
          <div
            key={stage}
            className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-200 relative w-full"
          >
            {/* Spotlight Beam Cone from above */}
            <div
              className={`absolute -top-72 w-88 h-108 bg-gradient-to-b ${activeMember.colorScheme.beamGradient} pointer-events-none blur-2xl rounded-full transform -translate-y-12`}
              style={{
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
              }}
            />

            {/* Shockwave expanding ring when spotlight strikes */}
            {shockwave && (
              <div
                className="absolute w-56 h-56 rounded-full pointer-events-none animate-ping opacity-75 border-2"
                style={{ borderColor: activeMember.colorScheme.accent }}
              />
            )}

            {/* Top Badge Indicator */}
            <div
              className={`mb-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10.5px] font-mono font-bold tracking-wide shadow-md ${activeMember.colorScheme.badgeBg} ${activeMember.colorScheme.badgeText} ${activeMember.colorScheme.badgeBorder}`}
            >
              <span>{activeMember.badge}</span>
            </div>

            {/* Avatar with Double Counter-Rotating HUD Radar Rings */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 my-2 flex items-center justify-center">
              {/* Outer Counter-Rotating HUD Ring with Scales */}
              <svg
                className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none animate-[spin_12s_linear_infinite]"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="74"
                  fill="none"
                  stroke={activeMember.colorScheme.accent}
                  strokeWidth="1.5"
                  strokeDasharray="8 6 18 6"
                  opacity="0.65"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="78"
                  fill="none"
                  stroke={activeMember.colorScheme.accent}
                  strokeWidth="1"
                  strokeDasharray="2 10"
                  opacity="0.4"
                />
              </svg>

              {/* Inner Reverse HUD Ring */}
              <svg
                className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none animate-[spin_7s_linear_infinite_reverse]"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="72"
                  fill="none"
                  stroke={activeMember.colorScheme.accent}
                  strokeWidth="1"
                  strokeDasharray="24 16"
                  opacity="0.5"
                />
              </svg>

              {/* Outer Neon Glow Aura */}
              <div
                className="absolute -inset-1.5 rounded-full blur-md opacity-75 animate-pulse"
                style={{ backgroundColor: activeMember.colorScheme.accent }}
              />

              {/* Main Avatar Frame */}
              <div
                className={`relative w-full h-full rounded-full overflow-hidden bg-zinc-950 border-4 ${activeMember.colorScheme.border} ${activeMember.colorScheme.glow} flex items-center justify-center shadow-2xl transition-all duration-300`}
              >
                {/* Silhouette Mask before spotlight illuminates fully */}
                {!revealed && (
                  <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-xs flex items-center justify-center">
                    <span className="text-4xl opacity-35">👤</span>
                  </div>
                )}

                {/* Team Member Photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeMember.avatar}
                  alt={activeMember.name}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    revealed
                      ? 'opacity-100 scale-100 brightness-105 filter-none'
                      : 'opacity-20 scale-95 brightness-50'
                  }`}
                />
              </div>

              {/* HUD Coordinates Label (Top-Right) */}
              <div
                className="absolute -top-2 -right-3 px-2 py-0.5 rounded-md bg-zinc-950/90 border text-[9px] font-mono font-bold tracking-tight shadow-md"
                style={{
                  borderColor: activeMember.colorScheme.accent,
                  color: activeMember.colorScheme.accent,
                }}
              >
                {activeMember.hudCode}
              </div>

              {/* Step indicator (Bottom-Right) */}
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-zinc-950 border-2 flex items-center justify-center text-xs font-mono font-black shadow-lg"
                style={{
                  borderColor: activeMember.colorScheme.accent,
                  color: activeMember.colorScheme.accent,
                }}
              >
                {stage}/3
              </div>
            </div>

            {/* Member Identity & Role */}
            <div className="mt-3 space-y-0.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeMember.name}
              </h3>
              <p
                className="text-sm font-bold font-mono tracking-wide"
                style={{ color: activeMember.colorScheme.accent }}
              >
                ({activeMember.nickname})
              </p>
              <p className="text-xs text-zinc-400 font-medium">
                {activeMember.role}
              </p>
            </div>

            {/* Frosted Glass Neon Quote Box with Typewriter Effect */}
            <div
              className={`mt-3 w-full max-w-sm px-4 py-2.5 rounded-2xl bg-zinc-950/80 backdrop-blur-md border ${activeMember.colorScheme.boxBorder} ${activeMember.colorScheme.boxGlow} flex items-center justify-center gap-2 min-h-[46px] shadow-lg`}
            >
              <span className="text-sm shrink-0">💬</span>
              <p className="text-xs font-mono font-medium text-zinc-100 leading-snug">
                <span>"{typedQuote}"</span>
                <span
                  className="inline-block w-1.5 h-3.5 ml-1 align-middle animate-pulse"
                  style={{ backgroundColor: activeMember.colorScheme.accent }}
                />
              </p>
            </div>
          </div>
        )}

        {/* Stage 4: Giant Spotlight & WAVON 3D Logo Convergence */}
        {stage === 4 && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-90 duration-300 text-center w-full">
            {/* Giant Merged Central Spotlight Cone */}
            <div className="absolute -top-72 w-[520px] h-[520px] bg-radial from-white/30 via-emerald-400/25 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Center Massive WAVON Logo Emblem */}
            <div className="relative mb-5 p-4 rounded-3xl bg-zinc-950/90 border border-emerald-500/50 shadow-[0_0_60px_rgba(16,185,129,0.4)] flex items-center justify-center">
              <WavonLogo theme="dark" size="xl" />
            </div>

            {/* 3 Team Avatars Flanking the Logo */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
              {/* Left: Aung Pao */}
              <div className="flex flex-col items-center animate-in slide-in-from-left-4 duration-300">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TEAM_MEMBERS[1].avatar}
                    alt={TEAM_MEMBERS[1].nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 mt-1">
                  Aung Pao
                </span>
              </div>

              {/* Center (Lead / Larger): Arm */}
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-300 -translate-y-2">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-3 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)] ring-2 ring-emerald-500/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TEAM_MEMBERS[0].avatar}
                    alt={TEAM_MEMBERS[0].nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-mono font-black text-emerald-300 mt-1">
                  ★ Arm (Lead)
                </span>
              </div>

              {/* Right: Satang */}
              <div className="flex flex-col items-center animate-in slide-in-from-right-4 duration-300">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TEAM_MEMBERS[2].avatar}
                    alt={TEAM_MEMBERS[2].nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300 mt-1">
                  Satang
                </span>
              </div>
            </div>

            {/* Convergence Banner */}
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/70 text-white font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.6)]">
              <span>★ WAVON CORE DEVELOPMENT TEAM ★</span>
            </div>
            <p className="text-xs text-emerald-300 font-medium mt-2 animate-pulse">
              เปิดตัวทีมผู้สร้างสรรค์ระบบอย่างเป็นทางการ...
            </p>
          </div>
        )}
      </div>

      {/* 6. Glossy Mirror Floor & Reflection */}
      <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 pointer-events-none z-20 overflow-hidden flex justify-center">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
        <div
          className="w-3/4 sm:w-1/2 h-full bg-gradient-to-t from-transparent via-emerald-500/5 to-emerald-500/20 blur-xl transition-all duration-500 transform"
          style={{
            transform: 'perspective(200px) rotateX(60deg)',
          }}
        />
      </div>

      {/* 7. Bottom Progress Timeline Track */}
      <div className="absolute bottom-6 inset-x-8 sm:inset-x-24 z-40 flex items-center justify-center gap-2">
        {[1, 2, 3].map((step) => {
          const isPassed = stage >= step;
          const isCurrent = stage === step;
          return (
            <div
              key={step}
              className="h-1 sm:h-1.5 flex-1 max-w-24 rounded-full transition-all duration-300 overflow-hidden bg-zinc-800"
            >
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isCurrent
                    ? 'bg-emerald-400 shadow-[0_0_10px_#10B981]'
                    : isPassed
                    ? 'bg-emerald-600'
                    : 'bg-transparent'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
