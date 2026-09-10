import { db } from '../src/server/db/client';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { StatisticsService } from '../src/core/services/statistics.service';
import { getCurrentSession } from '../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../src/server/helpers/default-team';
import { seedRealisticDataAction, clearDemoDataAction } from './actions/seed.actions';
import { autoCloseExpiredSessions } from './actions/session.actions';
import { getBangkokDateTime } from '../src/server/helpers/timezone';
import DashboardView from '../components/DashboardView';

export const dynamic = 'force-dynamic';

function getDateRangeFromPeriod(
  period?: string,
  customStart?: string,
  customEnd?: string
): { startDate?: string; endDate?: string; label: string } {
  const bkk = getBangkokDateTime();
  const todayStr = bkk.dateStr;
  const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

  if (period === 'today') {
    return {
      startDate: todayStr,
      endDate: todayStr,
      label: 'วันนี้',
    };
  }

  if (period === 'last_7_days') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    const start = d.toISOString().split('T')[0];
    return {
      startDate: start,
      endDate: todayStr,
      label: '7 วันล่าสุด',
    };
  }

  if (period === 'this_week') {
    const d = new Date();
    const day = d.getDay();
    const diffToMon = (day === 0 ? -6 : 1) - day;
    const mon = new Date(d);
    mon.setDate(d.getDate() + diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return {
      startDate: mon.toISOString().split('T')[0],
      endDate: sun.toISOString().split('T')[0],
      label: 'สัปดาห์นี้',
    };
  }

  if (period === 'this_month') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    return {
      startDate: start,
      endDate: end,
      label: `เดือนนี้ (${thMonths[month]} ${year + 543})`,
    };
  }

  if (period === 'last_month') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const start = firstDay.toISOString().split('T')[0];
    const end = lastDay.toISOString().split('T')[0];
    const prevMonth = (month - 1 + 12) % 12;
    const prevYear = month === 0 ? year - 1 : year;
    return {
      startDate: start,
      endDate: end,
      label: `เดือนที่แล้ว (${thMonths[prevMonth]} ${prevYear + 543})`,
    };
  }

  if (period === 'last_3_months') {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    const start = d.toISOString().split('T')[0];
    return {
      startDate: start,
      endDate: todayStr,
      label: '3 เดือนล่าสุด',
    };
  }

  if (period === 'custom' && customStart && customEnd) {
    return {
      startDate: customStart,
      endDate: customEnd,
      label: `${customStart} ถึง ${customEnd}`,
    };
  }

  return {
    startDate: undefined,
    endDate: undefined,
    label: 'ตลอดเวลาทั้งหมด',
  };
}

interface DashboardPageProps {
  searchParams: Promise<{ period?: string; startDate?: string; endDate?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { period, startDate: queryStart, endDate: queryEnd } = await searchParams;
  const { startDate, endDate, label: periodLabel } = getDateRangeFromPeriod(period, queryStart, queryEnd);

  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;

  // ตรวจสอบและตัดยอดรอบซ้อมที่หมดเวลาแล้วโดยอัตโนมัติ
  await autoCloseExpiredSessions(teamId);

  const athleteRepo = new AthleteRepository(db);
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);
  const statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);

  const [dashboard, allAthletesStats] = await Promise.all([
    statsService.getDashboardSummary(teamId, startDate, endDate),
    statsService.getAllAthletesStats(teamId, startDate, endDate),
  ]);

  return (
    <DashboardView
      dashboard={dashboard}
      allAthletesStats={allAthletesStats}
      period={period}
      periodLabel={periodLabel}
      startDate={startDate}
      endDate={endDate}
      teamName={session.team ? session.team.name : 'สโมสร'}
      isAdmin={session.isAdmin}
      seedRealisticDataAction={seedRealisticDataAction}
      clearDemoDataAction={clearDemoDataAction}
    />
  );
}
