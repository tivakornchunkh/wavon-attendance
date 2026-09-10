import Link from 'next/link';
import { loginAction } from '../actions/auth.actions';
import WavonLogo from '../../components/WavonLogo';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      {/* Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <WavonLogo theme="light" size="lg" className="justify-center" />
        <h1 className="mt-5 text-2xl font-black text-zinc-900 tracking-tight">
          เข้าสู่ระบบสโมสร
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          ระบบเช็คชื่อและสถิติการฝึกซ้อมนักกีฬา (Athlete Attendance System)
        </p>
      </div>

      <div className="space-y-5">
        {/* Main Login Form */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-7 shadow-xs">
          <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🔐</span>
            <span>ลงชื่อเข้าสู่ระบบ</span>
          </h2>

          <LoginForm loginAction={loginAction} />

          {/* New Club Self-Registration Link */}
          <div className="mt-5 pt-5 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-500 mb-2.5">
              ยังไม่มีสโมสรในระบบ?
            </p>
            <Link
              href="/register"
              className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-black transition flex items-center justify-center gap-2"
            >
              <span>✨</span>
              <span>เปิดสโมสรใหม่ / สมัครสมาชิกโค้ชฟรี</span>
            </Link>
          </div>

          {/* Security & Access Notice */}
          <div className="mt-6 pt-5 border-t border-zinc-100 space-y-2.5 text-[11px]">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3.5 text-zinc-600 space-y-1.5">
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span>🛡️</span>
                <span>ระบบรักษาความปลอดภัยและการเข้าถึง</span>
              </p>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                ระบบนี้สงวนสิทธิ์เฉพาะผู้ดูแล โค้ช และบุคลากรที่ได้รับอนุญาตเท่านั้น ข้อมูลการฝึกซ้อมและสถิตินักกีฬาถูกแยกความปลอดภัยตามแต่ละสโมสร (Multi-Club Isolation)
              </p>
              <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[10px] text-zinc-500">
                <span>ลืมรหัสผ่านหรือขอสิทธิ์ใช้งาน?</span>
                <span className="font-semibold text-zinc-700">กรุณาติดต่อผู้ดูแลระบบ</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Credits & Version Box */}
        <div className="text-center py-2 space-y-1">
          <p className="text-xs font-bold text-zinc-700">
            WAVON Athlete Attendance System <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-800 font-mono font-bold">v1.0</span>
          </p>
          <p className="text-[11px] text-zinc-400">
            Designed & Engineered for High-Performance Sports Teams & Academies
          </p>
          <p className="text-[10px] text-zinc-400 font-medium">
            &copy; {new Date().getFullYear()} WAVON Sports Management. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
