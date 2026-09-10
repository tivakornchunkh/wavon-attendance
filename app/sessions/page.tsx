import Link from 'next/link';
import { db } from '../../src/server/db/client';
import { SessionRepository } from '../../src/server/repositories/session.repo';
import { AttendanceRepository } from '../../src/server/repositories/attendance.repo';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import {
  createPlannedSessionAction,
  createQuickSessionAction,
  getRecurringScheduleAction,
} from '../actions/session.actions';
import SessionsList from './SessionsList';
import { QuickSessionForm } from './QuickSessionForm';
import RecurringScheduleModal from './RecurringScheduleModal';
import PermanentQrModal from './PermanentQrModal';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);

  const sessions = await sessionRepo.findByDateRange(teamId);
  const recurringSchedule = await getRecurringScheduleAction(teamId);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // ดึงสรุปการเช็คชื่อของแต่ละรอบ
  const sessionsWithStats = await Promise.all(
    sessions.map(async (sess) => {
      const atts = await attendanceRepo.findBySessionId(sess.id);
      const present = atts.filter((a) => a.status === 'PRESENT').length;
      const absent = atts.filter((a) => a.status === 'ABSENT').length;
      const leave = atts.filter((a) => a.status === 'LEAVE').length;
      return {
        ...sess,
        totalChecked: atts.length,
        present,
        absent,
        leave,
      };
    })
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
              TRAINING
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              สโมสร {session.team ? session.team.name : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mt-1">
            รอบการฝึกซ้อมและเช็คชื่อ
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            เปิดรอบซ้อมด่วนริมสนาม วางแผนรอบซ้อมล่วงหน้า และบันทึกเช็คชื่อนักกีฬา
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <PermanentQrModal
            teamId={teamId}
            teamName={session.team?.name || 'สโมสร'}
          />
          <RecurringScheduleModal
            initialSchedule={recurringSchedule}
          />
          <span className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
            ทั้งหมด {sessions.length} รอบ
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Forms: Quick & Planned Sessions */}
        <div className="lg:col-span-1 space-y-5">
          {/* Quick Session (JIT) - Interactive Duration Adjuster for Coaches */}
          <QuickSessionForm
            action={createQuickSessionAction}
            defaultTodayStr={todayStr}
          />

          {/* Planned Session Form */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-zinc-900 mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <span>วางแผนรอบซ้อมล่วงหน้า</span>
            </h2>

            <form action={createPlannedSessionAction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  หัวข้อรอบการฝึกซ้อม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="เช่น ซ้อมเทคนิค / ทำกำลัง"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[44px]"
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
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[44px]"
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
                    defaultValue="16:00"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[44px]"
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
                    defaultValue="18:00"
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>+ บันทึกสร้างรอบซ้อม</span>
              </button>
            </form>
          </div>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2">
          <SessionsList sessions={sessionsWithStats} />
        </div>
      </div>
    </div>
  );
}
