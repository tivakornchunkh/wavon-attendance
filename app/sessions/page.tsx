import { db } from '../../src/server/db/client';
import { teams } from '../../src/server/db/schema';
import { eq } from 'drizzle-orm';
import { SessionRepository } from '../../src/server/repositories/session.repo';
import { AttendanceRepository } from '../../src/server/repositories/attendance.repo';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import {
  createPlannedSessionAction,
  getRecurringSchedulesAction,
  ensureTodayRecurringSession,
  autoCloseExpiredSessions,
  resolveClubActiveSession,
} from '../actions/session.actions';
import SessionsList from './SessionsList';
import RecurringScheduleModal from './RecurringScheduleModal';
import PermanentQrModal from './PermanentQrModal';
import QrCodeSvg from '../../components/QrCodeSvg';
import { getBangkokDateTime } from '../../src/server/helpers/timezone';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);

  // 1. ตรวจสอบและตัดยอดรอบซ้อมที่หมดเวลาแล้วโดยอัตโนมัติ (Auto-Close & Auto-Absent Cut-off)
  await autoCloseExpiredSessions(teamId);

  // 2. ตรวจสอบและสร้างรอบซ้อมประจำวันอัตโนมัติหากวันนี้ตรงกับตารางซ้อมประจำ (รองรับหลายรอบต่อวัน)
  await ensureTodayRecurringSession(teamId);

  const sessions = await sessionRepo.findByDateRange(teamId);
  const recurringSchedules = await getRecurringSchedulesAction(teamId);
  const todayStr = getBangkokDateTime().dateStr;

  // ดึงข้อมูลทีมเพื่อนำ token QR ถาวรมาใช้
  const [currentTeam] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  const qrToken = currentTeam?.permanentQrToken || teamId;

  // ตรวจสอบสถานะของป้าย QR ถาวรแบบเรียลไทม์
  let qrResolution;
  try {
    qrResolution = await resolveClubActiveSession(qrToken);
  } catch {
    qrResolution = null;
  }

  // ดึงสรุปการเช็คชื่อของแต่ละรอบ
  const sessionsWithStats = await Promise.all(
    sessions.map(async (sess) => {
      const atts = await attendanceRepo.findBySessionId(sess.id);
      const present = atts.filter((a) => a.status === 'PRESENT').length;
      const absent = atts.filter((a) => a.status === 'ABSENT').length;
      const leave = atts.filter((a) => a.status === 'LEAVE').length;
      return {
        ...sess,
        isClosed: sess.isClosed === 1,
        totalChecked: atts.length,
        present,
        absent,
        leave,
      };
    })
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              PERMANENT QR & SESSIONS
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              สโมสร {session.team ? session.team.name : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mt-1">
            รอบการฝึกซ้อมและเช็คชื่อ
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            ระบบเช็คชื่อผ่านป้าย QR Code ถาวรประจำสนาม รองรับหลายรอบต่อวัน และวางแผนรอบซ้อมล่วงหน้า
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <PermanentQrModal
            teamId={teamId}
            teamName={session.team?.name || 'สโมสร'}
            qrToken={currentTeam?.permanentQrToken}
          />
          <RecurringScheduleModal
            schedules={recurringSchedules}
          />
          <span className="inline-flex items-center px-3 py-2 rounded-xl text-xs font-bold bg-white text-zinc-700 border border-zinc-200 shadow-xs">
            ทั้งหมด {sessions.length} รอบ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Permanent QR Showcase & Planned Session Form */}
        <div className="lg:col-span-1 space-y-5">
          {/* Card 1: PERMANENT QR SHOWCASE (Hero Card) */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 p-5 sm:p-6 shadow-xs overflow-hidden relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  📌
                </span>
                <div>
                  <h2 className="text-sm font-black text-zinc-900">
                    ป้าย QR Code ประจำสนาม
                  </h2>
                  <p className="text-[10px] text-zinc-400">
                    พิมพ์ติดริมสนามครั้งเดียว ใช้ได้ตลอดฤดูกาล
                  </p>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="ระบบเปิดรับอัตโนมัติ" />
            </div>

            {/* Real-time Session Status Banner */}
            <div className="mt-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs">
              {qrResolution?.activeSession ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-black">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>🟢 กำลังเปิดรับสแกนขณะนี้</span>
                  </div>
                  <p className="text-zinc-800 font-bold">
                    {qrResolution.activeSession.title} ({qrResolution.activeSession.startTime} - {qrResolution.activeSession.endTime} น.)
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    นักกีฬาสแกนเพื่อเช็คชื่อเข้าซ้อมได้ทันที
                  </p>
                </div>
              ) : qrResolution?.nextScheduleInfo ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <span>⏱️</span>
                    <span>สถานะป้ายสแกนวันนี้:</span>
                  </div>
                  <p className="text-zinc-700 text-[11px] leading-relaxed font-medium">
                    {qrResolution.nextScheduleInfo}
                  </p>
                </div>
              ) : (
                <div className="text-zinc-500 text-[11px]">
                  ป้าย QR ถาวรพร้อมใช้งานตามตารางฝึกซ้อม
                </div>
              )}
            </div>

            {/* Mini QR Thumbnail & Quick Actions */}
            <div className="mt-4 flex items-center gap-4">
              <div className="w-20 h-20 bg-white p-2 rounded-2xl border-2 border-zinc-900 shadow-sm shrink-0 flex items-center justify-center">
                <QrCodeSvg
                  value={`/checkin/club/${qrToken}?pitch=true`}
                  size={64}
                />
              </div>
              <div className="flex-1 space-y-2">
                <PermanentQrModal
                  teamId={teamId}
                  teamName={session.team?.name || 'สโมสร'}
                  qrToken={currentTeam?.permanentQrToken}
                  triggerButtonText="🖨️ พิมพ์ป้าย A4 ริมสนาม"
                  triggerButtonClass="w-full py-2 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 min-h-[38px]"
                />
                <RecurringScheduleModal
                  schedules={recurringSchedules}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Create Planned Session Form */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 p-5 sm:p-6 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-zinc-900 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <span>สร้างรอบซ้อมเพิ่มเติม (Planned Session)</span>
            </h2>
            <p className="text-[11px] text-zinc-400 mb-4">
              สำหรับรอบซ้อมพิเศษ นอกเหนือจากตารางซ้อมประจำ QR ถาวรจะจับคู่ให้อัตโนมัติ
            </p>

            <form action={createPlannedSessionAction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  หัวข้อรอบการฝึกซ้อม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="เช่น ซ้อมแท็กติก / อุ่นเครื่อง"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  วันที่ฝึกซ้อม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={todayStr}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    เวลาเริ่ม <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    defaultValue="16:30"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    เวลาสิ้นสุด <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    defaultValue="18:30"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 px-4 py-3 bg-zinc-950 hover:bg-zinc-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>+ สร้างรอบการฝึกซ้อม</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Sessions List with Edit capabilities */}
        <div className="lg:col-span-2">
          <SessionsList sessions={sessionsWithStats} todayStr={todayStr} />
        </div>
      </div>
    </div>
  );
}
