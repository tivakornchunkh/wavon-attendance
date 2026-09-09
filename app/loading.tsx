import React from 'react';
import WavonLogo from '../components/WavonLogo';

export default function GlobalLoading() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-7 shadow-lg flex flex-col items-center gap-4 text-center max-w-xs w-full animate-pop">
        {/* Animated WAVON Water-Wave Logo */}
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute w-16 h-16 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
          <div className="relative animate-pulse">
            <WavonLogo theme="light" size="lg" />
          </div>
        </div>

        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-center gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
          </div>
          <p className="text-xs font-bold text-zinc-800">กำลังโหลดข้อมูล...</p>
          <p className="text-[10px] text-zinc-400 font-medium">WAVON Athlete Attendance</p>
        </div>
      </div>
    </div>
  );
}
