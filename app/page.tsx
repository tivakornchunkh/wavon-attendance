import Link from 'next/link';
import { db } from '../src/server/db/client';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { StatisticsService } from '../src/core/services/statistics.service';
import { getCurrentSession } from '../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../src/server/helpers/default-team';
import { seedRealisticDataAction, clearDemoDataAction } from './actions/seed.actions';
import { autoCloseExpiredSessions } from './actions/session.actions';

export const dynamic = 'force-dynamic';

function getDateRangeFromPeriod(period?: string): { startDate?: string; endDate?: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (period === 'this_month') {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return {
      startDate: start,
      endDate: end,
      label: `เดือนนี้ (${thMonths[month]} ${year + 543})`,
    };
  }

  if (period === 'last_month') {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    const prevMonth = (month - 1 + 12) % 12;
    const prevYear = month === 0 ? year - 1 : year;
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return {
      startDate: start,
      endDate: end,
      label: `เดือนที่แล้ว (${thMonths[prevMonth]} ${prevYear + 543})`,
    };
  }

  return {
    startDate: undefined,
    endDate: undefined,
    label: 'ตลอดเวลาทั้งหมด',
  };
}

interface DashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { period } = await searchParams;
  const { startDate, endDate, label: periodLabel } = getDateRangeFromPeriod(period);

  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;

  // ตรวจสอบและตัดยอดรอบซ้อมที่หมดเวลาแล้วโดยอัตโนมัติ
  await autoCloseExpiredSessions(teamId);

  const athleteRepo = new AthleteRepository(db);
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);

  const dashboard = await statsService.getDashboardSummary(teamId, startDate, endDate);
  const allAthletesStats = await statsService.getAllAthletesStats(teamId, startDate, endDate);

  // คำนวณยอดรวมสำหรับชาร์ต
  let totalPresents = 0;
  let totalAbsents = 0;
  let totalLeaves = 0;
  for (const s of allAthletesStats) {
    totalPresents += s.presentCount;
    totalAbsents += s.absentCount;
    totalLeaves += s.leaveCount;
  }
  const totalRecorded = totalPresents + totalAbsents + totalLeaves;

  // Donut chart calculations
  const presentPct = totalRecorded > 0 ? (totalPresents / totalRecorded) * 100 : 0;
  const absentPct = totalRecorded > 0 ? (totalAbsents / totalRecorded) * 100 : 0;
  const leavePct = totalRecorded > 0 ? (totalLeaves / totalRecorded) * 100 : 0;

  // SVG Donut circumference: 2 * PI * r (r = 40 => c ~ 251.32)
  const c = 251.32;
  const presentStroke = (presentPct / 100) * c;
  const absentStroke = (absentPct / 100) * c;
  const leaveStroke = (leavePct / 100) * c;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ========================================================= */}
      {/* 1. HERO HEADER: Modern, Clean & High-Tech */}
      {/* ========================================================= */}
      <div className="bg-[#0F1115] text-white rounded-2xl p-5 sm:p-7 shadow-md border border-zinc-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
              WAVON ANALYTICS
            </span>
            <span className="text-xs text-zinc-400">
              {session.team ? session.team.name : 'สโมสร'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              คำนวณเรียลไทม์
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            แดชบอร์ดภาพรวมสถิติการฝึกซ้อม
          </h1>
          <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
            ติดตามความสม่ำเสมอของนักกีฬารายสโมสร (Attendance Rate) วิเคราะห์รอบการฝึกซ้อม และดูแนวโน้มแบบเรียลไทม์
          </p>
        </div>

        {/* Admin Demo Seeder (Discreet & Safe) */}
        {session.isAdmin && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 shrink-0 self-start md:self-auto w-full md:w-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>ชุดข้อมูลทดสอบ</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                ADMIN
              </span>
            </div>
            <div className="flex gap-2">
              <form action={seedRealisticDataAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer min-h-[38px] flex items-center justify-center gap-1"
                  title="สร้างข้อมูลจำลองเพื่อพรีเซนต์ (เฉพาะผู้ดูแล)"
                >
                  โหลด Demo
                </button>
              </form>
              <form action={clearDemoDataAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-zinc-800 hover:bg-rose-900/50 hover:text-rose-200 text-zinc-300 font-semibold text-xs rounded-lg border border-zinc-700 transition cursor-pointer min-h-[38px] flex items-center justify-center gap-1"
                  title="ลบเฉพาะข้อมูล Demo ออก (เฉพาะผู้ดูแล)"
                >
                  ล้าง Demo
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. DATE FILTER & EXPORT ACTION BAR (Touch-friendly) */}
      {/* ========================================================= */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
            <span>📅</span>
            <span>ช่วงเวลา:</span>
          </span>
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs overflow-x-auto">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg font-semibold transition min-h-[36px] flex items-center ${
                !period || period === 'all'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              ทั้งหมด
            </Link>
            <Link
              href="/?period=this_month"
              className={`px-3 py-2 rounded-lg font-semibold transition min-h-[36px] flex items-center ${
                period === 'this_month'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              เดือนนี้
            </Link>
            <Link
              href="/?period=last_month"
              className={`px-3 py-2 rounded-lg font-semibold transition min-h-[36px] flex items-center ${
                period === 'last_month'
                  ? 'bg-white text-zinc-950 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              เดือนที่แล้ว
            </Link>
          </div>
          <span className="text-xs text-zinc-400 font-medium">({periodLabel})</span>
        </div>

        {/* Export Button */}
        <a
          href={`/api/export/attendance${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`}
          download
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer min-h-[42px] self-stretch sm:self-auto"
          title="ดาวน์โหลดรายงานสรุปเป็นไฟล์ Excel/CSV (ภาษาไทยสมบูรณ์)"
        >
          <span>📥</span>
          <span>ส่งออกรายงาน (Excel / CSV)</span>
        </a>
      </div>

      {/* ========================================================= */}
      {/* 3. 4 KEY METRIC CARDS (Responsive: 1 col mobile, 2 col iPad, 4 col desktop) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Attendance Rate */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs hover:border-zinc-300 hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                ความสม่ำเสมอรวม
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                dashboard.overallAttendanceRate >= 80
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : dashboard.overallAttendanceRate >= 50
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {dashboard.overallAttendanceRate >= 80 ? 'ดีเยี่ยม' : dashboard.overallAttendanceRate >= 50 ? 'ปานกลาง' : 'ปรับปรุง'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                {dashboard.overallAttendanceRate}%
              </span>
              <span className="text-xs text-zinc-400 font-medium">เฉลี่ยรวม</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                dashboard.overallAttendanceRate >= 80
                  ? 'bg-emerald-500'
                  : dashboard.overallAttendanceRate >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, dashboard.overallAttendanceRate))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Active Athletes */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs hover:border-zinc-300 hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                นักกีฬาในสังกัด
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                ACTIVE
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                {dashboard.activeAthletes}
              </span>
              <span className="text-xs text-zinc-400 font-medium">/ {dashboard.totalAthletes} คน</span>
            </div>
          </div>
          <Link
            href="/athletes"
            className="mt-4 text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition"
          >
            <span>จัดการรายชื่อนักกีฬา</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Card 3: Total Sessions */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs hover:border-zinc-300 hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                รอบการฝึกซ้อม
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                SESSIONS
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
                {dashboard.totalSessions}
              </span>
              <span className="text-xs text-zinc-400 font-medium">รอบที่บันทึก</span>
            </div>
          </div>
          <Link
            href="/sessions"
            className="mt-4 text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition"
          >
            <span>ดูตารางรอบซ้อม</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Card 4: Today Summary */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs hover:border-zinc-300 hover-lift flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                รอบซ้อมวันนี้
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                TODAY
              </span>
            </div>
            {dashboard.todaySummary ? (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-700">มา: {dashboard.todaySummary.presentCount}</span>
                  <span className="text-rose-700">ขาด: {dashboard.todaySummary.absentCount}</span>
                  <span className="text-amber-700">ลา: {dashboard.todaySummary.leaveCount}</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  ความสม่ำเสมอวันนี้: <strong className="text-zinc-900">{dashboard.todaySummary.attendanceRate}%</strong>
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm font-semibold text-zinc-400 italic">วันนี้ยังไม่มีรอบซ้อม</p>
              </div>
            )}
          </div>
          <Link
            href="/sessions"
            className="mt-4 text-xs font-semibold text-zinc-700 hover:text-zinc-950 flex items-center gap-1 transition"
          >
            <span>บันทึกการซ้อมวันนี้</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. DATA VISUALIZATION WIDGET (Recent Charts - Matching Mockup) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donut Chart Widget */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>📊</span>
                <span>สัดส่วนการเข้าซ้อมสะสม</span>
              </h2>
              <span className="text-[11px] text-zinc-400 font-mono">BREAKDOWN</span>
            </div>

            {totalRecorded === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                ยังไม่มีข้อมูลการบันทึกการเช็คชื่อ
              </div>
            ) : (
              <div className="flex items-center justify-center gap-6 py-2">
                {/* SVG Donut */}
                <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                    {/* Present slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#10b981"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${presentStroke} ${c}`}
                      strokeDashoffset="0"
                      className="transition-all duration-700"
                    />
                    {/* Absent slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f43f5e"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${absentStroke} ${c}`}
                      strokeDashoffset={`-${presentStroke}`}
                      className="transition-all duration-700"
                    />
                    {/* Leave slice */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${leaveStroke} ${c}`}
                      strokeDashoffset={`-${presentStroke + absentStroke}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-zinc-900 block leading-none">
                      {dashboard.overallAttendanceRate}%
                    </span>
                    <span className="text-[9px] text-zinc-400 font-medium">ATTEND</span>
                  </div>
                </div>

                {/* Legends */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                    <span className="text-zinc-600 font-medium">มาซ้อม:</span>
                    <strong className="text-zinc-900">{totalPresents} ({Math.round(presentPct)}%)</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-rose-500 shrink-0" />
                    <span className="text-zinc-600 font-medium">ขาดซ้อม:</span>
                    <strong className="text-zinc-900">{totalAbsents} ({Math.round(absentPct)}%)</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" />
                    <span className="text-zinc-600 font-medium">ลาซ้อม:</span>
                    <strong className="text-zinc-900">{totalLeaves} ({Math.round(leavePct)}%)</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-zinc-400 mt-4 pt-3 border-t border-zinc-100">
            * วันลาที่ได้รับอนุมัติล่วงหน้าจะไม่ถูกนำมาหักคะแนนความสม่ำเสมอ
          </p>
        </div>

        {/* Quick Performance & Discipline Indicator */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>🎯</span>
                <span>มาตรฐานและเป้าหมายความสม่ำเสมอ (Discipline Standard)</span>
              </h2>
              <span className="text-[11px] text-zinc-400 font-mono">TARGET 80%+</span>
            </div>

            <p className="text-xs text-zinc-500 mb-4">
              นักกีฬาที่มีอัตราการเข้าซ้อม 80% ขึ้นไป ถือว่าผ่านเกณฑ์มาตรฐานการฝึกซ้อมของสโมสร
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800 block">🟢 ดีเยี่ยม (80%+)</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {allAthletesStats.filter((a) => a.attendanceRate >= 80).length} คน
                </span>
                <span className="text-[10px] text-emerald-600/80 mt-1 block">
                  ผ่านเกณฑ์มาตรฐานสูง
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="text-xs font-bold text-amber-800 block">🟡 ปานกลาง (50-79%)</span>
                <span className="text-2xl font-black text-amber-700 mt-1 block">
                  {allAthletesStats.filter((a) => a.attendanceRate >= 50 && a.attendanceRate < 80).length} คน
                </span>
                <span className="text-[10px] text-amber-600/80 mt-1 block">
                  ควรสนับสนุนให้มาซ้อมต่อเนื่อง
                </span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
                <span className="text-xs font-bold text-rose-800 block">🔴 ต้องติดตาม (&lt;50%)</span>
                <span className="text-2xl font-black text-rose-700 mt-1 block">
                  {allAthletesStats.filter((a) => a.totalSessions > 0 && a.attendanceRate < 50).length} คน
                </span>
                <span className="text-[10px] text-rose-600/80 mt-1 block">
                  ขาดซ้อมบ่อย ต้องพูดคุย
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-500">จำนวนนักกีฬาที่เข้าประเมินทั้งหมด:</span>
            <strong className="text-zinc-900">{allAthletesStats.length} คน</strong>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. TOP ATTENDEES VS TOP ABSENTEES (2 Ranking Columns) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Top Attendees */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 bg-emerald-50/30 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>🏆</span>
              <span>มาซ้อมสม่ำเสมอที่สุด (Top Attendees)</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">
              TOP 5
            </span>
          </div>

          {dashboard.frequentAttendees.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">ยังไม่มีข้อมูลการเข้าซ้อมในช่วงนี้</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {dashboard.frequentAttendees.map((a, idx) => (
                <div
                  key={a.athleteId}
                  className="px-5 sm:px-6 py-3.5 flex items-center justify-between hover:bg-zinc-50/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : idx === 1
                          ? 'bg-zinc-300 text-zinc-800'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <Link
                        href={`/athletes/${a.athleteId}`}
                        className="text-xs font-bold text-zinc-900 hover:text-indigo-600 hover:underline block leading-tight"
                      >
                        {a.athleteName}
                      </Link>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{a.athleteCode}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {a.attendanceRate}%
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      มา {a.presentCount} / {a.totalSessions} รอบ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Absentees */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 bg-rose-50/30 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>⚠️</span>
              <span>ขาดซ้อมบ่อยที่สุด (Top Absentees)</span>
            </h2>
            <span className="text-[10px] font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-100">
              ติดตาม
            </span>
          </div>

          {dashboard.frequentAbsentees.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">ยอดเยี่ยม! ไม่มีประวัตินักกีฬาขาดซ้อม</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {dashboard.frequentAbsentees.map((a, idx) => (
                <div
                  key={a.athleteId}
                  className="px-5 sm:px-6 py-3.5 flex items-center justify-between hover:bg-zinc-50/80 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <Link
                        href={`/athletes/${a.athleteId}`}
                        className="text-xs font-bold text-zinc-900 hover:text-indigo-600 hover:underline block leading-tight"
                      >
                        {a.athleteName}
                      </Link>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{a.athleteCode}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                      ขาด {a.absentCount} ครั้ง
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      ความสม่ำเสมอ: {a.attendanceRate}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. ALL ATHLETES DETAILED TABLE (Smooth Swipe on iPad/Mobile) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-zinc-900">
              ตารางสถิติรายบุคคล ({allAthletesStats.length} คน)
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              คลิกที่ชื่อนักกีฬาเพื่อดูประวัติและไทม์ไลน์การเข้าซ้อมทีละรอบ
            </p>
          </div>
          <a
            href={`/api/export/attendance${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`}
            download
            className="text-xs font-bold text-zinc-700 hover:text-zinc-950 self-start sm:self-auto flex items-center gap-1"
          >
            <span>📥 โหลดเป็น Excel</span>
          </a>
        </div>

        {allAthletesStats.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">ยังไม่มีข้อมูลนักกีฬาในระบบ</div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs text-zinc-600 whitespace-nowrap">
              <thead className="bg-zinc-50 uppercase font-bold text-zinc-500 border-b border-zinc-200 text-[11px]">
                <tr>
                  <th className="px-5 py-3">รหัส</th>
                  <th className="px-5 py-3">ชื่อ - นามสกุล</th>
                  <th className="px-5 py-3 text-center">รอบที่บันทึก</th>
                  <th className="px-5 py-3 text-center text-emerald-700">มา (Present)</th>
                  <th className="px-5 py-3 text-center text-rose-700">ขาด (Absent)</th>
                  <th className="px-5 py-3 text-center text-amber-700">ลา (Leave)</th>
                  <th className="px-5 py-3 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {allAthletesStats.map((stat) => (
                  <tr key={stat.athleteId} className="hover:bg-zinc-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-zinc-700">
                      <span className="px-2 py-0.5 rounded bg-zinc-100">
                        {stat.athleteCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-zinc-900">
                      <Link
                        href={`/athletes/${stat.athleteId}`}
                        className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                      >
                        <span>{stat.athleteName}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">&rarr;</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium">
                      {stat.totalSessions} รอบ
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-700">
                      {stat.presentCount}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-rose-700">
                      {stat.absentCount}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-amber-700">
                      {stat.leaveCount}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-sm">
                      <span
                        className={`px-2.5 py-1 rounded-lg ${
                          stat.attendanceRate >= 80
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : stat.attendanceRate >= 50
                            ? 'text-amber-700 bg-amber-50 border border-amber-200'
                            : 'text-rose-700 bg-rose-50 border border-rose-200'
                        }`}
                      >
                        {stat.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
