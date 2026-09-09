import { db } from '../../src/server/db/client';
import { AthleteRepository } from '../../src/server/repositories/athlete.repo';
import { AthleteService } from '../../src/core/services/athlete.service';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { DEFAULT_TEAM_ID } from '../../src/server/helpers/default-team';
import { createAthleteAction } from '../actions/athlete.actions';
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
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24">
            <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <span>เพิ่มนักกีฬาใหม่</span>
            </h2>

            <form action={createAthleteAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="เช่น สมชาย วิ่งเร็ว"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  รหัสนักกีฬา (Athlete Code)
                </label>
                <input
                  type="text"
                  name="athleteCode"
                  placeholder="เว้นว่างไว้เพื่อรัน ATH-001 อัตโนมัติ"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white placeholder:text-zinc-400 min-h-[44px]"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  กำหนดเองได้ เช่น เบอร์เสื้อ "10" หรือรหัสบัตร
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  เบอร์โทรศัพท์ (ถ้ามี)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="เช่น 081-234-5678"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  วันที่เริ่มเข้าทีม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  defaultValue={todayStr}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 bg-white min-h-[44px]"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  * ใช้กำหนดสิทธิ์เข้าซ้อม (จะไม่ปรากฏในรอบซ้อมที่จัดก่อนวันที่นี้)
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-3 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>+ บันทึกเพิ่มนักกีฬา</span>
              </button>
            </form>
          </div>
        </div>

        {/* List & Search Toolbar */}
        <div className="lg:col-span-2">
          <AthletesList initialAthletes={athletesList} />
        </div>
      </div>
    </div>
  );
}
