'use client';

import React, { useState, useTransition } from 'react';
import { selfCheckInAction } from '../../actions/session.actions';

interface Athlete {
  id: string;
  athleteCode: string;
  name: string;
  phone?: string | null;
  status: string;
}

interface ExistingAttendance {
  athleteId: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
  notes?: string | null;
}

interface AthleteCheckInViewProps {
  session: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  team: {
    id: string;
    name: string;
  };
  athletes: Athlete[];
  initialAttendances: ExistingAttendance[];
}

export default function AthleteCheckInView({
  session,
  team,
  athletes,
  initialAttendances,
}: AthleteCheckInViewProps) {
  const [activeTab, setActiveTab] = useState<'PRESENT' | 'LEAVE'>('PRESENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [leaveReason, setLeaveReason] = useState('ลาป่วย');
  const [customLeaveReason, setCustomLeaveReason] = useState('');
  const [attendances, setAttendances] = useState<Record<string, { status: string; notes?: string | null }>>(
    () => {
      const map: Record<string, { status: string; notes?: string | null }> = {};
      for (const att of initialAttendances) {
        map[att.athleteId] = { status: att.status, notes: att.notes };
      }
      return map;
    }
  );
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const quickLeaveOptions = ['ลาป่วย', 'ติดเรียน / ติดสอบ', 'ติดธุระครอบครัว', 'บาดเจ็บจากการแข่งขัน', 'อื่นๆ'];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filteredAthletes = athletes.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.athleteCode.toLowerCase().includes(q) ||
      (a.phone && a.phone.includes(q))
    );
  });

  const presentCount = Object.values(attendances).filter((a) => a.status === 'PRESENT').length;
  const leaveCount = Object.values(attendances).filter((a) => a.status === 'LEAVE').length;

  const handleConfirmCheckIn = () => {
    if (!selectedAthlete || isPending) return;

    const athleteToSubmit = selectedAthlete;
    const finalReason =
      activeTab === 'LEAVE'
        ? leaveReason === 'อื่นๆ' && customLeaveReason.trim()
          ? customLeaveReason.trim()
          : leaveReason
        : undefined;

    startTransition(async () => {
      try {
        await selfCheckInAction(
          session.id,
          athleteToSubmit.id,
          activeTab,
          finalReason
        );

        setAttendances((prev) => ({
          ...prev,
          [athleteToSubmit.id]: {
            status: activeTab,
            notes: finalReason || (activeTab === 'PRESENT' ? 'สแกน QR เช็คชื่อตนเอง' : 'แจ้งลาซ้อม'),
          },
        }));

        showToast(
          activeTab === 'PRESENT'
            ? `✓ เช็คชื่อเข้าซ้อมเรียบร้อย: ${athleteToSubmit.name} (${athleteToSubmit.athleteCode})`
            : `บันทึกการแจ้งลาซ้อมเรียบร้อย: ${athleteToSubmit.name} (${finalReason})`,
          'success'
        );

        setSelectedAthlete(null);
        setCustomLeaveReason('');
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก', 'error');
      }
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto py-4 sm:py-8 px-3.5 sm:px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 inset-x-4 max-w-md mx-auto z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all animate-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border border-emerald-700/80 shadow-emerald-900/20'
              : 'bg-rose-950 text-rose-100 border border-rose-700/80 shadow-rose-900/20'
          }`}
        >
          <span className="text-xl">
            {toastMessage.type === 'success' ? '✅' : '⚠️'}
          </span>
          <p className="text-xs sm:text-sm font-semibold flex-1 leading-snug">
            {toastMessage.text}
          </p>
        </div>
      )}

      {/* Session Details Card */}
      <div className="bg-[#0F1115] text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            🏢 {team.name}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">
            สแกนเช็คชื่อนักกีฬา
          </span>
        </div>

        <h1 className="mt-3 text-xl sm:text-2xl font-black text-white tracking-tight">
          {session.title}
        </h1>

        <div className="mt-2.5 flex items-center gap-3 text-xs text-zinc-300 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span>📅</span>
            <span>{session.date}</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5">
            <span>⏰</span>
            <span>{session.startTime} - {session.endTime} น.</span>
          </span>
        </div>

        {/* Live Counters */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-center">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5">
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              เช็คชื่อแล้ว (มาซ้อม)
            </p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{presentCount} คน</p>
          </div>
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5">
            <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              แจ้งลาซ้อม (ลา)
            </p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{leaveCount} คน</p>
          </div>
        </div>
      </div>

      {/* Tab Selector: Present vs Leave */}
      <div className="mt-4 bg-zinc-200/80 p-1.5 rounded-2xl flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('PRESENT')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer min-h-[46px] ${
            activeTab === 'PRESENT'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>✓</span>
          <span>เช็คชื่อเข้าซ้อม (มา)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEAVE')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer min-h-[46px] ${
            activeTab === 'LEAVE'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-700/20'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>📝</span>
          <span>แจ้งลาซ้อม (ลา)</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="mt-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ หรือรหัสนักกีฬา..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-300 rounded-2xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-xs min-h-[48px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600 px-2 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Athletes List */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            แตะที่ชื่อของคุณเพื่อ{activeTab === 'PRESENT' ? 'เช็คชื่อ' : 'แจ้งลา'}
          </p>
          <span className="text-[11px] text-zinc-400">
            พบ {filteredAthletes.length} คน
          </span>
        </div>

        {filteredAthletes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-400">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-xs font-bold text-zinc-600">ไม่พบรายชื่อนักกีฬา</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              ลองพิมพ์คำค้นหาใหม่อีกครั้ง
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-0.5">
            {filteredAthletes.map((ath) => {
              const currentAtt = attendances[ath.id];
              const isPresent = currentAtt?.status === 'PRESENT';
              const isLeave = currentAtt?.status === 'LEAVE';

              return (
                <button
                  key={ath.id}
                  type="button"
                  onClick={() => setSelectedAthlete(ath)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between gap-3 min-h-[56px] cursor-pointer ${
                    isPresent
                      ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400/30'
                      : isLeave
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/30'
                      : 'bg-white border-zinc-200/80 hover:border-zinc-300 active:bg-zinc-50 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isPresent
                          ? 'bg-emerald-600 text-white'
                          : isLeave
                          ? 'bg-amber-500 text-white'
                          : 'bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      {ath.athleteCode}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-zinc-900 truncate">
                          {ath.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        รหัส: {ath.athleteCode} {ath.phone ? `• โทร ${ath.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span>✓</span>
                        <span>มาซ้อมแล้ว</span>
                      </span>
                    ) : isLeave ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                        <span>⚠</span>
                        <span>แจ้งลาแล้ว</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold bg-zinc-900 text-white">
                        {activeTab === 'PRESENT' ? 'เช็คชื่อ' : 'แจ้งลา'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Bottom Sheet / Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-500">
                ยืนยัน{activeTab === 'PRESENT' ? 'เช็คชื่อเข้าซ้อม' : 'แจ้งลาซ้อม'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedAthlete(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                  activeTab === 'PRESENT'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {selectedAthlete.athleteCode}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-900">
                  {selectedAthlete.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  รหัสนักกีฬา: <strong>{selectedAthlete.athleteCode}</strong>
                </p>
              </div>
            </div>

            {/* Leave Options when in LEAVE tab */}
            {activeTab === 'LEAVE' && (
              <div className="mt-5 space-y-3">
                <label className="block text-xs font-bold text-zinc-700">
                  เหตุผลการลาซ้อม <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickLeaveOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLeaveReason(opt)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer min-h-[38px] ${
                        leaveReason === opt
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {leaveReason === 'อื่นๆ' && (
                  <input
                    type="text"
                    required
                    value={customLeaveReason}
                    onChange={(e) => setCustomLeaveReason(e.target.value)}
                    placeholder="พิมพ์เหตุผลการลาซ้อม เช่น เดินทางไปต่างจังหวัด"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white min-h-[44px]"
                  />
                )}
              </div>
            )}

            {/* Confirmation Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedAthlete(null)}
                disabled={isPending}
                className="flex-1 py-3.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs sm:text-sm font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[48px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckIn}
                disabled={isPending}
                className={`flex-1 py-3.5 rounded-xl text-xs sm:text-sm font-black text-white transition flex items-center justify-center gap-2 cursor-pointer min-h-[48px] ${
                  activeTab === 'PRESENT'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-lg shadow-emerald-600/30'
                    : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-lg shadow-amber-600/30'
                }`}
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <span>{activeTab === 'PRESENT' ? '✓ ยืนยันเช็คชื่อ' : '⚠ ยืนยันการลา'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}