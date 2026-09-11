'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Athlete } from '../../src/core/domain/athlete';
import { toggleAthleteStatusAction, deleteAthleteAction } from '../actions/athlete.actions';

interface AthletesListProps {
  initialAthletes: Athlete[];
}

type SortField = 'name' | 'code' | 'startDate';
type SortOrder = 'asc' | 'desc';

export default function AthletesList({ initialAthletes }: AthletesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...initialAthletes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.athleteCode.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((a) => a.status === statusFilter);
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'th');
      } else if (sortField === 'code') {
        cmp = a.athleteCode.localeCompare(b.athleteCode, 'th');
      } else if (sortField === 'startDate') {
        cmp = a.startDate.localeCompare(b.startDate);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [initialAthletes, searchQuery, statusFilter, sortField, sortOrder]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
      {/* Header & Status Filter Pills */}
      <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-zinc-900">
            รายชื่อนักกีฬา ({filteredAndSorted.length} / {initialAthletes.length})
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">แตะที่ชื่อนักกีฬาเพื่อดูสถิติและประวัติการซ้อม</p>
        </div>

        {/* Status Pills (Touch target 40px) */}
        <div className="flex items-center gap-1 bg-zinc-200/60 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition min-h-[36px] cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition min-h-[36px] cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition min-h-[36px] cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-white text-zinc-900 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ค้นหาตามชื่อ หรือรหัสนักกีฬา..."
            className="w-full pl-3.5 pr-9 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 min-h-[42px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 w-6 h-6 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end flex-wrap">
          <span className="text-[11px] text-zinc-400 font-medium">จัดเรียง:</span>
          <button
            type="button"
            onClick={() => toggleSort('name')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 min-h-[40px] ${
              sortField === 'name'
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <span>ชื่อ ก-ฮ</span>
            <span>{sortField === 'name' ? (sortOrder === 'asc' ? '↓' : '↑') : ''}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleSort('code')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 min-h-[40px] ${
              sortField === 'code'
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <span>รหัส</span>
            <span>{sortField === 'code' ? (sortOrder === 'asc' ? '↓' : '↑') : ''}</span>
          </button>
        </div>
      </div>

      {/* Athletes List / Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-14 px-4">
          <p className="text-sm text-zinc-600 font-bold">ไม่พบนักกีฬาที่ตรงกับเงื่อนไข</p>
          <p className="text-xs text-zinc-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดรีเซ็ตตัวกรอง</p>
        </div>
      ) : (
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs sm:text-sm text-zinc-600 whitespace-nowrap">
            <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-5 sm:px-6 py-3">รหัส</th>
                <th className="px-5 sm:px-6 py-3">ชื่อ - นามสกุล</th>
                <th className="px-5 sm:px-6 py-3">เบอร์โทร</th>
                <th className="px-5 sm:px-6 py-3">วันที่เริ่ม</th>
                <th className="px-5 sm:px-6 py-3">สถานะ</th>
                <th className="px-5 sm:px-6 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredAndSorted.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-zinc-50/80 transition">
                  <td className="px-5 sm:px-6 py-4 font-mono font-bold text-zinc-700">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-xs">
                      {athlete.athleteCode}
                    </span>
                  </td>
                  <td className="px-5 sm:px-6 py-4 font-bold text-zinc-900">
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <span>{athlete.name}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">&rarr;</span>
                    </Link>
                  </td>
                  <td className="px-5 sm:px-6 py-4 text-zinc-500 text-xs">{athlete.phone || '-'}</td>
                  <td className="px-5 sm:px-6 py-4 text-zinc-500 text-xs">{athlete.startDate}</td>
                  <td className="px-5 sm:px-6 py-4">
                    {athlete.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        ● Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600">
                        ○ Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <form
                        action={async () => {
                          await toggleAthleteStatusAction(athlete.id, athlete.status);
                        }}
                      >
                        <button
                          type="submit"
                          className={`text-xs px-2.5 py-1.5 rounded-xl border font-bold transition cursor-pointer min-h-[36px] ${
                            athlete.status === 'ACTIVE'
                              ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100'
                          }`}
                        >
                          {athlete.status === 'ACTIVE' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </button>
                      </form>

                      <button
                        type="button"
                        onClick={() => setAthleteToDelete(athlete)}
                        className="text-xs px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 font-bold transition cursor-pointer min-h-[36px]"
                        title="ลบนักกีฬา"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {athleteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-3">
              ⚠️
            </div>

            <h3 className="text-base sm:text-lg font-black text-zinc-900 text-center">
              ยืนยันการลบนักกีฬา?
            </h3>

            <p className="text-xs text-zinc-500 text-center mt-2 leading-relaxed">
              คุณกำลังจะลบ <strong>&ldquo;{athleteToDelete.name}&rdquo;</strong> (รหัส {athleteToDelete.athleteCode}) ออกจากระบบอย่างถาวร
              ข้อมูลสถิติและประวัติการเช็คชื่อทั้งหมดจะถูกลบไปด้วย
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAthleteToDelete(null)}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[42px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await deleteAthleteAction(athleteToDelete.id);
                    setAthleteToDelete(null);
                  });
                }}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันลบข้อมูล</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
