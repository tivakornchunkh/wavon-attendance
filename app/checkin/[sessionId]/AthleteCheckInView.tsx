'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
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
    isClosed?: boolean;
  };
  team: {
    id: string;
    name: string;
  };
  athletes: Athlete[];
  initialAttendances: ExistingAttendance[];
  isPitchVerified?: boolean;
}

export default function AthleteCheckInView({
  session,
  team,
  athletes,
  initialAttendances,
  isPitchVerified = true,
}: AthleteCheckInViewProps) {
  const [pitchVerifiedState, setPitchVerifiedState] = useState(isPitchVerified);
  const [activeTab, setActiveTab] = useState<'PRESENT' | 'LEAVE'>(isPitchVerified ? 'PRESENT' : 'LEAVE');
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

  // 10B: Remember Me on Device
  const [rememberedAthleteId, setRememberedAthleteId] = useState<string | null>(null);
  const [dismissRemembered, setDismissRemembered] = useState(false);

  // 8A & 7B: Digital Pass & Arrival Rank Modal
  const [digitalPassData, setDigitalPassData] = useState<{
    athleteName: string;
    athleteCode: string;
    rank: number;
    time: string;
  } | null>(null);

  useEffect(() => {
    try {
      const savedId = localStorage.getItem('wavon_remembered_athlete_id');
      if (savedId) {
        setRememberedAthleteId(savedId);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isPitchVerified) {
      try {
        sessionStorage.setItem(`wavon_pitch_verified_${session.id}`, 'true');
      } catch {}
      setPitchVerifiedState(true);
    } else {
      try {
        const saved = sessionStorage.getItem(`wavon_pitch_verified_${session.id}`);
        if (saved === 'true') {
          setPitchVerifiedState(true);
        }
      } catch {}
    }
  }, [isPitchVerified, session.id]);

  const rememberedAthlete = rememberedAthleteId
    ? athletes.find((a) => a.id === rememberedAthleteId)
    : null;
  const isRememberedCheckedIn = rememberedAthlete
    ? attendances[rememberedAthlete.id]?.status === 'PRESENT'
    : false;

  const quickLeaveOptions = ['ลาป่วย', 'ติดเรียน / ติดสอบ', 'ติดธุระครอบครัว', 'บาดเจ็บจากการแข่งขัน', 'อื่นๆ'];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const presentCount = Object.values(attendances).filter((a) => a.status === 'PRESENT').length;
  const leaveCount = Object.values(attendances).filter((a) => a.status === 'LEAVE').length;
  const uncheckedCount = athletes.length - (presentCount + leaveCount);

  // 9B: List of teammates who have checked in
  const presentAthletes = athletes.filter((a) => attendances[a.id]?.status === 'PRESENT');

  // UX Optimization (Decision 1): Group unchecked athletes first, already checked athletes at bottom
  const { uncheckedList, checkedList, totalFiltered } = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = athletes.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.athleteCode.toLowerCase().includes(q) ||
        (a.phone && a.phone.includes(q))
      );
    });

    const unchecked: Athlete[] = [];
    const checked: Athlete[] = [];

    for (const a of filtered) {
      const att = attendances[a.id];
      if (att && (att.status === 'PRESENT' || att.status === 'LEAVE')) {
        checked.push(a);
      } else {
        unchecked.push(a);
      }
    }

    return {
      uncheckedList: unchecked,
      checkedList: checked,
      totalFiltered: filtered.length,
    };
  }, [athletes, searchQuery, attendances]);

  const handleConfirmCheckIn = (targetAthlete?: Athlete) => {
    const athleteToSubmit = targetAthlete || selectedAthlete;
    if (!athleteToSubmit || isPending) return;

    // 4A: Check Pitch Anti-cheat
    if (activeTab === 'PRESENT' && !pitchVerifiedState) {
      showToast('📍 ต้องสแกน QR Code ริมสนามจริงเพื่อเช็คชื่อเข้าซ้อม (หากไม่ได้มาสนาม สามารถกดแท็บ "แจ้งลาซ้อม" ได้ทันที)', 'error');
      return;
    }

    const finalReason =
      activeTab === 'LEAVE'
        ? leaveReason === 'อื่นๆ' && customLeaveReason.trim()
          ? customLeaveReason.trim()
          : leaveReason
        : undefined;

    const arrivalRank = presentCount + 1;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    startTransition(async () => {
      try {
        await selfCheckInAction(
          session.id,
          athleteToSubmit.id,
          activeTab,
          finalReason,
          pitchVerifiedState
        );

        // Update local state instantly
        setAttendances((prev) => ({
          ...prev,
          [athleteToSubmit.id]: {
            status: activeTab,
            notes: finalReason || (activeTab === 'PRESENT' ? 'สแกน QR ริมสนาม' : 'แจ้งลาซ้อม'),
          },
        }));

        // 10B: Save remembered athlete
        try {
          localStorage.setItem('wavon_remembered_athlete_id', athleteToSubmit.id);
          setRememberedAthleteId(athleteToSubmit.id);
        } catch {}

        if (activeTab === 'PRESENT') {
          // 8A & 7B: Show Digital Match Pass & Confetti
          setDigitalPassData({
            athleteName: athleteToSubmit.name,
            athleteCode: athleteToSubmit.athleteCode,
            rank: arrivalRank,
            time: `${nowTime} น.`,
          });
        } else {
          showToast(`บันทึกการแจ้งลาซ้อมเรียบร้อย: ${athleteToSubmit.name} (${finalReason})`, 'success');
        }

        setSelectedAthlete(null);
        setCustomLeaveReason('');
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก', 'error');
      }
    });
  };

  // 3A: Closed Session Lock
  if (session.isClosed) {
    return (
      <div className="w-full max-w-md mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl p-8 border border-zinc-200 text-center shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-zinc-900 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
            🔒
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            ปิดรอบการซ้อมแล้ว
          </span>
          <h2 className="text-xl font-black text-zinc-900">
            {session.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            รอบการฝึกซ้อมนี้ถูกปิดรับการเช็คชื่อเรียบร้อยแล้ว หากนักกีฬามาถึงสนามแล้วไม่ได้สแกน กรุณาติดต่อโค้ชผู้ฝึกสอนเพื่อแก้ไขสถานะในระบบ
          </p>
          <div className="pt-4 border-t border-zinc-100 text-xs text-zinc-400 font-mono">
            {session.date} • {session.startTime} - {session.endTime} น.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto py-3 sm:py-6 px-3.5 sm:px-4">
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

      {/* 4A: Notice if opened via LINE without Pitch Verification */}
      {!pitchVerifiedState && (
        <div className="mb-3.5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-950 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span className="text-base">📱</span>
            <span>เปิดผ่านลิงก์ LINE (โหมดแจ้งลาซ้อมจากที่บ้าน)</span>
          </div>
          <p className="leading-relaxed text-amber-800 text-[11px]">
            ท่านสามารถค้นหาชื่อและ <strong>&quot;แจ้งลาซ้อม&quot;</strong> ได้ทันที • สำหรับการเช็คชื่อเข้าซ้อม กรุณาสแกน QR บนจอโค้ชหรือป้ายริมสนาม
          </p>
        </div>
      )}

      {/* 8A: Digital Match Pass Celebration Modal */}
      {digitalPassData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0F1115] text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-emerald-500/40 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Confetti Particle simulation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <span className="text-5xl animate-bounce">🎉</span>
            </div>

            {/* Pass Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                PITCH CHECK-IN PASS
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {digitalPassData.time}
              </span>
            </div>

            {/* Pass Body */}
            <div className="py-6 space-y-3 relative z-10">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/20">
                ⚽
              </div>

              {/* Early Bird Rank Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                <span>⚡</span>
                <span>มาถึงสนามเป็นคนที่ #{digitalPassData.rank}</span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                {digitalPassData.athleteName}
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                รหัสประจำตัว: <strong className="text-emerald-400">{digitalPassData.athleteCode}</strong>
              </p>
              <p className="text-[11px] text-zinc-500">
                สโมสร {team.name} • {session.title}
              </p>
            </div>

            {/* Stamp */}
            <div className="mt-2 inline-block px-4 py-1.5 rounded-full border-2 border-emerald-400 text-emerald-400 text-xs font-black tracking-widest uppercase rotate-[-3deg] shadow-lg shadow-emerald-500/20">
              ✓ VERIFIED PRESENT
            </div>

            {/* Close Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setDigitalPassData(null)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm transition cursor-pointer shadow-md active:scale-95"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 1. COMPACT SPORTY SESSION HEADER (UX Decision 2)         */}
      {/* ======================================================= */}
      <div className="bg-[#0F1115] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-zinc-800">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
              🏢 {team.name}
            </span>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1 font-medium">
              <span>⏰</span>
              <span>{session.startTime} - {session.endTime} น.</span>
            </span>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
            pitchVerifiedState
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <span>{pitchVerifiedState ? '🛡️' : '📱'}</span>
            <span>{pitchVerifiedState ? 'PITCH VERIFIED' : 'LINE LINK'}</span>
          </span>
        </div>

        <h1 className="mt-2 text-base sm:text-lg font-black text-white tracking-tight truncate">
          {session.title}
        </h1>

        {/* Live Counters Strip: Compact single line row */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl py-1.5 px-2 text-emerald-400">
            <span className="text-[10px] opacity-75 block font-semibold">มาซ้อม</span>
            <span className="text-sm font-black">{presentCount} คน</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-xl py-1.5 px-2 text-amber-400">
            <span className="text-[10px] opacity-75 block font-semibold">แจ้งลา</span>
            <span className="text-sm font-black">{leaveCount} คน</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 px-2 text-zinc-400">
            <span className="text-[10px] opacity-75 block font-semibold">ยังไม่เช็ค</span>
            <span className="text-sm font-black text-zinc-200">{uncheckedCount} คน</span>
          </div>
        </div>

        {/* 9B: Teammates on Pitch Compact Chips */}
        {presentAthletes.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span>👥 ถึงสนาม:</span>
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {presentAthletes.map((pa) => (
                <span
                  key={pa.id}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-900 text-emerald-300 border border-zinc-800 flex items-center gap-1 shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>{pa.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* 2. REMEMBERED ATHLETE 1-CLICK QUICK CHECK-IN BANNER      */}
      {/* ======================================================= */}
      {rememberedAthlete && !dismissRemembered && (
        <div className="mt-3.5 p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-xs font-black text-emerald-950">
                  {rememberedAthlete.name} ({rememberedAthlete.athleteCode})
                </p>
                <p className="text-[10px] text-emerald-700">
                  {isRememberedCheckedIn
                    ? '✓ เช็คชื่อเข้าซ้อมเรียบร้อยแล้วในรอบนี้'
                    : 'เครื่องนี้ถูกจดจำไว้ แตะปุ่มด้านล่างเพื่อเช็คชื่อทันที'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissRemembered(true)}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
              title="สลับชื่อ"
            >
              ✕
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            {isRememberedCheckedIn ? (
              <button
                type="button"
                onClick={() => {
                  setDigitalPassData({
                    athleteName: rememberedAthlete.name,
                    athleteCode: rememberedAthlete.athleteCode,
                    rank: presentCount,
                    time: 'เข้าซ้อมแล้ว',
                  });
                }}
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>🎫</span>
                <span>ดูบัตร Digital Match Pass ของคุณ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleConfirmCheckIn(rememberedAthlete)}
                disabled={isPending}
                className="flex-1 py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  <span>กำลังบันทึก...</span>
                ) : (
                  <>
                    <span>✓</span>
                    <span>1-Click เช็คชื่อเข้าซ้อมทันที</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissRemembered(true)}
              className="py-2 px-3 bg-white text-zinc-600 text-xs font-bold rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer shrink-0"
            >
              ไม่ใช่ฉัน
            </button>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 3. TAB SELECTOR: PRESENT VS LEAVE                        */}
      {/* ======================================================= */}
      <div className="mt-3.5 bg-zinc-200/80 p-1 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('PRESENT')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
            activeTab === 'PRESENT'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>{pitchVerifiedState ? '✓' : '🔒'}</span>
          <span>เช็คชื่อเข้าซ้อม (มา){!pitchVerifiedState ? ' [สแกนริมสนาม]' : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEAVE')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
            activeTab === 'LEAVE'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-700/20'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>📝</span>
          <span>แจ้งลาซ้อม (ลา)</span>
        </button>
      </div>

      {activeTab === 'PRESENT' && !pitchVerifiedState && (
        <div className="mt-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <span className="text-base">🔒</span>
          <p className="leading-snug text-[11px]">
            <strong>ต้องสแกน QR Code ริมสนาม:</strong> ท่านเปิดจากลิงก์ที่ไม่มีการยืนยันพิกัดสนาม หากอยู่ที่สนามจริง กรุณาสแกน QR บนจอโค้ชหรือป้ายริมสนามอีกครั้ง (หากอยู่บ้าน กรุณาแตะแท็บ <strong>&quot;แจ้งลาซ้อม&quot;</strong>)
          </p>
        </div>
      )}

      {/* ======================================================= */}
      {/* 4. SEARCH INPUT (Clean Sticky Feel)                     */}
      {/* ======================================================= */}
      <div className="mt-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ หรือรหัสนักกีฬา..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-2xs min-h-[44px]"
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

      {/* ======================================================= */}
      {/* 5. ATHLETES ROSTER LIST (UX Decision 1 & 3)             */}
      {/* ======================================================= */}
      <div className="mt-3.5 space-y-3">
        {/* Section 1: Unchecked Athletes (Top Priority) */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <span>⚡ ยังไม่เช็คชื่อ</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-200 text-zinc-700 text-[10px]">
                {uncheckedList.length}
              </span>
            </p>
            <span className="text-[10px] text-zinc-400">
              แตะชื่อเพื่อ{activeTab === 'PRESENT' ? 'เข้าซ้อม' : 'แจ้งลา'}
            </span>
          </div>

          {uncheckedList.length === 0 && totalFiltered === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center text-zinc-400">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs font-bold text-zinc-600">ไม่พบรายชื่อนักกีฬา</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                ลองพิมพ์คำค้นหาใหม่อีกครั้ง
              </p>
            </div>
          ) : uncheckedList.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-emerald-800">
              ✓ นักกีฬาทุกคนเช็คชื่อครบเรียบร้อยแล้ว
            </div>
          ) : (
            <div className="space-y-1.5">
              {uncheckedList.map((ath) => (
                <button
                  key={ath.id}
                  type="button"
                  onClick={() => setSelectedAthlete(ath)}
                  className="w-full text-left p-3 sm:p-3.5 rounded-xl border border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 transition flex items-center justify-between gap-3 min-h-[50px] cursor-pointer shadow-2xs active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center text-xs font-black shrink-0 border border-zinc-200">
                      {ath.athleteCode}
                    </div>

                    <div className="overflow-hidden">
                      <span className="text-xs sm:text-sm font-black text-zinc-900 truncate block">
                        {ath.name}
                      </span>
                      <p className="text-[10px] text-zinc-400 truncate">
                        รหัส: {ath.athleteCode} {ath.phone ? `• โทร ${ath.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold ${
                      activeTab === 'PRESENT'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {activeTab === 'PRESENT' ? '✓ เช็คชื่อ' : '📝 แจ้งลา'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Already Checked-in Athletes (Bottom - UX Decision 3: Disabled / Locked) */}
        {checkedList.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <span>✓ เช็คชื่อแล้ว</span>
                <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-500 text-[10px]">
                  {checkedList.length}
                </span>
              </p>
              <span className="text-[10px] text-zinc-400">
                {activeTab === 'PRESENT' ? 'ล็อคป้องกันกดซ้ำ' : ''}
              </span>
            </div>

            <div className="space-y-1.5 opacity-90">
              {checkedList.map((ath) => {
                const currentAtt = attendances[ath.id];
                const isPresent = currentAtt?.status === 'PRESENT';
                const isLeave = currentAtt?.status === 'LEAVE';

                // UX Decision 3: If already PRESENT in PRESENT tab, or LEAVE in LEAVE tab -> lock / disable button
                const isLocked = (isPresent && activeTab === 'PRESENT') || (isLeave && activeTab === 'LEAVE');

                return (
                  <button
                    key={ath.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedAthlete(ath);
                      }
                    }}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition flex items-center justify-between gap-3 min-h-[50px] ${
                      isLocked
                        ? 'cursor-default opacity-85'
                        : 'cursor-pointer hover:border-zinc-300'
                    } ${
                      isPresent
                        ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                        : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isPresent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {ath.athleteCode}
                      </div>

                      <div className="overflow-hidden">
                        <span className="text-xs sm:text-sm font-black text-zinc-900 truncate block">
                          {ath.name}
                        </span>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {currentAtt?.notes || (isPresent ? 'สแกน QR ริมสนาม' : 'แจ้งลา')}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span>✓</span>
                          <span>เข้าซ้อมแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                          <span>⚠</span>
                          <span>{activeTab === 'PRESENT' ? 'ลา (แตะเพื่อเข้าซ้อม)' : 'แจ้งลาแล้ว'}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* 6. CONFIRMATION BOTTOM SHEET MODAL                       */}
      {/* ======================================================= */}
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
              <div className="mt-4 space-y-2.5">
                <label className="block text-xs font-bold text-zinc-700">
                  เหตุผลการลาซ้อม <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickLeaveOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLeaveReason(opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer min-h-[36px] ${
                        leaveReason === opt
                          ? 'bg-amber-500 text-white shadow-xs'
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white min-h-[42px]"
                  />
                )}
              </div>
            )}

            {/* Confirmation Buttons */}
            <div className="mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAthlete(null)}
                disabled={isPending}
                className="flex-1 py-3 rounded-xl border border-zinc-300 text-zinc-700 text-xs sm:text-sm font-bold hover:bg-zinc-50 transition cursor-pointer min-h-[46px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleConfirmCheckIn(selectedAthlete)}
                disabled={isPending}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-black text-white transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[46px] ${
                  activeTab === 'PRESENT'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/30'
                    : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md shadow-amber-600/30'
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