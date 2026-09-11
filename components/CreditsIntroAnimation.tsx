'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  avatar: string;
  colorScheme: {
    accent: string;
    border: string;
    glow: string;
    beamGradient: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
}

const TEAM_MEMBERS: TeamMemberIntro[] = [
  {
    name: 'Tivakorn Chunkh',
    nickname: 'Arm',
    role: 'Founder & Lead Software Architect',
    badge: '★ PROJECT LEAD & ARCHITECT',
    avatar: 'https://github.com/tivakornchunkh.png',
    colorScheme: {
      accent: '#10B981',
      border: 'border-emerald-400',
      glow: 'shadow-[0_0_50px_rgba(16,185,129,0.5)]',
      beamGradient: 'from-emerald-400/35 via-emerald-500/10 to-transparent',
      badgeBg: 'bg-emerald-950/90',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-500/40',
    },
  },
  {
    name: 'Bhumimekin Chaisuk-kosol',
    nickname: 'Aung Pao',
    role: 'Assistant Software Developer',
    badge: '💻 ASSISTANT DEVELOPER',
    avatar: '/team/aungpao.png',
    colorScheme: {
      accent: '#06B6D4',
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_50px_rgba(6,182,212,0.5)]',
      beamGradient: 'from-cyan-400/35 via-cyan-500/10 to-transparent',
      badgeBg: 'bg-cyan-950/90',
      badgeText: 'text-cyan-300',
      badgeBorder: 'border-cyan-500/40',
    },
  },
  {
    name: 'Pasit Junta',
    nickname: 'Satang',
    role: 'Manual QA Tester',
    badge: '🎯 MANUAL QA TESTER',
    avatar: '/team/satang.jpg',
    colorScheme: {
      accent: '#F59E0B',
      border: 'border-amber-400',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.5)]',
      beamGradient: 'from-amber-400/35 via-amber-500/10 to-transparent',
      badgeBg: 'bg-amber-950/90',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-500/40',
    },
  },
];

export default function CreditsIntroAnimation({ onComplete }: CreditsIntroAnimationProps) {
  // Stage:
  // 0 = Dark ambiance & "THE MINDS BEHIND WAVON" intro
  // 1 = Focus 1: Arm
  // 2 = Focus 2: Aung Pao
  // 3 = Focus 3: Satang
  // 4 = All 3 Spotlight Convergence & Harmonious burst
  const [stage, setStage] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const soundRef = useRef<boolean>(true);
  soundRef.current = soundEnabled;

  const timerRefs = useRef<NodeJS.Timeout[]>([]);

  const handleSkip = useCallback(() => {
    // Clear all pending timers
    timerRefs.current.forEach(clearTimeout);
    onComplete();
  }, [onComplete]);

  // Preload images and register keyboard listener
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

  // Sequence controller
  useEffect(() => {
    const clearTimers = () => timerRefs.current.forEach(clearTimeout);
    clearTimers();

    // Stage 0: Initial ambience sound & title rise
    if (soundRef.current) {
      playSpotlightAmbience();
    }

    // Schedule Stage 1: Arm (0.25s)
    const t1 = setTimeout(() => {
      setStage(1);
      setRevealed(false);
      if (soundRef.current) playSpotlightSnap(0);

      // Silhouette to photo reveal after 120ms
      const t1Rev = setTimeout(() => setRevealed(true), 120);
      timerRefs.current.push(t1Rev);
    }, 250);

    // Schedule Stage 2: Aung Pao (1.15s)
    const t2 = setTimeout(() => {
      setStage(2);
      setRevealed(false);
      if (soundRef.current) playSpotlightSnap(1);

      const t2Rev = setTimeout(() => setRevealed(true), 120);
      timerRefs.current.push(t2Rev);
    }, 1150);

    // Schedule Stage 3: Satang (2.05s)
    const t3 = setTimeout(() => {
      setStage(3);
      setRevealed(false);
      if (soundRef.current) playSpotlightSnap(2);

      const t3Rev = setTimeout(() => setRevealed(true), 120);
      timerRefs.current.push(t3Rev);
    }, 2050);

    // Schedule Stage 4: Convergence (2.85s)
    const t4 = setTimeout(() => {
      setStage(4);
      if (soundRef.current) playSpotlightChime();
    }, 2850);

    // Schedule Complete & transition to modal (3.35s)
    const tEnd = setTimeout(() => {
      onComplete();
    }, 3350);

    timerRefs.current.push(t1, t2, t3, t4, tEnd);

    return () => clearTimers();
  }, [onComplete]);

  // Currently focused team member for stages 1, 2, 3
  const activeMember = stage >= 1 && stage <= 3 ? TEAM_MEMBERS[stage - 1] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="WAVON Dev Team Intro Animation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden select-none font-sans"
    >
      {/* 1. Cyber Ambient Background & Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#0c121e_0%,_#020408_100%)]" />

      {/* Subtle Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 bg-repeat bg-[length:100%_4px]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
        }}
      />

      {/* 2. Floating Glow Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${(i % 3) * 2 + 2}px`,
              height: `${(i % 3) * 2 + 2}px`,
              top: `${(i * 19 + 7) % 90}%`,
              left: `${(i * 23 + 11) % 95}%`,
              backgroundColor:
                i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#06B6D4' : '#F59E0B',
              opacity: 0.35 + (i % 4) * 0.15,
              filter: 'blur(1px)',
              animationDuration: `${2 + (i % 3)}s`,
              animationDelay: `${(i * 0.2).toFixed(1)}s`,
            }}
          />
        ))}
      </div>

      {/* 3. Top Action Controls (Mute & Skip) */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30">
        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          aria-label={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-mono transition backdrop-blur-md cursor-pointer"
        >
          <span>{soundEnabled ? '🔊' : '🔇'}</span>
          <span className="hidden sm:inline text-[10px] uppercase tracking-wider">
            {soundEnabled ? 'Audio On' : 'Muted'}
          </span>
        </button>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleSkip}
          aria-label="ข้ามอนิเมชั่น"
          className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-mono font-bold tracking-wide transition backdrop-blur-md cursor-pointer shadow-lg hover:shadow-emerald-500/20"
        >
          <span>ข้าม (Skip)</span>
          <span className="group-hover:translate-x-0.5 transition-transform">⏭</span>
          <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline ml-1">
            [ESC]
          </span>
        </button>
      </div>

      {/* 4. Top Header Typography */}
      <div className="absolute top-16 sm:top-20 inset-x-0 text-center z-20 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono tracking-widest uppercase shadow-md animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>The Minds Behind WAVON</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-400 tracking-wider uppercase font-mono mt-1">
          Core Development & QA Engineering
        </p>
      </div>

      {/* 5. Central Cinematic Stage */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-md px-6 text-center">
        {/* Stage 0: Initial Ambient Rise */}
        {stage === 0 && (
          <div className="flex flex-col items-center justify-center animate-in fade-in duration-300 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-bounce">
              ⚡
            </div>
            <h2 className="text-lg font-black text-white tracking-wider font-mono">
              INITIALIZING CREW...
            </h2>
          </div>
        )}

        {/* Stages 1, 2, 3: Center Solo Showcase */}
        {activeMember && (
          <div
            key={stage}
            className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
          >
            {/* Spotlight Beam Cone from above */}
            <div
              className={`absolute -top-64 w-80 h-96 bg-gradient-to-b ${activeMember.colorScheme.beamGradient} pointer-events-none blur-2xl rounded-full transform -translate-y-12`}
              style={{
                clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
              }}
            />

            {/* Badge Indicator */}
            <div
              className={`mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10.5px] font-mono font-bold tracking-wide shadow-md ${activeMember.colorScheme.badgeBg} ${activeMember.colorScheme.badgeText} ${activeMember.colorScheme.badgeBorder}`}
            >
              <span>{activeMember.badge}</span>
            </div>

            {/* Avatar with Silhouette-to-Photo Reveal Effect */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 my-2">
              {/* Outer Neon Glow Halo */}
              <div
                className={`absolute -inset-2 rounded-full blur-md opacity-80 animate-pulse`}
                style={{ backgroundColor: activeMember.colorScheme.accent }}
              />

              {/* Main Avatar Container */}
              <div
                className={`relative w-full h-full rounded-full overflow-hidden bg-zinc-950 border-4 ${activeMember.colorScheme.border} ${activeMember.colorScheme.glow} flex items-center justify-center transition-all duration-300 shadow-2xl`}
              >
                {/* Silhouette Mask before spotlight fully illuminates */}
                {!revealed && (
                  <div className="absolute inset-0 z-10 bg-black/90 backdrop-blur-xs flex items-center justify-center">
                    <span className="text-4xl opacity-40">👤</span>
                  </div>
                )}

                {/* Actual Team Member Photo */}
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

              {/* Step indicator dot on avatar */}
              <div
                className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-zinc-950 border-2 flex items-center justify-center text-xs font-mono font-black shadow-lg"
                style={{
                  borderColor: activeMember.colorScheme.accent,
                  color: activeMember.colorScheme.accent,
                }}
              >
                {stage}/3
              </div>
            </div>

            {/* Member Identity & Name Card */}
            <div className="mt-4 space-y-1">
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
          </div>
        )}

        {/* Stage 4: Triple Spotlight Convergence */}
        {stage === 4 && (
          <div className="flex flex-col items-center justify-center animate-in zoom-in-90 duration-300 text-center">
            {/* Triple Cones Convergence Effect */}
            <div className="absolute -top-52 w-96 h-96 bg-radial from-white/30 via-emerald-400/20 to-transparent blur-3xl pointer-events-none rounded-full" />

            {/* Trio Mini Avatars in Convergence */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 mb-5">
              {TEAM_MEMBERS.map((member, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
                  style={{
                    borderColor: member.colorScheme.accent,
                    boxShadow: `0 0 25px ${member.colorScheme.accent}80`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.avatar}
                    alt={member.nickname}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-white font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <span>★ WAVON CORE DEV TEAM ★</span>
            </div>
            <p className="text-xs text-emerald-300 font-medium mt-2 animate-pulse">
              เปิดตัวทีมผู้สร้างสรรค์ระบบอย่างเป็นทางการ...
            </p>
          </div>
        )}
      </div>

      {/* 6. Glossy Mirror Floor & Reflection */}
      <div className="absolute bottom-0 inset-x-0 h-28 sm:h-36 pointer-events-none z-10 overflow-hidden flex justify-center">
        {/* Mirror Floor Gradient Line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />

        {/* Floor Glow Reflection */}
        <div
          className="w-3/4 sm:w-1/2 h-full bg-gradient-to-t from-transparent via-emerald-500/5 to-emerald-500/15 blur-xl transition-all duration-500 transform"
          style={{
            transform: 'perspective(200px) rotateX(60deg)',
          }}
        />
      </div>

      {/* 7. Bottom Progress Timeline Track */}
      <div className="absolute bottom-6 inset-x-8 sm:inset-x-24 z-30 flex items-center justify-center gap-2">
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
