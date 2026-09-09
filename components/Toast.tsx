'use client';

import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose?: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgStyles = {
    success: 'bg-[#0F1115] text-white border border-emerald-500/50 shadow-xl',
    info: 'bg-zinc-900 text-white border border-zinc-700 shadow-xl',
    warning: 'bg-amber-900 text-amber-100 border border-amber-500/50 shadow-xl',
    error: 'bg-rose-950 text-rose-100 border border-rose-500/50 shadow-xl',
  };

  const icons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
  };

  const iconColors = {
    success: 'bg-emerald-500 text-zinc-950',
    info: 'bg-blue-500 text-white',
    warning: 'bg-amber-500 text-zinc-950',
    error: 'bg-rose-500 text-white',
  };

  return (
    <aside
      aria-label="การแจ้งเตือน"
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-toast max-w-sm sm:max-w-md w-[90vw]"
    >
      <div
        role="status"
        className={[
          'flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold backdrop-blur-md',
          bgStyles[type]
        ].join(' ')}
      >
        <span
          className={[
            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0',
            iconColors[type]
          ].join(' ')}
        >
          {icons[type]}
        </span>
        <span className="flex-1 leading-snug">{message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/10 transition cursor-pointer text-xs"
            aria-label="ปิดการแจ้งเตือน"
          >
            ✕
          </button>
        )}
      </div>
    </aside>
  );
}
