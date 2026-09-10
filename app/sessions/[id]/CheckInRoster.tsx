'use client';

import { useState, useMemo } from 'react';
import {
  submitSessionAttendanceAction,
  closeSessionAndMarkAbsentAction,
} from '../../actions/session.actions';
import { AttendanceStatus } from '../../../src/core/domain/attendance';
import { Athlete } from '../../../src/core/domain/athlete';
import { Toast } from '../../../components/Toast';
import { playTactileFeedback } from '../../../components/feedback';
import QrCheckInModal from './QrCheckInModal';

interface RosterItem {
  athlete: Athlete;
  attendanceId?: string;
  status?: AttendanceStatus;
  notes?: string | null;
  checkedAt?: string;
}

interface CheckInRosterProps {
  sessionId: string;
  initialRoster: RosterItem[];
  sessionDetails?: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    isClosed?: boolean;
  };
}

type SortField = 'name' | 'code';
type SortOrder = 'asc' | 'desc';

export default function CheckInRoster({ sessionId, initialRoster, sessionDetails }: CheckInRosterProps) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | ''>>(() => {
    const map: Record<string, AttendanceStatus | ''> = {};
    for (const item of initialRoster) {
      map[item.athlete.id] = item.status || '';
    }
    return map;
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const item of initialRoster) {
      map[item.athlete.id] = item.notes || '';
    }
    return map;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [isClosed, setIsClosed] = useState(sessionDetails?.isClosed || false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosingPending, setIsClosingPending] = useState(false);
  const [closedToastMsg, setClosedToastMsg] = useState<string | null>(null);

  const handleConfirmCloseSession = async () => {
    setIsClosingPending(true);
    try {
      const res = await closeSessionAndMarkAbsentAction(sessionId);
      setIsClosed(true);
      setShowCloseModal(false);
      const updatedStatuses = { ...statuses };
      const updatedNotes = { ...notes };
      for (const item of initialRoster) {
        if (!updatedStatuses[item.athlete.id]) {
          updatedStatuses[item.athlete.id] = 'ABSENT';
          updatedNotes[item.athlete.id] = 'ขาดซ้อม (ระบบตัดยอดอัตโนมัติเมื่อปิดรอบ)';
        }
      }
      setStatuses(updatedStatuses);
      setNotes(updatedNotes);
      setClosedToastMsg(`✓ ปิดรอบซ้อมเรียบร้อย: ตัดยอดขาดซ้อมอัตโนมัติ ${res.markedAbsentCount} คน`);
      setTimeout(() => setClosedToastMsg(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการปิดรอบซ้อม');
    } finally {
      setIsClosingPending(false);
    }
  };

  // ปุ่มลัด: ติ๊กมาทุกคน (Mark All as Present)
  const handleMarkAllPresent = () => {
    const newStatuses = { ...statuses };
    for (const item of initialRoster) {
      newStatuses[item.athlete.id] = 'PRESENT';
    }
    setStatuses(newStatuses);
    setSavedSuccess(false);
    playTactileFeedback('MARK_ALL', { sound: soundEnabled, haptic: true });
  };

  const handleStatusChange = (athleteId: string, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [athleteId]: status }));
    setSavedSuccess(false);
    playTactileFeedback(status, { sound: soundEnabled, haptic: true });
  };

  const handleNotesChange = (athleteId: string, text: string) => {
    setNotes((prev) => ({ ...prev, [athleteId]: text }));
    setSavedSuccess(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedAndFilteredRoster = useMemo(() => {
    let list = [...initialRoster];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.athlete.name.toLowerCase().includes(q) ||
          item.athlete.athleteCode.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.athlete.name.localeCompare(b.athlete.name, 'th');
      } else {
        cmp = a.athlete.athleteCode.localeCompare(b.athlete.athleteCode, 'th');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [initialRoster, searchQuery, sortField, sortOrder]);

  // สรุปยอดสด (Live Headcount)
  const livePresent = Object.values(statuses).filter((s) => s === 'PRESENT').length;
  const liveAbsent = Object.values(statuses).filter((s) => s === 'ABSENT').length;
  const liveLeave = Object.values(statuses).filter((s) => s === 'LEAVE').length;
  const liveUnchecked = initialRoster.length - (livePresent + liveAbsent + liveLeave);

  return (
    <form
      action={async (formData: FormData) => {
        setIsSubmitting(true);
        try {
          formData.set('sessionId', sessionId);
          await submitSessionAttendanceAction(formData);
          setSavedSuccess(true);
          playTactileFeedback('SAVE', { sound: soundEnabled, haptic: true });
          setTimeout(() => setSavedSuccess(false), 3500);
        } finally {
          setIsSubmitting(false);
        }
      }}
      className="space-y-4 sm:space-y-5"
    >
      {savedSuccess && (
        <Toast
          message="✓ บันทึกข้อมูลการเช็คชื่อทั้งหมดเรียบร้อยแล้ว"
          type="success"
          onClose={() => setSavedSuccess(false)}
        />
      )}
      {closedToastMsg && (
        <Toast
          message={closedToastMsg}
          type="success"
          onClose={() => setClosedToastMsg(null)}
        />
      )}
      <input type="hidden" name="sessionId" value={sessionId} />
      {/* ========================================================= */}
      {/* 1. STICKY TOP ACTION TOOLBAR (Optimized for iPad & Mobile) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-sm sticky top-16 lg:top-20 z-20 space-y-3">
        {/* Row 1: Live Headcount Badges + Mark All Present */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-500 mr-1">ยอดรวมสด:</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              มา: {livePresent}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              ขาด: {liveAbsent}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              ลา: {liveLeave}
            </span>
            {liveUnchecked > 0 ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 animate-pulse">
                ยังไม่เช็ค: {liveUnchecked}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-xs">
                ✓ ครบทุกคนแล้ว
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Tactile Audio Feedback Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 active:scale-95 ${
                soundEnabled
                  ? 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                  : 'bg-zinc-50 text-zinc-400 border-zinc-200'
              }`}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์การแตะ' : 'เปิดเสียงเอฟเฟกต์การแตะ'}
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
              <span className="hidden md:inline">{soundEnabled ? 'เสียงเปิด' : 'เสียงปิด'}</span>
            </button>

            {/* Athlete QR Check-In Modal Trigger */}
            <QrCheckInModal
              sessionId={sessionId}
              sessionTitle={sessionDetails?.title || 'รอบการฝึกซ้อม'}
              sessionDate={sessionDetails?.date || ''}
              sessionTime={`${sessionDetails?.startTime || ''} - ${sessionDetails?.endTime || ''}`}
              livePresent={livePresent}
              liveLeave={liveLeave}
              totalAthletes={initialRoster.length}
            />

            {/* Close Session & Auto-Absent Button */}
            {isClosed ? (
              <span className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 flex items-center gap-1.5 min-h-[42px]">
                <span>🔒</span>
                <span>ปิดรอบซ้อมแล้ว</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowCloseModal(true)}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-xs transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5 active:scale-95"
                title="ปิดรอบซ้อมและตัดยอดขาดอัตโนมัติสำหรับคนที่ยังไม่ได้เช็คชื่อ"
              >
                <span>🔒</span>
                <span>ปิดรอบ & ตัดยอดขาด</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-95 text-white shadow-xs transition cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
              title="ตั้งค่าให้นักกีฬาทุกคนในรอบนี้มีสถานะ มาซ้อม ทันที"
            >
              <span>⚡</span>
              <span>มาทุกคน (Mark All)</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white shadow-xs transition disabled:opacity-50 cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
            >
              {savedSuccess ? (
                <span className="text-emerald-400">✓ บันทึกสำเร็จ!</span>
              ) : isSubmitting ? (
                'กำลังบันทึก...'
              ) : (
                <>
                  <span>💾</span>
                  <span>บันทึกการเช็คชื่อ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Search & Sort controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-100">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 ค้นหาชื่อ หรือรหัสนักกีฬา..."
              className="w-full pl-3.5 pr-8 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-zinc-50/50 min-h-[40px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => toggleSort('name')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[38px] flex items-center gap-1 ${
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer min-h-[38px] flex items-center gap-1 ${
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
      </div>

      {/* Session Closed Alert Banner */}
      {isClosed && (
        <div className="bg-zinc-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-zinc-800 text-amber-400 flex items-center justify-center text-sm font-bold shrink-0">
              🔒
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-zinc-100">
                รอบการฝึกซ้อมนี้ปิดรอบและตัดยอดขาดแล้ว
              </p>
              <p className="text-[11px] text-zinc-400">
                ระบบสแกน QR ถูกล็อคเพื่อป้องกันการเช็คชื่อเข้าใหม่ • โค้ชสามารถแก้ไขสถานะย้อนหลังได้ในหน้านี้ (ระบบจะเก็บ Audit Log อัตโนมัติ)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-amber-400 border border-zinc-700 self-start sm:self-auto">
            LOCKED
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ROSTER TABLE (High-Touch Field Target Buttons) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs sm:text-sm text-zinc-600 whitespace-nowrap">
            <thead className="bg-zinc-50 text-[11px] uppercase font-bold text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 sm:px-6 py-3.5">รหัส</th>
                <th className="px-4 sm:px-6 py-3.5">ชื่อ - นามสกุล</th>
                <th className="px-4 sm:px-6 py-3.5 text-center">สถานะการเข้าซ้อม (เลือกสถานะ)</th>
                <th className="px-4 sm:px-6 py-3.5">หมายเหตุ / เหตุผลการลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {sortedAndFilteredRoster.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs text-zinc-400">
                    ไม่พบนักกีฬาที่ตรงกับคำค้นหา "{searchQuery}"
                  </td>
                </tr>
              ) : (
                sortedAndFilteredRoster.map((item) => {
                  const athleteId = item.athlete.id;
                  const currentStatus = statuses[athleteId];

                  return (
                    <tr key={athleteId} className="hover:bg-zinc-50/70 transition">
                      <td className="px-4 sm:px-6 py-4 font-mono font-bold text-xs text-zinc-700">
                        <input type="hidden" name="athleteId" value={athleteId} />
                        <span className="px-2 py-1 rounded bg-zinc-100">
                          {item.athlete.athleteCode}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 font-bold text-zinc-900">
                        {item.athlete.name}
                      </td>

                      {/* Touch-Optimized Large Radio Button Pills (Min height 44px for field finger tap) */}
                      <td className="px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          {/* มา (PRESENT) */}
                          <label
                            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all duration-150 min-h-[42px] min-w-[55px] flex items-center justify-center select-none active:scale-90 ${
                              currentStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md animate-pop scale-[1.03]'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`status_${athleteId}`}
                              value="PRESENT"
                              checked={currentStatus === 'PRESENT'}
                              onChange={() => handleStatusChange(athleteId, 'PRESENT')}
                              className="sr-only"
                            />
                            ✓ มา
                          </label>

                          {/* ขาด (ABSENT) */}
                          <label
                            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all duration-150 min-h-[42px] min-w-[55px] flex items-center justify-center select-none active:scale-90 ${
                              currentStatus === 'ABSENT'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-md animate-pop scale-[1.03]'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`status_${athleteId}`}
                              value="ABSENT"
                              checked={currentStatus === 'ABSENT'}
                              onChange={() => handleStatusChange(athleteId, 'ABSENT')}
                              className="sr-only"
                            />
                            ✕ ขาด
                          </label>

                          {/* ลา (LEAVE) */}
                          <label
                            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black cursor-pointer border transition-all duration-150 min-h-[42px] min-w-[55px] flex items-center justify-center select-none active:scale-90 ${
                              currentStatus === 'LEAVE'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-md animate-pop scale-[1.03]'
                                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`status_${athleteId}`}
                              value="LEAVE"
                              checked={currentStatus === 'LEAVE'}
                              onChange={() => handleStatusChange(athleteId, 'LEAVE')}
                              className="sr-only"
                            />
                            ⚠ ลา
                          </label>
                        </div>
                      </td>

                      {/* หมายเหตุ */}
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="text"
                          name={`notes_${athleteId}`}
                          value={notes[athleteId] || ''}
                          onChange={(e) => handleNotesChange(athleteId, e.target.value)}
                          placeholder="เช่น ลาป่วย, ติดสอบ"
                          className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white placeholder:text-zinc-300 min-h-[38px]"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Save Action Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-black bg-[#0F1115] hover:bg-zinc-800 active:bg-black text-white shadow-md transition disabled:opacity-50 cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
        >
          {savedSuccess ? (
            <span className="text-emerald-400">✓ บันทึกข้อมูลการเช็คชื่อทั้งหมดเรียบร้อยแล้ว</span>
          ) : isSubmitting ? (
            'กำลังบันทึกข้อมูล...'
          ) : (
            <>
              <span>💾</span>
              <span>บันทึกการเช็คชื่อทั้งหมด</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Modal: Close Session & Auto-Absent */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <span className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0">
                🔒
              </span>
              <div>
                <h3 className="text-base font-black text-zinc-900">
                  ยืนยันปิดรอบซ้อมและตัดยอด
                </h3>
                <p className="text-xs text-zinc-500">
                  {sessionDetails?.title}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-rose-800">
                  <span>⚠️</span>
                  <span>เงื่อนไขเมื่อปิดรอบซ้อม:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 text-rose-700">
                  <li>
                    นักกีฬาที่ยังไม่ได้เช็คชื่อหรือลา ({liveUnchecked} คน) จะถูกตัดเป็น <strong className="text-rose-950">&quot;ขาดซ้อม&quot;</strong> อัตโนมัติ
                  </li>
                  <li>
                    ระบบสแกน QR สำหรับรอบนี้จะถูกล็อคปิดทันที
                  </li>
                  <li>
                    โค้ชยังสามารถปรับเปลี่ยนสถานะย้อนหลังได้ตลอดเวลา (ระบบจะบันทึกประวัติ Audit Log ไว้)
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
              <button
                type="button"
                disabled={isClosingPending}
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition cursor-pointer min-h-[40px]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isClosingPending}
                onClick={handleConfirmCloseSession}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-xs transition cursor-pointer min-h-[40px] flex items-center gap-1.5 active:scale-95"
              >
                {isClosingPending ? (
                  <span>กำลังตัดยอด...</span>
                ) : (
                  <>
                    <span>🔒</span>
                    <span>ยืนยันปิดรอบ & ตัดยอดขาด</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
