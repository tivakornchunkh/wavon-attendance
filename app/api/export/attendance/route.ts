import { NextResponse } from 'next/server';
import { db } from '../../../../src/server/db/client';
import { AthleteRepository } from '../../../../src/server/repositories/athlete.repo';
import { SessionRepository } from '../../../../src/server/repositories/session.repo';
import { AttendanceRepository } from '../../../../src/server/repositories/attendance.repo';
import { StatisticsService } from '../../../../src/core/services/statistics.service';
import { getCurrentSession } from '../../../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../../../src/server/helpers/default-team';

export const dynamic = 'force-dynamic';

function formatThaiPeriod(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return 'ข้อมูลทั้งหมดตั้งแต่เริ่มระบบ';
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  if (sYear === eYear && sMonth === eMonth && sDay === 1) {
    return `ประจำเดือน ${thaiMonths[sMonth - 1]} พ.ศ. ${sYear + 543}`;
  }
  return `${sDay} ${thaiMonths[sMonth - 1]} ${sYear + 543} ถึง ${eDay} ${thaiMonths[eMonth - 1]} ${eYear + 543}`;
}

function getEvaluationBadge(rate: number, total: number): string {
  if (total === 0) return 'ยังไม่มีรอบซ้อม';
  if (rate >= 80) return '🟢 สม่ำเสมอดีเยี่ยม (80%+)';
  if (rate >= 50) return '🟡 ปานกลาง (50-79%)';
  return '🔴 ต้องติดตามใกล้ชิด (<50%)';
}

function getOverallBadge(rate: number, total: number): string {
  if (total === 0) return 'ยังไม่มีรอบซ้อมในช่วงนี้';
  if (rate >= 80) return '🟢 ยอดเยี่ยม (ผ่านเกณฑ์สโมสร)';
  if (rate >= 50) return '🟡 ปานกลาง (ควรติดตามสม่ำเสมอ)';
  return '🔴 ต้องปรับปรุง (ต่ำกว่าเกณฑ์สโมสร)';
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;
  const teamName = session.team?.name || 'สโมสร';

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const athleteId = searchParams.get('athleteId') || undefined;

  const athleteRepo = new AthleteRepository(db);
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);

  const now = new Date();
  const thaiMonthsShort = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const printDateText = `${now.getDate()} ${thaiMonthsShort[now.getMonth()]} ${now.getFullYear() + 543} เวลา ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
  const todayStr = now.toISOString().split('T')[0];
  const bom = '\uFEFF';

  // ==========================================
  // กรณี 1: ส่งออกรายงานรายบุคคล (Individual Slip)
  // ==========================================
  if (athleteId) {
    const athlete = await athleteRepo.findById(athleteId);
    if (!athlete) {
      return new NextResponse('ไม่พบข้อมูลนักกีฬา', { status: 404 });
    }

    if (!session.isAdmin && session.team && athlete.teamId !== session.team.id) {
      return new NextResponse('ไม่มีสิทธิ์เข้าถึงข้อมูลนักกีฬาสโมสรอื่น', { status: 403 });
    }

    const history = await attendanceRepo.findByAthlete(athleteId, startDate, endDate);
    history.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    const totalSessions = history.length;
    const presentCount = history.filter((h) => h.status === 'PRESENT').length;
    const absentCount = history.filter((h) => h.status === 'ABSENT').length;
    const leaveCount = history.filter((h) => h.status === 'LEAVE').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    const lines: string[] = [
      `"รายงานสรุปสถิติการฝึกซ้อมรายบุคคล (Individual Attendance Slip)"`,
      `"สโมสร:","${teamName}"`,
      `"ชื่อ - นามสกุล:","${athlete.name}"`,
      `"รหัสนักกีฬา:","${athlete.athleteCode}"`,
      `"เบอร์โทรศัพท์:","${athlete.phone || '-'}"`,
      `"วันที่เริ่มเข้าสังกัด:","${athlete.startDate}"`,
      `"สถานะ:","${athlete.status === 'ACTIVE' ? 'ใช้งานปกติ (Active)' : 'พักซ้อม (Inactive)'}"`,
      `"ช่วงเวลาที่รายงาน:","${formatThaiPeriod(startDate, endDate)}"`,
      `"วันที่พิมพ์รายงาน:","${printDateText}"`,
      `""`,
      `"=== สรุปผลการเข้าฝึกซ้อม ==="`,
      `"รอบการซ้อมที่บันทึก:","${totalSessions} รอบ"`,
      `"มาซ้อม (Present):","${presentCount} ครั้ง"`,
      `"ขาดซ้อม (Absent):","${absentCount} ครั้ง"`,
      `"ลาซ้อม (Leave):","${leaveCount} ครั้ง"`,
      `"อัตราความสม่ำเสมอรวม:","${attendanceRate}%"`,
      `"ผลการประเมิน:","${getEvaluationBadge(attendanceRate, totalSessions)}"`,
      `""`,
      `"=== ประวัติการเข้าฝึกซ้อมแต่ละรอบ (Timeline) ==="`,
      `"ลำดับ","วันที่ซ้อม","รอบการซ้อม","สถานะการเข้าซ้อม","ผู้บันทึก","หมายเหตุ / เหตุผลการลา"`,
      ...history.map((h, idx) => [
        idx + 1,
        `"${h.sessionDate}"`,
        `"${h.sessionTitle.replace(/"/g, '""')}"`,
        h.status === 'PRESENT' ? '"✓ มา (Present)"' : h.status === 'ABSENT' ? '"✕ ขาด (Absent)"' : '"⚠ ลา (Leave)"',
        `"${h.checkedBy || '-'}"`,
        `"${(h.notes || '-').replace(/"/g, '""')}"`,
      ].join(',')),
      `""`,
      `"เกณฑ์การประเมิน: [80% ขึ้นไป = สม่ำเสมอดีเยี่ยม] | [50% - 79% = ปานกลาง] | [ต่ำกว่า 50% = ต้องติดตามใกล้ชิด]"`,
      `"* วันลาที่ได้รับอนุมัติล่วงหน้าจะไม่ถูกนำมาคิดเป็นโทษหรือหักคะแนนความสม่ำเสมอ"`,
    ];

    const fullCsv = bom + lines.join('\r\n');
    const safeFilename = `รายงานนักกีฬา-${athlete.name.replace(/\s+/g, '_')}-${todayStr}.csv`;

    return new NextResponse(fullCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // ==========================================
  // กรณี 2: รายงานสรุปภาพรวมสโมสร (Executive Summary)
  // ==========================================
  const stats = await statsService.getAllAthletesStats(teamId, startDate, endDate);
  const sortedStats = [...stats].sort((a, b) => a.athleteName.localeCompare(b.athleteName, 'th'));

  const sessions = await sessionRepo.findByDateRange(teamId, startDate, endDate);
  const totalSessions = sessions.length;

  let totalPresents = 0;
  let totalAbsents = 0;
  let totalLeaves = 0;
  let activeAthletesCount = 0;

  for (const item of sortedStats) {
    totalPresents += item.presentCount;
    totalAbsents += item.absentCount;
    totalLeaves += item.leaveCount;
    if (item.status === 'ACTIVE') activeAthletesCount++;
  }

  const totalRecorded = totalPresents + totalAbsents + totalLeaves;
  const overallRate = statsService.calculateAttendanceRate(totalPresents, totalRecorded, totalLeaves);

  const lines: string[] = [
    `"รายงานสรุปสถิติการเข้าฝึกซ้อมนักกีฬา (Attendance Summary Report)"`,
    `"สโมสร:","${teamName}"`,
    `"ช่วงเวลาที่รายงาน:","${formatThaiPeriod(startDate, endDate)}"`,
    `"วันที่พิมพ์รายงาน:","${printDateText}"`,
    `""`,
    `"=== สรุปภาพรวมสโมสร (Executive Summary) ==="`,
    `"จำนวนนักกีฬาทั้งหมด:","${sortedStats.length} คน (กำลังฝึกซ้อม ${activeAthletesCount} คน, พักซ้อม ${sortedStats.length - activeAthletesCount} คน)"`,
    `"จำนวนรอบฝึกซ้อมทั้งหมด:","${totalSessions} รอบ"`,
    `"อัตราการเข้าซ้อมเฉลี่ยรวม:","${overallRate}%"`,
    `"สรุปจำนวนการเช็คชื่อ:","มา ${totalPresents} ครั้ง, ขาด ${totalAbsents} ครั้ง, ลา ${totalLeaves} ครั้ง"`,
    `"ผลการประเมินภาพรวมสโมสร:","${getOverallBadge(overallRate, totalRecorded)}"`,
    `""`,
    `"=== ตารางสถิติรายบุคคล (Individual Athletes Attendance) ==="`,
    `"ลำดับ","รหัสนักกีฬา","ชื่อ - นามสกุล","สถานะ","รอบที่บันทึก (ครั้ง)","มา (ครั้ง)","ขาด (ครั้ง)","ลา (ครั้ง)","อัตราเข้าซ้อม (%)","ระดับความสม่ำเสมอ"`,
    ...sortedStats.map((item, idx) => [
      idx + 1,
      `"${item.athleteCode}"`,
      `"${item.athleteName.replace(/"/g, '""')}"`,
      item.status === 'ACTIVE' ? '"ใช้งานปกติ (Active)"' : '"พักซ้อม (Inactive)"',
      item.totalSessions,
      item.presentCount,
      item.absentCount,
      item.leaveCount,
      `"${item.attendanceRate}%"`,
      `"${getEvaluationBadge(item.attendanceRate, item.totalSessions)}"`,
    ].join(',')),
    `""`,
    `"","รวมทั้งสิ้น","${sortedStats.length} คน","Active ${activeAthletesCount} คน","${totalSessions} รอบ","${totalPresents}","${totalAbsents}","${totalLeaves}","${overallRate}%","${getOverallBadge(overallRate, totalRecorded)}"`,
    `""`,
    `"=== คำอธิบายและเกณฑ์การประเมิน ==="`,
    `"🟢 สม่ำเสมอดีเยี่ยม:","อัตราการเข้าซ้อม 80% ขึ้นไป (มีความตั้งใจและวินัยการซ้อมสูง)"`,
    `"🟡 ปานกลาง:","อัตราการเข้าซ้อม 50% - 79% (ควรส่งเสริมให้มาซ้อมอย่างต่อเนื่อง)"`,
    `"🔴 ต้องติดตามใกล้ชิด:","อัตราการเข้าซ้อมต่ำกว่า 50% (ขาดซ้อมบ่อย ต้องพูดคุยกับนักกีฬาหรือผู้ปกครอง)"`,
    `"* หมายเหตุ:","อัตราการเข้าซ้อมคำนวณจาก [มาซ้อม ÷ (รอบทั้งหมด - ลาซ้อม) × 100] โดยการลาซ้อมที่ได้รับอนุมัติล่วงหน้าจะไม่ถูกนำมาหักคะแนน"`,
  ];

  const fullCsv = bom + lines.join('\r\n');
  const safeFilename = `รายงานสรุปการเข้าซ้อม-${teamName.replace(/\s+/g, '_')}-${todayStr}.csv`;

  return new NextResponse(fullCsv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      'Cache-Control': 'no-store',
    },
  });
}
