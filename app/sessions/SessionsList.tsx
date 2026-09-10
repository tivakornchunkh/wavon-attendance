'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cancelSessionAction } from '../actions/session.actions';

interface SessionItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isClosed?: boolean;
  totalChecked: number;
  present: number;
  absent: number;
  leave: number;
}

interface SessionsListProps {
  sessions: SessionItem[];
  todayStr?: string;
}

export default function SessionsList({ sessions, todayStr: propTodayStr }: SessionsListProps) {
  const router = useRouter();
  const todayStr = propTodayStr || new Date().toISOString().split('T')[0];
  const [activeTab, setActiveTab] = useState<'today_upcoming' | 'history'>('today_upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  // ตรวจสอบเวลาหมดรอบอัตโนมัติบนหน้าจอ (Auto-Check Every 10s)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hh}:${mm}`;

      // หากมีรอบซ้อมของวันนี้ที่เวลาสิ้นสุดผ่านไปแล้วแต่ยังไม่ได้ปิดรอบ ให้ refresh เพื่อตัดยอดทันที
      const hasExpiredUnclosed = sessions.some(
        (s) => !s.isClosed && s.date === todayStr && s.endTime <= currentTime
      );

      if (hasExpiredUnclosed) {
        router.refresh();
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [sessions, todayStr, router]);

  const todayAndUpcoming = useMemo(
    () => sessions.filter((s) => s.date >= todayStr),
    [sessions, todayStr]
  );
  const pastSessions = useMemo(
    () => sessions.filter((s) => s.date < todayStr),
    [sessions, todayStr]
  );

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const s of pastSessions) {
      months.add(s.date.slice(0, 7));
    }
    return Array.from(months).sort().reverse();
  }, [pastSessions]);

  const filteredSessions = useMemo(() => {
    const baseList = activeTab === 'today_upcoming' ? todayAndUpcoming : pastSessions;

    return baseList.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.date.includes(searchQuery.trim());

      const matchMonth =
        activeTab === 'today_upcoming' ||
        filterMonth === 'ALL' ||
        s.date.startsWith(filterMonth);

      return matchSearch && matchMonth;
    });
  }, [activeTab, todayAndUpcoming, pastSessions, searchQuery, filterMonth]);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs space-y-0">
      {/* Tab Header Navigation */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('today_upcoming');
              setSearchQuery('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[40px] ${
              activeTab === 'today_upcoming'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <span>⚡ วันนี้ & กำลังมาถึง</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'today_upcoming'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {todayAndUpcoming.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setSearchQuery('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[40px] ${
              activeTab === 'history'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/70'
            }`}
          >
            <span>📁 ประวัติย้อนหลัง</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'history'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {pastSessions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Month Filter Toolbar */}
      <div className="px-5 sm:px-6 py-3.5 border-b border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 ค้นหาตามชื่อรอบ หรือวันที่..."
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

        {activeTab === 'history' && availableMonths.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-zinc-500 shrink-0 font-medium">เดือน:</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 text-xs font-bold border border-zinc-200 rounded-xl bg-white text-zinc-700 cursor-pointer min-h-[40px]"
            >
              <option value="ALL">ทุกเดือน ({pastSessions.length} รอบ)</option>
              {availableMonths.map((m) => {
                const countInMonth = pastSessions.filter((s) => s.date.startsWith(m)).length;
                return (
                  <option key={m} value={m}>
                    {m} ({countInMonth} รอบ)
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* List Content */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-14 px-4">
          <p className="text-sm text-zinc-600 font-bold">
            {searchQuery
              ? `ไม่พบรอบการฝึกซ้อมที่ตรงกับคำค้นหา "${searchQuery}"`
              : activeTab === 'today_upcoming'
              ? 'ไม่มีรอบการฝึกซ้อมสำหรับวันนี้หรือรอบที่จะมาถึง'
              : 'ยังไม่มีประวัติการฝึกซ้อมในอดีต'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {searchQuery
              ? 'ลองเปลี่ยนคำค้นหา หรือกดล้างการค้นหา'
              : activeTab === 'today_upcoming'
              ? 'แตะปุ่ม "เริ่มเช็คชื่อทันที" ทางซ้ายเพื่อเปิดรอบซ้อมด่วน'
              : 'รอบซ้อมที่ผ่านไปแล้วจะถูกจัดเก็บไว้ที่นี่อัตโนมัติ'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {filteredSessions.map((s) => (
            <div
              key={s.id}
              className="p-5 hover:bg-zinc-50/80 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-base text-zinc-900">{s.title}</span>
                  {s.isClosed ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-600 border border-zinc-300 inline-flex items-center gap-1">
                      <span>🔒</span>
                      <span>ปิดรอบแล้ว (ตัดยอดแล้ว)</span>
                    </span>
                  ) : s.date === todayStr ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>● กำลังเปิดเช็คชื่อ (สด)</span>
                    </span>
                  ) : s.date > todayStr ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                      ล่วงหน้า
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                  <span>📅 {s.date}</span>
                  <span>⏰ {s.startTime} - {s.endTime} น.</span>
                </div>

                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    มา: {s.present}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                    s.absent > 0 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    ขาด: {s.absent}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    ลา: {s.leave}
                  </span>
                  {s.totalChecked === 0 && (
                    <span className="text-xs text-zinc-400 italic">(ยังไม่ได้เริ่มเช็คชื่อ)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <Link
                  href={`/sessions/${s.id}`}
                  className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition min-h-[42px] ${
                    s.isClosed
                      ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300'
                      : 'bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white'
                  }`}
                >
                  {s.isClosed ? '📋 ดูผล / สรุปยอด' : s.totalChecked === 0 ? '⚡ เริ่มเช็คชื่อ' : '✏️ แก้ไข / ตรวจสอบ'} &rarr;
                </Link>

                <form
                  action={async () => {
                    if (
                      confirm(
                        'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกรอบนี้? (ข้อมูลเช็คชื่อในรอบนี้จะถูกลบและไม่คิดในสถิติ)'
                      )
                    ) {
                      await cancelSessionAction(s.id);
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer min-h-[42px]"
                    title="ยกเลิกรอบนี้"
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
