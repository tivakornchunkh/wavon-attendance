import Link from 'next/link';
import { loginAction } from '../actions/auth.actions';
import WavonLogo from '../../components/WavonLogo';
import { LoginForm } from './LoginForm';
import { APP_VERSION } from '../../src/version';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden py-8 sm:py-14 px-4 flex flex-col justify-center items-center">
      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-24 -left-24 w-80 sm:w-96 h-80 sm:h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-28 w-80 sm:w-96 h-80 sm:h-96 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 w-80 sm:w-96 h-80 sm:h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <WavonLogo theme="light" size="lg" className="justify-center" />
          </Link>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-zinc-700 border border-zinc-200/80 shadow-2xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multi-Club Sports System</span>
            <span className="text-zinc-300">•</span>
            <span className="font-mono text-emerald-700">{APP_VERSION}</span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            เข้าสู่ระบบสโมสร
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-500 max-w-xs leading-relaxed">
            ระบบเช็คชื่อและสถิติการฝึกซ้อมนักกีฬามาตรฐานสากล
          </p>
        </div>

        {/* Main Glass Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] space-y-6">
          <LoginForm loginAction={loginAction} />

          {/* New Club Self-Registration CTA */}
          <div className="pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500 mb-2.5 font-medium">
              ยังไม่มีสโมสรในระบบ?
            </p>
            <Link
              href="/register"
              className="w-full py-3.5 px-4 rounded-2xl bg-zinc-50 hover:bg-emerald-50/70 active:bg-emerald-100/70 border border-zinc-200/90 hover:border-emerald-300 text-zinc-800 hover:text-emerald-900 text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 group min-h-[48px]"
            >
              <span className="text-emerald-600 transition-transform group-hover:scale-110">✨</span>
              <span>เปิดสโมสรใหม่ / สมัครสมาชิกโค้ชฟรี</span>
              <span className="text-zinc-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>
          </div>

          {/* Security & Multi-Club Isolation Notice */}
          <div className="pt-5 border-t border-zinc-100 text-[11px]">
            <div className="bg-zinc-50/80 border border-zinc-200/70 rounded-2xl p-4 text-zinc-600 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>ความปลอดภัยระดับองค์กร</span>
                </p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  Club Isolated
                </span>
              </div>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                ระบบแยกสิทธิ์และการเข้าถึงข้อมูลนักกีฬาเฉพาะสโมสรของท่าน (Isolated Roster & Attendance) ปลอดภัยและเป็นส่วนตัว 100%
              </p>
              <div className="pt-2 border-t border-zinc-200/50 flex items-center justify-between text-[10px] text-zinc-500">
                <span>มีปัญหาการใช้งาน?</span>
                <span className="font-semibold text-zinc-700">ติดต่อผู้ดูแลระบบ</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Credits & Version Footer */}
        <div className="text-center py-2 space-y-1">
          <p className="text-xs font-bold text-zinc-700 flex items-center justify-center gap-1.5">
            <span>WAVON Sports Management</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-200/80 text-zinc-700 font-mono font-bold">
              {APP_VERSION}
            </span>
          </p>
          <p className="text-[11px] text-zinc-400">
            High-Performance Sports Attendance & Analytics
          </p>
          <p className="text-[10px] text-zinc-400 font-medium">
            &copy; {new Date().getFullYear()} WAVON. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

