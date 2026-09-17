import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { db } from '../../../../src/server/db/client';
import { AthleteRepository } from '../../../../src/server/repositories/athlete.repo';
import { SessionRepository } from '../../../../src/server/repositories/session.repo';
import { AttendanceRepository } from '../../../../src/server/repositories/attendance.repo';
import { StatisticsService } from '../../../../src/core/services/statistics.service';
import { getCurrentSession } from '../../../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../../../src/server/helpers/default-team';

export const dynamic = 'force-dynamic';

function formatThaiPeriod(startDate?: string, endDate?: string): string {
  if (!startDate || !endDate) return 'ข้อมูลทั้งหมดตั้งแต่เริ่มระบบ (All Time)';
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  if (sYear === eYear && sMonth === eMonth && sDay === 1) {
    return `ประจำเดือน ${thaiMonths[sMonth - 1]} พ.ศ. ${sYear + 543}`;
  }
  if (sYear === eYear && sMonth === 1 && sDay === 1 && eMonth === 12 && eDay === 31) {
    return `ประจำปี พ.ศ. ${sYear + 543} (ค.ศ. ${sYear})`;
  }
  if (startDate === endDate) {
    return `ประจำวันที่ ${sDay} ${thaiMonths[sMonth - 1]} พ.ศ. ${sYear + 543}`;
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
  if (rate >= 85) return 'เกรด A (ยอดเยี่ยม วินัยสูงมาก)';
  if (rate >= 75) return 'เกรด B+ (ดีมาก สม่ำเสมอต่อเนื่อง)';
  if (rate >= 60) return 'เกรด B (มาตรฐานปกติ)';
  if (rate >= 50) return 'เกรด C (ปานกลาง ควรติดตาม)';
  return 'เกรด D (ต้องติดตามเร่งด่วน ขาดบ่อย)';
}

// Styling Constants
const FONT_FAMILY = 'Tahoma';
const COLOR_PRIMARY = '0F172A'; // Slate 900
const COLOR_HEADER_FILL = '1E293B'; // Slate 800
const COLOR_ACCENT_GREEN = '065F46'; // Emerald 800
const COLOR_ZEBRA = 'F8FAFC'; // Slate 50
const COLOR_BORDER = 'E2E8F0'; // Slate 200

function applyHeaderStyle(row: ExcelJS.Row, bgArgb = COLOR_HEADER_FILL) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgArgb },
    };
    cell.font = {
      name: FONT_FAMILY,
      size: 10,
      bold: true,
      color: { argb: 'FFFFFF' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'medium', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  });
}

function applyDataStyle(row: ExcelJS.Row, isEven: boolean) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { name: FONT_FAMILY, size: 9.5 };
    cell.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } },
    };
    if (isEven) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLOR_ZEBRA },
      };
    }
    cell.alignment = { vertical: 'middle' };
  });
}

function autoFitColumns(sheet: ExcelJS.Worksheet, minWidth = 12) {
  sheet.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value ? String(cell.value) : '';
      // Thai characters take normal visual width but multi-byte
      const len = val.length;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.max(minWidth, maxLen + 4);
  });
}

export async function GET(request: Request) {
  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;
  const teamName = session.team?.name || 'สโมสร';

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'xlsx';
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

  // ==========================================
  // กรณี 1: รายงานสถิติรายบุคคล (Individual Slip)
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
    const attendanceRate = totalSessions > 0 ? statsService.calculateAttendanceRate(presentCount, totalSessions, leaveCount) : 0;

    // 1.1 ส่งออกเป็น CSV (กรณีระบุ format=csv)
    if (format === 'csv') {
      const bom = '\uFEFF';
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

    // 1.2 ส่งออกเป็น Excel .xlsx แท้ (Default)
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WAVON Athlete Attendance System';
    workbook.created = now;

    const sheet = workbook.addWorksheet('ใบบันทึกสถิตินักกีฬา');
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 14 }];

    // หัวกระดาษ
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'รายงานสรุปสถิติการฝึกซ้อมรายบุคคล (Individual Attendance Slip)';
    titleCell.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 36;

    // ข้อมูลนักกีฬา
    const metaRows = [
      ['สโมสร / ต้นสังกัด:', teamName, 'วันที่เริ่มเข้าสังกัด:', athlete.startDate],
      ['ชื่อ - นามสกุล:', athlete.name, 'สถานะปัจจุบัน:', athlete.status === 'ACTIVE' ? 'ใช้งานปกติ (Active)' : 'พักการซ้อม (Inactive)'],
      ['รหัสนักกีฬา:', athlete.athleteCode, 'เบอร์โทรศัพท์:', athlete.phone || '-'],
      ['ช่วงเวลาที่รายงาน:', formatThaiPeriod(startDate, endDate), 'วันที่ออกรายงาน:', printDateText],
    ];

    metaRows.forEach((row, i) => {
      const r = sheet.getRow(3 + i);
      r.height = 20;
      r.getCell(1).value = row[0];
      r.getCell(1).font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: '475569' } };
      r.getCell(2).value = row[1];
      r.getCell(2).font = { name: FONT_FAMILY, size: 10, bold: true };

      r.getCell(4).value = row[2];
      r.getCell(4).font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: '475569' } };
      r.getCell(5).value = row[3];
      r.getCell(5).font = { name: FONT_FAMILY, size: 9.5 };
    });

    // บัตร KPI Card สรุปผล
    sheet.mergeCells('A8:F8');
    const kpiHeader = sheet.getCell('A8');
    kpiHeader.value = 'สรุปสถิติความสม่ำเสมอในการฝึกซ้อม (Attendance KPI)';
    kpiHeader.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFF' } };
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT_GREEN } };
    kpiHeader.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(8).height = 24;

    const kpiDataRow = sheet.getRow(9);
    kpiDataRow.height = 28;
    kpiDataRow.getCell(1).value = 'รอบทั้งหมด';
    kpiDataRow.getCell(2).value = 'มา (Present)';
    kpiDataRow.getCell(3).value = 'ขาด (Absent)';
    kpiDataRow.getCell(4).value = 'ลา (Leave)';
    kpiDataRow.getCell(5).value = 'ความสม่ำเสมอ (%)';
    kpiDataRow.getCell(6).value = 'ผลการประเมิน';
    kpiDataRow.eachCell((c) => {
      c.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: '475569' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
    });

    const kpiValRow = sheet.getRow(10);
    kpiValRow.height = 32;
    kpiValRow.getCell(1).value = totalSessions;
    kpiValRow.getCell(2).value = presentCount;
    kpiValRow.getCell(3).value = absentCount;
    kpiValRow.getCell(4).value = leaveCount;
    kpiValRow.getCell(5).value = attendanceRate / 100;
    kpiValRow.getCell(5).numFmt = '0.0%';
    kpiValRow.getCell(6).value = getEvaluationBadge(attendanceRate, totalSessions);
    kpiValRow.eachCell((c) => {
      c.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: COLOR_PRIMARY } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.border = {
        top: { style: 'thin', color: { argb: COLOR_BORDER } },
        left: { style: 'thin', color: { argb: COLOR_BORDER } },
        bottom: { style: 'medium', color: { argb: '94A3B8' } },
        right: { style: 'thin', color: { argb: COLOR_BORDER } },
      };
    });

    // ตารางไทม์ไลน์รอบซ้อม
    const tableHeaderRow = sheet.getRow(13);
    tableHeaderRow.getCell(1).value = 'ลำดับ';
    tableHeaderRow.getCell(2).value = 'วันที่ซ้อม';
    tableHeaderRow.getCell(3).value = 'หัวข้อรอบการฝึกซ้อม';
    tableHeaderRow.getCell(4).value = 'สถานะการเข้าซ้อม';
    tableHeaderRow.getCell(5).value = 'ผู้บันทึก';
    tableHeaderRow.getCell(6).value = 'หมายเหตุ / เหตุผลการลา';
    applyHeaderStyle(tableHeaderRow);

    history.forEach((h, idx) => {
      const row = sheet.getRow(14 + idx);
      const isEven = idx % 2 === 1;
      row.getCell(1).value = idx + 1;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).value = h.sessionDate;
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(3).value = h.sessionTitle;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
      
      const statusCell = row.getCell(4);
      if (h.status === 'PRESENT') {
        statusCell.value = '✓ มาซ้อม (Present)';
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        statusCell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: '166534' } };
      } else if (h.status === 'ABSENT') {
        statusCell.value = '✕ ขาดซ้อม (Absent)';
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
        statusCell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: '991B1B' } };
      } else {
        statusCell.value = '⚠ ลาซ้อม (Leave)';
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9C3' } };
        statusCell.font = { name: FONT_FAMILY, size: 9.5, bold: true, color: { argb: '854D0E' } };
      }
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(5).value = h.checkedBy || '-';
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).value = h.notes || '-';
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left' };

      applyDataStyle(row, isEven);
    });

    autoFitColumns(sheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const safeFilename = `ใบบันทึกสถิตินักกีฬา-${athlete.name.replace(/\s+/g, '_')}-${todayStr}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // ==========================================
  // กรณี 2: รายงานภาพรวมสโมสร (Club Master Report)
  // ==========================================
  const [stats, sessions, dailyStats, monthlyStats, yearlyStats] = await Promise.all([
    statsService.getAllAthletesStats(teamId, startDate, endDate),
    sessionRepo.findByDateRange(teamId, startDate, endDate),
    statsService.getDailyStats(teamId, startDate || '2000-01-01', endDate || '2099-12-31'),
    statsService.getMonthlyStats(teamId, startDate, endDate),
    statsService.getYearlyStats(teamId, startDate, endDate),
  ]);

  const sortedStats = [...stats].sort((a, b) => a.athleteName.localeCompare(b.athleteName, 'th'));
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

  // 2.1 ส่งออกเป็น CSV (กรณีระบุ format=csv)
  if (format === 'csv') {
    const bom = '\uFEFF';
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
      `"=== สรุปแยกตามปี (Yearly Summary) ==="`,
      `"ปี (พ.ศ. / ค.ศ.)","รอบการซ้อม","มา (ครั้ง)","ขาด (ครั้ง)","ลา (ครั้ง)","อัตราการมาซ้อม (%)"`,
      ...yearlyStats.map((y) => [
        `"พ.ศ. ${Number(y.period) + 543} (${y.period})"`,
        y.totalSessions,
        y.presentCount,
        y.absentCount,
        y.leaveCount,
        `"${y.attendanceRate}%"`
      ].join(',')),
      `""`,
      `"=== สรุปแยกตามเดือน (Monthly Summary) ==="`,
      `"เดือน - ปี","รอบการซ้อม","มา (ครั้ง)","ขาด (ครั้ง)","ลา (ครั้ง)","อัตราการมาซ้อม (%)"`,
      ...monthlyStats.map((m) => [
        `"${m.period}"`,
        m.totalSessions,
        m.presentCount,
        m.absentCount,
        m.leaveCount,
        `"${m.attendanceRate}%"`
      ].join(',')),
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

  // 2.2 ส่งออกเป็น Excel .xlsx แบบแยกแผ่นงาน (Multi-Sheet Master Workbook)
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WAVON Athlete Attendance System';
  workbook.created = now;

  // ==========================================
  // แผ่นงานที่ 1: ภาพรวมสโมสร (Overview & KPIs)
  // ==========================================
  const sheetOverview = workbook.addWorksheet('ภาพรวมสโมสร');
  sheetOverview.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  sheetOverview.mergeCells('A1:F1');
  const title1 = sheetOverview.getCell('A1');
  title1.value = `รายงานสรุปสถิติการฝึกซ้อมกีฬา — ${teamName}`;
  title1.font = { name: FONT_FAMILY, size: 14, bold: true, color: { argb: 'FFFFFF' } };
  title1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  title1.alignment = { vertical: 'middle', horizontal: 'center' };
  sheetOverview.getRow(1).height = 36;

  sheetOverview.mergeCells('A2:F2');
  const subtitle1 = sheetOverview.getCell('A2');
  subtitle1.value = `ช่วงเวลาที่รายงาน: ${formatThaiPeriod(startDate, endDate)} | วันที่ออกรายงาน: ${printDateText}`;
  subtitle1.font = { name: FONT_FAMILY, size: 9.5, italic: true, color: { argb: 'E2E8F0' } };
  subtitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
  subtitle1.alignment = { vertical: 'middle', horizontal: 'center' };
  sheetOverview.getRow(2).height = 22;

  // สรุป KPI การฝึกซ้อม
  sheetOverview.mergeCells('A4:F4');
  const kpiTitle = sheetOverview.getCell('A4');
  kpiTitle.value = 'ดัชนีชี้วัดความพร้อมของทีม (Executive Attendance KPIs)';
  kpiTitle.font = { name: FONT_FAMILY, size: 10.5, bold: true, color: { argb: 'FFFFFF' } };
  kpiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ACCENT_GREEN } };
  kpiTitle.alignment = { vertical: 'middle', indent: 1 };
  sheetOverview.getRow(4).height = 24;

  const kpiCols = [
    'จำนวนนักกีฬาทั้งหมด',
    'นักกีฬาปกติ (Active)',
    'จำนวนรอบซ้อมทั้งหมด',
    'ยอดมาซ้อม (Present)',
    'ยอดขาดซ้อม (Absent)',
    'อัตราเข้าซ้อมเฉลี่ยรวม',
  ];
  const r5 = sheetOverview.getRow(5);
  r5.height = 26;
  kpiCols.forEach((col, idx) => {
    r5.getCell(idx + 1).value = col;
    r5.getCell(idx + 1).font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: '475569' } };
    r5.getCell(idx + 1).alignment = { vertical: 'middle', horizontal: 'center' };
    r5.getCell(idx + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
  });

  const r6 = sheetOverview.getRow(6);
  r6.height = 34;
  r6.getCell(1).value = `${sortedStats.length} คน`;
  r6.getCell(2).value = `${activeAthletesCount} คน`;
  r6.getCell(3).value = `${totalSessions} รอบ`;
  r6.getCell(4).value = `${totalPresents} ครั้ง`;
  r6.getCell(5).value = `${totalAbsents} ครั้ง`;
  r6.getCell(6).value = overallRate / 100;
  r6.getCell(6).numFmt = '0.0%';
  r6.eachCell((c) => {
    c.font = { name: FONT_FAMILY, size: 13, bold: true, color: { argb: COLOR_PRIMARY } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      bottom: { style: 'medium', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } },
    };
  });

  // ผลการประเมินสโมสร
  sheetOverview.mergeCells('A8:F8');
  const gradeRow = sheetOverview.getCell('A8');
  gradeRow.value = `ผลการประเมินวินัยสโมสร: ${getOverallBadge(overallRate, totalRecorded)} (การลาซ้อมที่ถูกต้อง ${totalLeaves} ครั้ง ไม่ถูกหักคะแนน)`;
  gradeRow.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: '065F46' } };
  gradeRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
  gradeRow.alignment = { vertical: 'middle', horizontal: 'center' };
  sheetOverview.getRow(8).height = 28;

  // ตารางสรุปรายปีในหน้าแรก
  sheetOverview.mergeCells('A10:F10');
  const yearlyTitle = sheetOverview.getCell('A10');
  yearlyTitle.value = 'สรุปแนวโน้มสถิติแยกตามปี (Yearly Attendance Breakdown)';
  yearlyTitle.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFF' } };
  yearlyTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
  yearlyTitle.alignment = { vertical: 'middle', indent: 1 };
  sheetOverview.getRow(10).height = 24;

  const yHeader = sheetOverview.getRow(11);
  yHeader.getCell(1).value = 'ปี (ค.ศ. / พ.ศ.)';
  yHeader.getCell(2).value = 'จำนวนรอบซ้อม';
  yHeader.getCell(3).value = 'มา (Present)';
  yHeader.getCell(4).value = 'ขาด (Absent)';
  yHeader.getCell(5).value = 'ลา (Leave)';
  yHeader.getCell(6).value = 'ความสม่ำเสมอ (%)';
  applyHeaderStyle(yHeader, '334155');

  yearlyStats.forEach((y, i) => {
    const yrRow = sheetOverview.getRow(12 + i);
    const isEven = i % 2 === 1;
    yrRow.getCell(1).value = `พ.ศ. ${Number(y.period) + 543} (${y.period})`;
    yrRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    yrRow.getCell(2).value = y.totalSessions;
    yrRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    yrRow.getCell(3).value = y.presentCount;
    yrRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    yrRow.getCell(4).value = y.absentCount;
    yrRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    yrRow.getCell(5).value = y.leaveCount;
    yrRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    yrRow.getCell(6).value = y.attendanceRate / 100;
    yrRow.getCell(6).numFmt = '0.0%';
    yrRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    applyDataStyle(yrRow, isEven);
  });

  autoFitColumns(sheetOverview);

  // ==========================================
  // แผ่นงานที่ 2: สรุปรายเดือน (Monthly Summary)
  // ==========================================
  const sheetMonthly = workbook.addWorksheet('สรุปรายเดือน');
  sheetMonthly.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  sheetMonthly.mergeCells('A1:G1');
  const title2 = sheetMonthly.getCell('A1');
  title2.value = `สถิติการเข้าฝึกซ้อมแยกรายเดือน (Monthly Breakdown) — ${teamName}`;
  title2.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  title2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  title2.alignment = { vertical: 'middle', horizontal: 'center' };
  sheetMonthly.getRow(1).height = 32;

  const mHeader = sheetMonthly.getRow(2);
  mHeader.getCell(1).value = 'ลำดับ';
  mHeader.getCell(2).value = 'เดือน - ปี (Month-Year)';
  mHeader.getCell(3).value = 'รอบการซ้อม (รอบ)';
  mHeader.getCell(4).value = 'มา (ครั้ง)';
  mHeader.getCell(5).value = 'ขาด (ครั้ง)';
  mHeader.getCell(6).value = 'ลา (ครั้ง)';
  mHeader.getCell(7).value = 'อัตราการมาซ้อม (%)';
  applyHeaderStyle(mHeader);

  monthlyStats.forEach((m, idx) => {
    const row = sheetMonthly.getRow(3 + idx);
    const isEven = idx % 2 === 1;
    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Format Month Thai text
    const [yStr, mStr] = m.period.split('-');
    const mNum = Number(mStr);
    const yNum = Number(yStr);
    const thaiMonthFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ][mNum - 1] || m.period;

    row.getCell(2).value = `${thaiMonthFull} ${yNum + 543} (${m.period})`;
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).value = m.totalSessions;
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).value = m.presentCount;
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).value = m.absentCount;
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).value = m.leaveCount;
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(7).value = m.attendanceRate / 100;
    row.getCell(7).numFmt = '0.0%';
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

    applyDataStyle(row, isEven);
  });

  autoFitColumns(sheetMonthly);

  // ==========================================
  // แผ่นงานที่ 3: สรุปรายวัน / รอบซ้อม (Daily Sessions)
  // ==========================================
  const sheetDaily = workbook.addWorksheet('สรุปรายวัน');
  sheetDaily.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  sheetDaily.mergeCells('A1:G1');
  const title3 = sheetDaily.getCell('A1');
  title3.value = `ประวัติการฝึกซ้อมแยกแต่ละรอบ (Daily Sessions Log) — ${teamName}`;
  title3.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  title3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  title3.alignment = { vertical: 'middle', horizontal: 'center' };
  sheetDaily.getRow(1).height = 32;

  const dHeader = sheetDaily.getRow(2);
  dHeader.getCell(1).value = 'ลำดับ';
  dHeader.getCell(2).value = 'วันที่ฝึกซ้อม';
  dHeader.getCell(3).value = 'จำนวนรอบซ้อมในวัน';
  dHeader.getCell(4).value = 'มา (คน)';
  dHeader.getCell(5).value = 'ขาด (คน)';
  dHeader.getCell(6).value = 'ลา (คน)';
  dHeader.getCell(7).value = 'อัตราการมาซ้อม (%)';
  applyHeaderStyle(dHeader);

  dailyStats.forEach((d, idx) => {
    const row = sheetDaily.getRow(3 + idx);
    const isEven = idx % 2 === 1;
    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = d.period;
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).value = d.totalSessions;
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).value = d.presentCount;
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).value = d.absentCount;
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).value = d.leaveCount;
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(7).value = d.attendanceRate / 100;
    row.getCell(7).numFmt = '0.0%';
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };

    applyDataStyle(row, isEven);
  });

  autoFitColumns(sheetDaily);

  // ==========================================
  // แผ่นงานที่ 4: สถิตินักกีฬารายบุคคล (Athletes Roster)
  // ==========================================
  const sheetRoster = workbook.addWorksheet('สถิตินักกีฬารายบุคคล');
  sheetRoster.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

  sheetRoster.mergeCells('A1:J1');
  const title4 = sheetRoster.getCell('A1');
  title4.value = `ตารางสถิติและผลการประเมินนักกีฬารายบุคคล — ${teamName}`;
  title4.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FFFFFF' } };
  title4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
  title4.alignment = { vertical: 'middle', horizontal: 'center' };
  sheetRoster.getRow(1).height = 32;

  const rHeader = sheetRoster.getRow(2);
  rHeader.getCell(1).value = 'ลำดับ';
  rHeader.getCell(2).value = 'รหัสนักกีฬา';
  rHeader.getCell(3).value = 'ชื่อ - นามสกุล';
  rHeader.getCell(4).value = 'สถานะนักกีฬา';
  rHeader.getCell(5).value = 'รอบที่บันทึก (ครั้ง)';
  rHeader.getCell(6).value = 'มา (ครั้ง)';
  rHeader.getCell(7).value = 'ขาด (ครั้ง)';
  rHeader.getCell(8).value = 'ลา (ครั้ง)';
  rHeader.getCell(9).value = 'อัตราการเข้าซ้อม (%)';
  rHeader.getCell(10).value = 'ระดับวินัยและความสม่ำเสมอ';
  applyHeaderStyle(rHeader);

  sortedStats.forEach((item, idx) => {
    const row = sheetRoster.getRow(3 + idx);
    const isEven = idx % 2 === 1;

    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = item.athleteCode;
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).value = item.athleteName;
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(4).value = item.status === 'ACTIVE' ? 'ใช้งานปกติ (Active)' : 'พักซ้อม (Inactive)';
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).value = item.totalSessions;
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(6).value = item.presentCount;
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(7).value = item.absentCount;
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(8).value = item.leaveCount;
    row.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(9).value = item.attendanceRate / 100;
    row.getCell(9).numFmt = '0.0%';
    row.getCell(9).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(10).value = getEvaluationBadge(item.attendanceRate, item.totalSessions);
    row.getCell(10).alignment = { vertical: 'middle', horizontal: 'left' };

    applyDataStyle(row, isEven);
  });

  // แถวสรุปผลรวมท้ายตาราง
  const totalRowIndex = 3 + sortedStats.length;
  const totalRow = sheetRoster.getRow(totalRowIndex);
  totalRow.height = 26;
  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = 'รวมทั้งหมด';
  totalRow.getCell(3).value = `${sortedStats.length} คน`;
  totalRow.getCell(4).value = `Active ${activeAthletesCount} คน`;
  totalRow.getCell(5).value = totalSessions;
  totalRow.getCell(6).value = totalPresents;
  totalRow.getCell(7).value = totalAbsents;
  totalRow.getCell(8).value = totalLeaves;
  totalRow.getCell(9).value = overallRate / 100;
  totalRow.getCell(9).numFmt = '0.0%';
  totalRow.getCell(10).value = getOverallBadge(overallRate, totalRecorded);

  totalRow.eachCell((c) => {
    c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_HEADER_FILL } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '94A3B8' } },
    };
  });

  autoFitColumns(sheetRoster);

  const buffer = await workbook.xlsx.writeBuffer();
  const safeFilename = `รายงานสรุปสถิติการฝึกซ้อม-${teamName.replace(/\s+/g, '_')}-${todayStr}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
      'Cache-Control': 'no-store',
    },
  });
}
