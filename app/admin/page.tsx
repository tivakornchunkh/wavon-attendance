import { redirect } from 'next/navigation';
import { db } from '../../src/server/db/client';
import { teams, users, athletes, trainingSessions } from '../../src/server/db/schema';
import { eq, count } from 'drizzle-orm';
import { getCurrentSession } from '../../src/server/helpers/auth';
import { createClubAction, switchClubAction } from '../actions/auth.actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getCurrentSession();

  if (!session.isAdmin) {
    redirect('/');
  }

  const allTeams = await db.select().from(teams);

  const teamsData = await Promise.all(
    allTeams.map(async (t) => {
      const [athleteCount] = await db
        .select({ value: count() })
        .from(athletes)
        .where(eq(athletes.teamId, t.id));

      const [sessionCount] = await db
        .select({ value: count() })
        .from(trainingSessions)
        .where(eq(trainingSessions.teamId, t.id));

      const [coach] = await db
        .select()
        .from(users)
        .where(eq(users.teamId, t.id))
        .limit(1);

      return {
        ...t,
        athleteCount: athleteCount?.value || 0,
        sessionCount: sessionCount?.value || 0,
        coachName: coach?.name || 'ยังไม่กำหนด',
        coachUsername: coach?.username || '-',
      };
    })
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Admin Header Hero */}
      <div className="bg-[#0F1115] text-white rounded-2xl p-5 sm:p-7 shadow-md border border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-zinc-950">
              👑 ADMIN CONSOLE
            </span>
            <span className="text-xs text-zinc-400">ภาพรวมระบบทุกสโมสร</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            แผงควบคุมและจัดการสโมสร
          </h1>
          <p className="mt-1.5 text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
            สร้างสโมสรใหม่ กำหนดผู้ดูแลประจำสโมสร และสลับเข้าดูมุมมองของแต่ละสโมสรได้อย่างอิสระ
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-center">
            <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">สโมสรทั้งหมด</p>
            <p className="text-2xl font-black text-white mt-0.5">{allTeams.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* All Clubs Cards Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <span>⚽</span>
              <span>สโมสรในระบบทั้งหมด ({teamsData.length})</span>
            </h2>
            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
              แตะ &quot;สลับเข้าดู&quot; เพื่อเปลี่ยนสโมสร
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamsData.map((team) => {
              const isCurrentlyActive = session.team?.id === team.id;
              return (
                <div
                  key={team.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                    isCurrentlyActive
                      ? 'border-zinc-900 ring-2 ring-zinc-900/10'
                      : 'border-zinc-200/80 hover:border-zinc-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-black text-base text-zinc-900 truncate">
                        {team.name}
                      </h3>
                      {isCurrentlyActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                          ● กำลังดูอยู่นี้
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1.5">
                      <span>👤 โค้ชผู้ดูแล:</span>
                      <strong className="text-zinc-800">{team.coachName}</strong>
                      <span className="text-[10px] text-zinc-400 font-mono">({team.coachUsername})</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100 text-center">
                      <div className="bg-zinc-50 rounded-xl p-2">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">นักกีฬา</p>
                        <p className="text-base font-black text-zinc-900">{team.athleteCount} คน</p>
                      </div>
                      <div className="bg-zinc-50 rounded-xl p-2">
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">รอบซ้อม</p>
                        <p className="text-base font-black text-zinc-900">{team.sessionCount} รอบ</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100">
                    {isCurrentlyActive ? (
                      <span className="w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-500 text-xs font-bold text-center block">
                        กำลังเลือกใช้งานสโมสรนี้
                      </span>
                    ) : (
                      <form action={switchClubAction.bind(null, team.id)}>
                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white text-xs font-bold transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
                        >
                          <span>🚀 สลับเข้าดูสโมสรนี้</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Club Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24">
            <h2 className="text-base font-black text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              <span>สร้างสโมสรใหม่</span>
            </h2>

            <form action={createClubAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  ชื่อสโมสร / ทีม <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="clubName"
                  required
                  placeholder="เช่น BANGKOK UNITED"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  ชื่อโค้ชประจำสโมสร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="coachName"
                  required
                  placeholder="เช่น โค้ชธงชัย"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Username โค้ช <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="coachUsername"
                  required
                  placeholder="เช่น coach_thong"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  รหัสผ่านเริ่มต้น <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="coachPassword"
                  required
                  defaultValue="pass1234"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white font-mono min-h-[44px]"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  ค่าเริ่มต้น: <code>pass1234</code>
                </span>
              </div>

              <button
                type="submit"
                className="w-full mt-2 px-4 py-3 bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>+ บันทึกสร้างสโมสร</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
