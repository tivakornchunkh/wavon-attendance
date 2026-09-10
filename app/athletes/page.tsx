import { db } from '../../src/server/db/client';
import { AthleteRepository } from '../../src/server/repositories/athlete.repo';
import { AthleteService } from '../../src/core/services/athlete.service';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import AddAthleteForm from './AddAthleteForm';
import AthletesList from './AthletesList';

export const dynamic = 'force-dynamic';

export default async function AthletesPage() {
  const session = await getCurrentSession();
  const teamId = session.team?.id || DEFAULT_TEAM_ID;
  const athleteRepo = new AthleteRepository(db);
  const athleteService = new AthleteService(athleteRepo);

  const athletesList = await athleteService.getAthletes(teamId);
  const activeCount = athletesList.filter((a) => a.status === 'ACTIVE').length;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-200/80 text-zinc-700">
              ROSTER
            </span>
            <span className="text-xs text-zinc-500 font-medium">
              สโมสร {session.team ? session.team.name : ''}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 mt-1">
            ทะเบียนรายชื่อนักกีฬา
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            ลงทะเบียนนักกีฬา ตรวจสอบสถานะการเข้าซ้อม และดูโปรไฟล์ประวัติการฝึกซ้อม
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Active: {activeCount} คน
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
            ทั้งหมด: {athletesList.length} คน
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Form: Add New Athlete */}
        <div className="lg:col-span-1">
          <AddAthleteForm todayStr={todayStr} />
        </div>

        {/* List & Search Toolbar */}
        <div className="lg:col-span-2">
          <AthletesList initialAthletes={athletesList} />
        </div>
      </div>
    </div>
  );
}
