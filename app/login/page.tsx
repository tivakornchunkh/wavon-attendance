import Link from 'next/link';
import { loginAction } from '../actions/auth.actions';
import WavonLogo from '../../components/WavonLogo';
import { LoginForm } from './LoginForm';
import { APP_VERSION } from '../../src/version';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-16 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Clean Brand Header */}
        <div className="text-center flex flex-col items-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-85">
            <WavonLogo theme="light" size="lg" className="justify-center" />
          </Link>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white text-zinc-600 border border-zinc-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>ระบบเช็คชื่อนักกีฬา</span>
            <span className="text-zinc-300">•</span>
            <span className="font-mono text-zinc-500">{APP_VERSION}</span>
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            เข้าสู่ระบบสโมสร
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-xs leading-relaxed">
            ระบบติดตามสถิติและการเช็คชื่อเข้าฝึกซ้อมรายสโมสร
          </p>
        </div>

        {/* Clean Main Card */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <LoginForm loginAction={loginAction} />

          {/* New Club Self-Registration CTA */}
          <div className="pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500 mb-2.5">
              ยังไม่มีสโมสรในระบบ?
            </p>
            <Link
              href="/register"
              className="w-full py-3 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100/90 active:bg-zinc-200/70 border border-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 min-h-[46px]"
            >
              <span>✨</span>
              <span>เปิดสโมสรใหม่ / สมัครสมาชิกโค้ชฟรี</span>
              <span className="text-zinc-400">&rarr;</span>
            </Link>
          </div>

          {/* Clean Security Notice */}
          <div className="pt-4 border-t border-zinc-100 text-[11px]">
            <div className="bg-zinc-50/70 border border-zinc-200/70 rounded-2xl p-3.5 text-zinc-600 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-zinc-800 flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>ระบบความปลอดภัยแยกสโมสร</span>
                </p>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-zinc-200/60 text-zinc-700 font-bold">
                  Isolated
                </span>
              </div>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                ข้อมูลรายชื่อนักกีฬาและรอบการฝึกซ้อมถูกแยกความปลอดภัยตามแต่ละสโมสร ปลอดภัยและเป็นส่วนตัว
              </p>
            </div>
          </div>
        </div>

        {/* Clean Footer */}
        <div className="text-center py-2 space-y-1 text-xs text-zinc-400">
          <p className="font-medium text-zinc-600">
            WAVON Sports Management System &bull; <span className="font-mono">{APP_VERSION}</span>
          </p>
          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} WAVON. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}



