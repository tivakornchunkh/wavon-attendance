import Link from 'next/link';
import { loginAction } from '../actions/auth.actions';
import WavonLogo from '../../components/WavonLogo';
import WavonHeroEmblem from '../../components/WavonHeroEmblem';
import { LoginForm } from './LoginForm';
import { APP_VERSION } from '../../src/version';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F1F5F9] relative overflow-hidden py-6 sm:py-12 px-3 sm:px-4 flex flex-col justify-center items-center">
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-slate-200/60 rounded-full blur-3xl pointer-events-none" />

      {/* App-Card Container (Matching Reference Mockup) */}
      <div className="w-full max-w-[430px] relative z-10 bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] border border-zinc-200/90 overflow-hidden">
        {/* Card Top: Brand Header & Cool 3D WAVON Emblem */}
        <div className="relative bg-gradient-to-b from-[#EEF7F2] via-[#F4FAF6] to-white pt-6 px-6 pb-2 overflow-hidden">
          {/* Top Brand Bar */}
          <div className="flex items-center justify-between relative z-10 mb-3">
            <Link href="/" className="transition hover:opacity-90">
              <WavonLogo theme="light" size="sm" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/90 text-emerald-800 border border-emerald-200/80 shadow-2xs backdrop-blur-xs">
              {APP_VERSION}
            </span>
          </div>

          {/* Cool 3D Cyber Emblem Centerpiece */}
          <div className="py-2 flex justify-center">
            <WavonHeroEmblem size="md" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-center pt-3 pb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
              Login
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              เข้าสู่ระบบติดตามสถิติและการเช็คชื่อนักกีฬา
            </p>
          </div>
        </div>

        {/* Card Body: Form Fields & Actions */}
        <div className="px-6 sm:px-8 pb-7 pt-3 space-y-5 bg-white">
          <LoginForm loginAction={loginAction} />

          {/* Multi-Club Isolation Badge */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ระบบแยกข้อมูลเฉพาะสโมสร (Multi-Club Isolation)</span>
          </div>
        </div>
      </div>

      {/* Footer Credits */}
      <div className="text-center mt-6 space-y-1 text-[11px] text-zinc-400">
        <p className="font-semibold text-zinc-600">
          WAVON Sports Management System &bull; {APP_VERSION}
        </p>
        <p className="text-[10px]">
          &copy; {new Date().getFullYear()} WAVON. All rights reserved.
        </p>
      </div>
    </div>
  );
}


