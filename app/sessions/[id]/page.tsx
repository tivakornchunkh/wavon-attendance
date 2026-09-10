import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../src/server/db/client';
import { SessionRepository } from '../../../src/server/repositories/session.repo';
import { AthleteRepository } from '../../../src/server/repositories/athlete.repo';
import { AttendanceRepository } from '../../../src/server/repositories/attendance.repo';
import { SessionService } from '../../../src/core/services/session.service';
import { AttendanceService } from '../../../src/core/services/attendance.service';
import { cancelSessionAction } from '../../actions/session.actions';
import CheckInRoster from './CheckInRoster';

export const dynamic = 'force-dynamic';

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const { id: sessionId } = await params;

  const sessionRepo = new SessionRepository(db);
  const athleteRepo = new AthleteRepository(db);
  const attendanceRepo = new AttendanceRepository(db);

  const sessionService = new SessionService(sessionRepo, athleteRepo, attendanceRepo);
  const attendanceService = new AttendanceService(attendanceRepo, sessionRepo);

  let rosterData;
  try {
    rosterData = await sessionService.getSessionAttendanceRoster(sessionId);
  } catch {
    notFound();
  }

  const { session, roster } = rosterData;
  const auditLogs = await attendanceService.getSessionAuditLogs(sessionId);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Back Link */}
      <div>
        <Link
          href="/sessions"
          className="text-xs font-bold text-zinc-600 hover:text-zinc-950 transition inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 min-h-[36px]"
        >
          <span>&larr;</span>
          <span>กลับไปยังรายการรอบซ้อม</span>
        </Link>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                {session.title}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800">
                รอบการฝึกซ้อม
              </span>
            </div>
            <div className="text-xs sm:text-sm text-zinc-500 mt-2 flex items-center gap-4 flex-wrap">
              <span>📅 วันที่: <strong className="text-zinc-800">{session.date}</strong></span>
              <span>⏰ เวลา: <strong className="text-zinc-800">{session.startTime} - {session.endTime} น.</strong></span>
            </div>
          </div>

          <div>
            <form
              action={async () => {
                'use server';
                await cancelSessionAction(sessionId);
              }}
            >
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer min-h-[40px]"
                title="ยกเลิกรอบนี้"
              >
                ยกเลิกรอบซ้อมนี้
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Check-in Roster */}
      <CheckInRoster
        sessionId={sessionId}
        initialRoster={roster}
        sessionDetails={{
          title: session.title,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
        }}
      />

      {/* Audit Logs Table (ประวัติการแก้ไขสถานะย้อนหลัง) */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
            <span>🛡️</span>
            <span>บันทึกการตรวจสอบย้อนหลัง (Audit Logs — {auditLogs.length} รายการ)</span>
          </h2>
          <span className="text-[10px] text-zinc-400">
            เก็บบันทึกอัตโนมัติเมื่อสถานะเปลี่ยน
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            ยังไม่มีประวัติการแก้ไขสถานะย้อนหลังในรอบนี้
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs text-zinc-600 whitespace-nowrap">
              <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-3">วันและเวลาที่แก้ไข</th>
                  <th className="px-5 py-3">รหัสนักกีฬา</th>
                  <th className="px-5 py-3 text-center">สถานะเดิม</th>
                  <th className="px-5 py-3 text-center">สถานะใหม่</th>
                  <th className="px-5 py-3">ผู้แก้ไข</th>
                  <th className="px-5 py-3">เหตุผล / หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                    <td className="px-5 py-3.5 font-mono text-zinc-500">
                      {new Date(log.changedAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-zinc-800">
                      {log.athleteId}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-bold">
                        {log.previousStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {log.newStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-zinc-700">
                      {log.changedBy}
                    </td>
                    <td className="px-5 py-3.5 italic text-zinc-500">
                      {log.reason || '-'}
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
