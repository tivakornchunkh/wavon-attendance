import React from 'react';

interface WavonLogoProps {
  variant?: 'full' | 'symbol' | 'horizontal';
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * WAVON Brand Logo Component
 * ถอดแบบเวกเตอร์จาก Brand Identity & Draft UI อย่างแม่นยำ
 * - สัญลักษณ์ตัว W พาดคลื่นน้ำ (Fluid Wave Ribbon)
 * - ตัวอักษร Geometric Sans-Serif: W Λ V O N
 */
export default function WavonLogo({
  variant = 'full',
  theme = 'light',
  className = '',
  size = 'md',
}: WavonLogoProps) {
  const isDark = theme === 'dark';
  const color = isDark ? '#FFFFFF' : '#0F1115';

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10',
    xl: 'h-14',
  }[size];

  // สัญลักษณ์ตัว W พาดคลื่นน้ำ (Standalone Symbol)
  const SymbolSVG = (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses} w-auto inline-block shrink-0`}
      aria-label="WAVON Symbol"
    >
      {/* Outer W legs */}
      <path
        d="M8 12L28 68M92 12L72 68"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Middle Fluid Wave Ribbon */}
      <path
        d="M28 68C36 44 42 22 55 22C68 22 62 44 72 68"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 50C32 40 46 42 54 34C62 26 72 26 84 20"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === 'symbol') {
    return <div className={`flex items-center ${className}`}>{SymbolSVG}</div>;
  }

  // Full Wordmark: Symbol + W Λ V O N
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Standalone Symbol */}
      <svg
        viewBox="0 0 100 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses} w-auto shrink-0`}
      >
        <path
          d="M10 14L28 66M90 14L72 66"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 66C38 42 42 22 54 22C66 22 62 42 72 66"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M22 50C34 40 45 42 54 35C63 27 72 27 82 22"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Wordmark: W Λ V O N */}
      <div className="flex flex-col">
        <span
          className={`font-black tracking-[0.22em] uppercase leading-none ${
            size === 'sm'
              ? 'text-sm'
              : size === 'md'
              ? 'text-lg'
              : size === 'lg'
              ? 'text-2xl'
              : 'text-3xl'
          }`}
          style={{
            color,
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          WAVON
        </span>
        <span
          className={`text-[9px] font-semibold tracking-[0.25em] uppercase opacity-75 mt-0.5 ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        >
          ATTENDANCE
        </span>
      </div>
    </div>
  );
}

