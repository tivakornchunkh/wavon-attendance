'use client';

import React from 'react';

interface WavonHeroEmblemProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * WavonHeroEmblem - Ultra-cool Cyber 3D Vector Emblem for WAVON
 * - 100% Vector SVG + CSS 3D Glassmorphism
 * - Instant 0ms load, zero external network dependencies, immune to broken images
 * - Glowing multi-layer emerald gradient, orbiting telemetry rings, and floating fluid 'W'
 */
export default function WavonHeroEmblem({
  className = '',
  size = 'md',
}: WavonHeroEmblemProps) {
  const dimension = {
    sm: 'w-36 h-36',
    md: 'w-44 h-44 sm:w-48 sm:h-48',
    lg: 'w-52 h-52 sm:w-60 sm:h-60',
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 1. Ambient Emerald Glow Backlight */}
      <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-emerald-300/10 blur-2xl animate-pulse pointer-events-none" />

      {/* 2. Main 3D Floating Emblem Container */}
      <div className={`relative ${dimension} flex items-center justify-center transition-transform duration-700 hover:scale-105 active:scale-95`}>
        {/* Outer Orbiting Telemetry Dashed Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/30 animate-[spin_30s_linear_infinite]" />

        {/* Second Reverse Spinning Ring with Accent Nodes */}
        <div className="absolute inset-2.5 rounded-full border border-emerald-400/20 animate-[spin_20s_linear_infinite_reverse]">
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-300 shadow-[0_0_6px_#2DD4BF]" />
        </div>

        {/* 3. Luxury Frosted Glass Shield Badge */}
        <div className="absolute inset-5 rounded-[28px] sm:rounded-[32px] bg-gradient-to-br from-white/95 via-emerald-50/50 to-white/90 backdrop-blur-xl border border-emerald-300/40 shadow-[0_16px_40px_-8px_rgba(16,185,129,0.22)] flex items-center justify-center overflow-hidden">
          {/* Subtle Hexagonal Background Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#10B981 1.5px, transparent 1.5px)`,
              backgroundSize: '12px 12px',
            }}
          />

          {/* Light Reflection Flare */}
          <div className="absolute -top-10 -left-10 w-28 h-28 bg-gradient-to-br from-white/80 via-white/20 to-transparent rotate-45 pointer-events-none" />

          {/* 4. The Iconic WAVON Fluid 'W' in Cyber 3D Gradient */}
          <div className="relative z-10 flex flex-col items-center">
            <svg
              viewBox="0 0 100 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-16 sm:w-24 sm:h-18 filter drop-shadow-[0_8px_14px_rgba(16,185,129,0.35)]"
            >
              <defs>
                {/* Emerald High-Tech Gradient */}
                <linearGradient id="wavonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0F172A" />
                  <stop offset="35%" stopColor="#059669" />
                  <stop offset="70%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#34D399" />
                </linearGradient>

                {/* Ribbon Wave Gradient */}
                <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>

              {/* Outer W Pillar Legs */}
              <path
                d="M10 14L28 66M90 14L72 66"
                stroke="url(#wavonGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Middle Fluid Wave Peak */}
              <path
                d="M28 66C38 42 42 22 54 22C66 22 62 42 72 66"
                stroke="url(#wavonGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Center Dynamic Fluid Ribbon */}
              <path
                d="M22 50C34 40 45 42 54 35C63 27 72 27 82 22"
                stroke="url(#ribbonGrad)"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Micro Brand Typography Under Symbol */}
            <div className="mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-[0.25em] text-zinc-900 uppercase">
                WAVON
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[8px] font-bold font-mono tracking-widest text-emerald-700 uppercase -mt-0.5">
              ATHLETIC LAB
            </span>
          </div>

          {/* Bottom Glass Glow Curve */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
        </div>

        {/* Subtle Orbiting Floating Badge Pills */}
        <div className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full bg-zinc-900 text-white text-[9px] font-black font-mono shadow-md border border-zinc-700/80 flex items-center gap-1 z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PRO ATHLETE</span>
        </div>
      </div>
    </div>
  );
}
