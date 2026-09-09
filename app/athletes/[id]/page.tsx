import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../src/server/db/client';
import { AthleteRepository } from '../../../src/server/repositories/athlete.repo';
import { AttendanceRepository } from '../../../src/server/repositories/attendance.repo';
import { getCurrentSession } from '../../../src/server/helpers/auth';
import { teams } from '../../../src/server/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface AthleteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AthleteDetailPage({ params }: AthleteDetailPageProps) {
  const { id: athleteId } = await params;
  const session = await getCurrentSession();

  const athleteRepo = new AthleteRepository(db);
  const attendanceRepo = new AttendanceRepository(db);

  const athlete = await athleteRepo.findById(athleteId);
  if (!athlete) {
    notFound();
  }

  // Security: หากไม่ใช่ Admin และไม่ได้อยู่ในสโมสรเดียวกัน ให้ปฏิเสธการเข้าถึง
  if (!session.isAdmin && session.team && athlete.teamId !== session.team.id) {
    notFound();
  }

  // ดึงชื่อทีมของนักกีฬา
  const [athleteTeam] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, athlete.teamId))
    .limit(1);

  // ดึงประวัติการเข้าซ้อมทั้งหมดของนักกีฬา
  const history = await attendanceRepo.findByAthlete(athleteId);

  // เรียงลำดับตามวันที่ซ้อม ล่าสุดขึ้นก่อน
  history.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

  const totalSessions = history.length;
  const presentCount = history.filter((h) => h.status === 'PRESENT').length;
  const absentCount = history.filter((h) => h.status === 'ABSENT').length;
  const leaveCount = history.filter((h) => h.status === 'LEAVE').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/athletes"
          className="text-xs font-bold text-zinc-600 hover:text-zinc-950 transition inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 min-h-[36px]"
        >
          <span>&larr;</span>
          <span>กลับไปยังรายชื่อนักกีฬา</span>
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#0F1115] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-sm">
              {athlete.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
                  {athlete.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700">
                  {athlete.athleteCode}
                </span>
                {athlete.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    ● Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600">
                    ○ Inactive
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-zinc-500 mt-2.5">
                <span>🏢 สโมสร: <strong className="text-zinc-800">{athleteTeam?.name || 'ไม่ระบุ'}</strong></span>
                <span>📞 โทร: <strong className="text-zinc-800">{athlete.phone || '-'}</strong></span>
                <span>📅 เริ่มเข้าสังกัด: <strong className="text-zinc-800">{athlete.startDate}</strong></span>
              </div>
            </div>
          </div>

          <div className="self-stretch sm:self-auto">
            <Link
              href={`/api/export/attendance?athleteId=${athlete.id}`}
              download
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition w-full sm:w-auto min-h-[44px]"
              title="ดาวน์โหลดใบบันทึกสถิติรายบุคคล (Excel/CSV)"
            >
              <span>📥</span>
              <span>ส่งออกใบบันทึกสถิตินี้ (Excel)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            ความสม่ำเสมอรวม
          </p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-3xl sm:text-4xl font-black tracking-tight ${
                attendanceRate >= 80
                  ? 'text-emerald-700'
                  : attendanceRate >= 50
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {attendanceRate}%
            </span>
            <span className="text-xs text-zinc-400 font-medium">/ {totalSessions} รอบ</span>
          </div>
          <div className="mt-3 w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                attendanceRate >= 80
                  ? 'bg-emerald-500'
                  : attendanceRate >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            มาซ้อม (Present)
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700">
              {presentCount}
            </span>
            <span className="text-xs text-zinc-400 font-medium">ครั้ง</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            คิดเป็น {totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0}% ของรอบทั้งหมด
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            ขาดซ้อม (Absent)
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-rose-700">
              {absentCount}
            </span>
            <span className="text-xs text-zinc-400 font-medium">ครั้ง</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            คิดเป็น {totalSessions > 0 ? Math.round((absentCount / totalSessions) * 100) : 0}% ของรอบทั้งหมด
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            ลาซ้อม (Leave)
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-amber-700">
              {leaveCount}
            </span>
            <span className="text-xs text-zinc-400 font-medium">ครั้ง</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-medium">
            วันลาไม่ถูกนำมาหักคะแนนความสม่ำเสมอ
          </p>
        </div>
      </div>

      {/* Attendance History Timeline / Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <h2 className="text-sm font-black text-zinc-900 flex items-center gap-2">
            <span>📋</span>
            <span>ประวัติการบันทึกการเข้าซ้อม ({history.length} รายการ)</span>
          </h2>
          <span className="text-[11px] text-zinc-400">
            เรียงตามวันที่ล่าสุดก่อน
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            ยังไม่มีประวัติการเช็คชื่อสำหรับนักกีฬาคนนี้
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-600 whitespace-nowrap">
              <thead className="bg-zinc-50 uppercase font-bold text-zinc-500 border-b border-zinc-200 text-[11px]">
                <tr>
                  <th className="px-5 sm:px-6 py-3">วันที่ซ้อม</th>
                  <th className="px-5 sm:px-6 py-3">รอบการซ้อม</th>
                  <th className="px-5 sm:px-6 py-3 text-center">สถานะ</th>
                  <th className="px-5 sm:px-6 py-3">ผู้บันทึก</th>
                  <th className="px-5 sm:px-6 py-3">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50/80 transition">
                    <td className="px-5 sm:px-6 py-4 font-bold text-zinc-900">
                      {record.sessionDate}
                    </td>
                    <td className="px-5 sm:px-6 py-4 font-bold text-zinc-900">
                      <Link
                        href={`/sessions/${record.sessionId}`}
                        className="hover:text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        <span>{record.sessionTitle}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">&rarr;</span>
                      </Link>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-center">
                      {record.status === 'PRESENT' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ มา (Present)
                        </span>
                      )}
                      {record.status === 'ABSENT' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ✕ ขาด (Absent)
                        </span>
                      )}
                      {record.status === 'LEAVE' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⚠ ลา (Leave)
                        </span>
                      )}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-zinc-500 font-mono text-xs">
                      {record.checkedBy || '-'}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-zinc-600 italic">
                      {record.notes || '-'}
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
