'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AthleteAttendanceStats, DashboardSummary } from '../src/core/domain/statistics';
import DashboardFilterBar from './DashboardFilterBar';

interface DashboardViewProps {
  dashboard: DashboardSummary;
  allAthletesStats: AthleteAttendanceStats[];
  period?: string;
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  teamName: string;
  isAdmin: boolean;
  seedRealisticDataAction: () => Promise<void>;
  clearDemoDataAction: () => Promise<void>;
}

export default function DashboardView({
  dashboard,
  allAthletesStats,
  period,
  periodLabel,
  startDate,
  endDate,
  teamName,
  isAdmin,
  seedRealisticDataAction,
  clearDemoDataAction,
}: DashboardViewProps) {
  // Mobile Active Tab: 'overview' | 'rankings' | 'roster'
  const [activeMobileTab, setActiveMobileTab] = useState<'overview' | 'rankings' | 'roster'>('overview');

  // Search & Filter State for Athletes Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'EXCELLENT' | 'MODERATE' | 'NEEDS_ATTENTION'>('ALL');

  // Calculations for Attendance Donut
  let totalPresents = 0;
  let totalAbsents = 0;
  let totalLeaves = 0;
  for (const s of allAthletesStats) {
    totalPresents += s.presentCount;
    totalAbsents += s.absentCount;
    totalLeaves += s.leaveCount;
  }
  const totalRecorded = totalPresents + totalAbsents + totalLeaves;
  const presentPct = totalRecorded > 0 ? (totalPresents / totalRecorded) * 100 : 0;
  const absentPct = totalRecorded > 0 ? (totalAbsents / totalRecorded) * 100 : 0;
  const leavePct = totalRecorded > 0 ? (totalLeaves / totalRecorded) * 100 : 0;

  const c = 251.32;
  const presentStroke = (presentPct / 100) * c;
  const absentStroke = (absentPct / 100) * c;
  const leaveStroke = (leavePct / 100) * c;

  // Club Readiness Score Calculation
  const readiness = useMemo(() => {
    const rate = dashboard.overallAttendanceRate;
    if (rate >= 85) {
      return {
        grade: 'A',
        label: 'ยอดเยี่ยม (High-Performance)',
        description: 'นักกีฬามีวินัยและความสม่ำเสมอสูงมาก พร้อมสำหรับการแข่งขัน',
        color: 'emerald',
        bg: 'bg-emerald-500',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        lightBg: 'bg-emerald-50',
      };
    } else if (rate >= 75) {
      return {
        grade: 'B+',
        label: 'ดีมาก (Consistent Team)',
        description: 'ภาพรวมการเข้าฝึกซ้อมอยู่ในเกณฑ์ดี มีความต่อเนื่องสม่ำเสมอ',
        color: 'teal',
        bg: 'bg-teal-500',
        text: 'text-teal-700',
        border: 'border-teal-200',
        lightBg: 'bg-teal-50',
      };
    } else if (rate >= 60) {
      return {
        grade: 'B',
        label: 'มาตรฐาน (Standard)',
        description: 'นักกีฬาส่วนใหญ่เข้าซ้อมตามเกณฑ์ปกติ มีบางส่วนควรสนับสนุนเพิ่มเติม',
        color: 'amber',
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        border: 'border-amber-200',
        lightBg: 'bg-amber-50',
      };
    } else if (rate >= 50) {
      return {
        grade: 'C',
        label: 'ปานกลาง (Needs Encouragement)',
        description: 'เริ่มมีอัตราการขาดซ้อมสะสม ควรตรวจเช็ครายบุคคลเพื่อกระตุ้นวินัย',
        color: 'orange',
        bg: 'bg-orange-500',
        text: 'text-orange-700',
        border: 'border-orange-200',
        lightBg: 'bg-orange-50',
      };
    } else {
      return {
        grade: 'D',
        label: 'ต้องติดตามเร่งด่วน (At Risk)',
        description: 'อัตราการขาดซ้อมสูงกว่า 50% ต้องพูดคุยกับนักกีฬาและผู้ปกครอง',
        color: 'rose',
        bg: 'bg-rose-500',
        text: 'text-rose-700',
        border: 'border-rose-200',
        lightBg: 'bg-rose-50',
      };
    }
  }, [dashboard.overallAttendanceRate]);

  // Filtered Athletes
  const filteredAthletes = useMemo(() => {
    return allAthletesStats.filter((a) => {
      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.athleteName.toLowerCase().includes(q) ||
        a.athleteCode.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Tier filter
      if (tierFilter === 'EXCELLENT') return a.attendanceRate >= 80;
      if (tierFilter === 'MODERATE') return a.attendanceRate >= 50 && a.attendanceRate < 80;
      if (tierFilter === 'NEEDS_ATTENTION') return a.totalSessions > 0 && a.attendanceRate < 50;

      return true;
    });
  }, [allAthletesStats, searchQuery, tierFilter]);

  const excellentCount = allAthletesStats.filter((a) => a.attendanceRate >= 80).length;
  const moderateCount = allAthletesStats.filter((a) => a.attendanceRate >= 50 && a.attendanceRate < 80).length;
  const attentionCount = allAthletesStats.filter((a) => a.totalSessions > 0 && a.attendanceRate < 50).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ========================================================= */}
      {/* 1. HERO HEADER: Sleek, Modern, High-Tech */}
      {/* ========================================================= */}
      <div className="bg-[#0F1115] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-md border border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
              WAVON ANALYTICS
            </span>
            <span className="text-xs text-zinc-400 font-bold">{teamName}</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-[11px] sm:text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              คำนวณเรียลไทม์
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            แดชบอร์ดภาพรวมสถิติการฝึกซ้อม
          </h1>
          <p className="mt-1 text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl hidden sm:block">
            ติดตามความสม่ำเสมอของนักกีฬา (Attendance Rate) ดัชนีความพร้อมสโมสร และวิเคราะห์แนวโน้มแบบเรียลไทม์
          </p>
        </div>

        {/* Admin Demo Seeder */}
        {isAdmin && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-col gap-2 shrink-0 self-start md:self-auto w-full md:w-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>ชุดข้อมูลทดสอบ</span>
              </span>
              <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.2 rounded bg-amber-400/10 border border-amber-400/20">
                ADMIN
              </span>
            </div>
            <div className="flex gap-2">
              <form action={seedRealisticDataAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer min-h-[34px] flex items-center justify-center gap-1"
                >
                  โหลด Demo
                </button>
              </form>
              <form action={clearDemoDataAction} className="flex-1">
                <button
                  type="submit"
                  className="w-full px-3 py-1.5 bg-zinc-800 hover:bg-rose-900/50 hover:text-rose-200 text-zinc-300 font-semibold text-xs rounded-lg border border-zinc-700 transition cursor-pointer min-h-[34px] flex items-center justify-center gap-1"
                >
                  ล้าง Demo
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. CLUB READINESS SCORE CARD (Premium High-Impact Banner) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-13 h-13 sm:w-15 sm:h-15 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl text-white shadow-md shrink-0 ${readiness.bg}`}
          >
            {readiness.grade}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">
                CLUB READINESS INDEX
              </span>
              <span
                className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${readiness.lightBg} ${readiness.text} ${readiness.border}`}
              >
                {readiness.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-900 mt-0.5">
              คะแนนความพร้อมสโมสร: <strong className="text-base sm:text-lg">{dashboard.overallAttendanceRate}%</strong>
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {readiness.description}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 text-xs text-zinc-500">
          <div className="text-left sm:text-right">
            <span className="block text-[10px] text-zinc-400">ประเมินจาก</span>
            <strong className="text-zinc-900">{allAthletesStats.length} นักกีฬา</strong>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-zinc-400">รอบฝึกซ้อม</span>
            <strong className="text-zinc-900">{dashboard.totalSessions} รอบ</strong>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DATE FILTER BAR (Clean & Responsive) */}
      {/* ========================================================= */}
      <DashboardFilterBar
        currentPeriod={period}
        periodLabel={periodLabel}
        startDate={startDate}
        endDate={endDate}
      />

      {/* ========================================================= */}
      {/* 4. MOBILE SEGMENTED TAB CONTROLS (< lg screens only) */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-16 z-20 -mx-1 px-1 py-1.5 bg-[#F8FAFC]/95 backdrop-blur-md">
        <div className="bg-zinc-200/80 p-1 rounded-2xl grid grid-cols-3 gap-1 shadow-inner text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveMobileTab('overview')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'overview'
                ? 'bg-white text-zinc-950 shadow-sm font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>📊</span>
            <span>ภาพรวม</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('rankings')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'rankings'
                ? 'bg-white text-zinc-950 shadow-sm font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>🏆</span>
            <span>อันดับ & วินัย</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab('roster')}
            className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeMobileTab === 'roster'
                ? 'bg-white text-zinc-950 shadow-sm font-black'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>🏃</span>
            <span>นักกีฬา ({allAthletesStats.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. SECTION: OVERVIEW (Key Metric Cards & Donut Chart) */}
      {/* Visible on Desktop ALWAYS; on Mobile only when 'overview' tab */}
      {/* ========================================================= */}
      <div className={`${activeMobileTab !== 'overview' ? 'hidden lg:block' : 'block'} space-y-4 sm:space-y-6`}>
        {/* 4 Key Metric Cards (Mobile: 2x2 Grid; Desktop: 4 Col) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Card 1: Attendance Rate */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 sm:p-5 shadow-xs hover-lift flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  ความสม่ำเสมอรวม
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    dashboard.overallAttendanceRate >= 80
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : dashboard.overallAttendanceRate >= 50
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {dashboard.overallAttendanceRate >= 80 ? 'ดีเยี่ยม' : dashboard.overallAttendanceRate >= 50 ? 'ปานกลาง' : 'ปรับปรุง'}
                </span>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900">
                  {dashboard.overallAttendanceRate}%
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium hidden sm:inline">เฉลี่ยรวม</span>
              </div>
            </div>
            <div className="mt-2.5 sm:mt-4 w-full bg-zinc-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dashboard.overallAttendanceRate >= 80
                    ? 'bg-emerald-500'
                    : dashboard.overallAttendanceRate >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, dashboard.overallAttendanceRate))}%` }}
              />
            </div>
          </div>

          {/* Card 2: Active Athletes */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 sm:p-5 shadow-xs hover-lift flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  นักกีฬาในสังกัด
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  ACTIVE
                </span>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900">
                  {dashboard.activeAthletes}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">/ {dashboard.totalAthletes} คน</span>
              </div>
            </div>
            <Link
              href="/athletes"
              className="mt-2.5 sm:mt-4 text-[10px] sm:text-xs font-bold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition"
            >
              <span>รายชื่อนักกีฬา</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Card 3: Total Sessions */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 sm:p-5 shadow-xs hover-lift flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  รอบการฝึกซ้อม
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                  SESSIONS
                </span>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900">
                  {dashboard.totalSessions}
                </span>
                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">รอบ</span>
              </div>
            </div>
            <Link
              href="/sessions"
              className="mt-2.5 sm:mt-4 text-[10px] sm:text-xs font-bold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition"
            >
              <span>ตารางรอบซ้อม</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Card 4: Today Summary */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-3.5 sm:p-5 shadow-xs hover-lift flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  รอบซ้อมวันนี้
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  TODAY
                </span>
              </div>
              {dashboard.todaySummary ? (
                <div className="mt-2 sm:mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
                    <span className="text-emerald-700">มา {dashboard.todaySummary.presentCount}</span>
                    <span className="text-rose-700">ขาด {dashboard.todaySummary.absentCount}</span>
                    <span className="text-amber-700">ลา {dashboard.todaySummary.leaveCount}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-500">
                    อัตราวันนี้: <strong className="text-zinc-900">{dashboard.todaySummary.attendanceRate}%</strong>
                  </p>
                </div>
              ) : (
                <div className="mt-2 sm:mt-3">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-400 italic">วันนี้ยังไม่มีรอบซ้อม</p>
                </div>
              )}
            </div>
            <Link
              href="/sessions"
              className="mt-2.5 sm:mt-4 text-[10px] sm:text-xs font-bold text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition"
            >
              <span>บันทึกการซ้อม</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Donut Chart & Breakdown Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>📊</span>
              <span>สัดส่วนการเข้าซ้อมสะสม ({periodLabel})</span>
            </h2>
            <span className="text-[10px] font-mono text-zinc-400 font-bold">ATTENDANCE BREAKDOWN</span>
          </div>

          {totalRecorded === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              ยังไม่มีข้อมูลการบันทึกการเช็คชื่อในช่วงเวลานี้
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 py-2">
              {/* SVG Donut */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
                  {/* Present */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${presentStroke} ${c}`}
                    strokeDashoffset="0"
                    className="transition-all duration-700"
                  />
                  {/* Absent */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f43f5e"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${absentStroke} ${c}`}
                    strokeDashoffset={`-${presentStroke}`}
                    className="transition-all duration-700"
                  />
                  {/* Leave */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${leaveStroke} ${c}`}
                    strokeDashoffset={`-${presentStroke + absentStroke}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl sm:text-2xl font-black text-zinc-900 block leading-none">
                    {dashboard.overallAttendanceRate}%
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase">เฉลี่ยรวม</span>
                </div>
              </div>

              {/* Legends */}
              <div className="grid grid-cols-3 sm:grid-cols-1 gap-2.5 sm:gap-3 text-xs w-full sm:w-auto">
                <div className="p-2.5 sm:p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-emerald-900 font-bold text-[11px] sm:text-xs">มาซ้อม</span>
                  </div>
                  <strong className="text-emerald-700 text-xs sm:text-sm font-black">
                    {totalPresents} <span className="text-[10px] font-normal text-emerald-600">({Math.round(presentPct)}%)</span>
                  </strong>
                </div>

                <div className="p-2.5 sm:p-2 rounded-xl bg-rose-50/60 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-rose-900 font-bold text-[11px] sm:text-xs">ขาดซ้อม</span>
                  </div>
                  <strong className="text-rose-700 text-xs sm:text-sm font-black">
                    {totalAbsents} <span className="text-[10px] font-normal text-rose-600">({Math.round(absentPct)}%)</span>
                  </strong>
                </div>

                <div className="p-2.5 sm:p-2 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-amber-900 font-bold text-[11px] sm:text-xs">ลาซ้อม</span>
                  </div>
                  <strong className="text-amber-700 text-xs sm:text-sm font-black">
                    {totalLeaves} <span className="text-[10px] font-normal text-amber-600">({Math.round(leavePct)}%)</span>
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. SECTION: RANKINGS & DISCIPLINE STANDARDS */}
      {/* Visible on Desktop ALWAYS; on Mobile only when 'rankings' tab */}
      {/* ========================================================= */}
      <div className={`${activeMobileTab !== 'rankings' ? 'hidden lg:block' : 'block'} space-y-4 sm:space-y-6`}>
        {/* Discipline 3-Tiers Overview */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>🎯</span>
              <span>เป้าหมายมาตรฐานวินัยนักกีฬา (Discipline Standard)</span>
            </h2>
            <span className="text-[10px] font-mono font-bold text-zinc-400">TARGET 80%+</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setTierFilter(tierFilter === 'EXCELLENT' ? 'ALL' : 'EXCELLENT');
                setActiveMobileTab('roster');
              }}
              className={`p-3 sm:p-4 rounded-xl text-left border transition cursor-pointer ${
                tierFilter === 'EXCELLENT'
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/20'
                  : 'border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50'
              }`}
            >
              <span className="text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span>🟢 ดีเยี่ยม (80%+)</span>
                <span className="text-[10px] text-emerald-600 font-mono">แตะดูกลุ่มนี้ →</span>
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {excellentCount} คน
              </span>
              <span className="text-[10px] text-emerald-600/90 mt-0.5 block">
                ผ่านเกณฑ์มาตรฐานสูงของสโมสร
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter(tierFilter === 'MODERATE' ? 'ALL' : 'MODERATE');
                setActiveMobileTab('roster');
              }}
              className={`p-3 sm:p-4 rounded-xl text-left border transition cursor-pointer ${
                tierFilter === 'MODERATE'
                  ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/20'
                  : 'border-amber-100 bg-amber-50/50 hover:bg-amber-50'
              }`}
            >
              <span className="text-xs font-bold text-amber-800 flex items-center justify-between">
                <span>🟡 ปานกลาง (50-79%)</span>
                <span className="text-[10px] text-amber-600 font-mono">แตะดูกลุ่มนี้ →</span>
              </span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {moderateCount} คน
              </span>
              <span className="text-[10px] text-amber-600/90 mt-0.5 block">
                ควรสนับสนุนให้มาซ้อมต่อเนื่อง
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter(tierFilter === 'NEEDS_ATTENTION' ? 'ALL' : 'NEEDS_ATTENTION');
                setActiveMobileTab('roster');
              }}
              className={`p-3 sm:p-4 rounded-xl text-left border transition cursor-pointer ${
                tierFilter === 'NEEDS_ATTENTION'
                  ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400/20'
                  : 'border-rose-100 bg-rose-50/50 hover:bg-rose-50'
              }`}
            >
              <span className="text-xs font-bold text-rose-800 flex items-center justify-between">
                <span>🔴 ต้องติดตาม (&lt;50%)</span>
                <span className="text-[10px] text-rose-600 font-mono">แตะดูกลุ่มนี้ →</span>
              </span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {attentionCount} คน
              </span>
              <span className="text-[10px] text-rose-600/90 mt-0.5 block">
                ขาดซ้อมบ่อย ควรพูดคุยรายบุคคล
              </span>
            </button>
          </div>
        </div>

        {/* Top 5 Attendees vs Top Absentees */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Attendees */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
            <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-100 bg-emerald-50/30 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>🏆</span>
                <span>มาซ้อมสม่ำเสมอที่สุด (Top Attendees)</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-100">
                TOP 5
              </span>
            </div>

            {dashboard.frequentAttendees.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">ยังไม่มีข้อมูลในช่วงเวลานี้</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {dashboard.frequentAttendees.map((a, idx) => (
                  <div
                    key={a.athleteId}
                    className="px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-zinc-50/80 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-xs'
                            : idx === 1
                            ? 'bg-zinc-300 text-zinc-800'
                            : idx === 2
                            ? 'bg-amber-700/20 text-amber-900'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/athletes/${a.athleteId}`}
                          className="text-xs font-bold text-zinc-900 hover:text-indigo-600 hover:underline block leading-tight"
                        >
                          {a.athleteName}
                        </Link>
                        <p className="text-[10px] text-zinc-400 font-mono">{a.athleteCode}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {a.attendanceRate}%
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        มา {a.presentCount}/{a.totalSessions} รอบ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Absentees */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden shadow-xs">
            <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-100 bg-rose-50/30 flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
                <span>⚠️</span>
                <span>ขาดซ้อมบ่อยที่สุด (Top Absentees)</span>
              </h3>
              <span className="text-[10px] font-bold text-rose-700 px-2 py-0.5 rounded-full bg-rose-100">
                ติดตาม
              </span>
            </div>

            {dashboard.frequentAbsentees.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">ยอดเยี่ยม! ไม่มีประวัตินักกีฬาขาดซ้อม</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {dashboard.frequentAbsentees.map((a, idx) => (
                  <div
                    key={a.athleteId}
                    className="px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-zinc-50/80 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <Link
                          href={`/athletes/${a.athleteId}`}
                          className="text-xs font-bold text-zinc-900 hover:text-indigo-600 hover:underline block leading-tight"
                        >
                          {a.athleteName}
                        </Link>
                        <p className="text-[10px] text-zinc-400 font-mono">{a.athleteCode}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        ขาด {a.absentCount} ครั้ง
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        ความสม่ำเสมอ: {a.attendanceRate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. SECTION: ALL ATHLETES ROSTER */}
      {/* Visible on Desktop ALWAYS; on Mobile only when 'roster' tab */}
      {/* ========================================================= */}
      <div className={`${activeMobileTab !== 'roster' ? 'hidden lg:block' : 'block'} space-y-3 sm:space-y-4`}>
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          {/* Header & Excel Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-sm sm:text-base font-black text-zinc-900 flex items-center gap-2">
                <span>🏃</span>
                <span>สถิตินักกีฬารายบุคคล ({allAthletesStats.length} คน)</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                ค้นหาและแตะที่ชื่อนักกีฬาเพื่อดูรายละเอียดไทม์ไลน์การเช็คชื่อ
              </p>
            </div>

            <a
              href={`/api/export/attendance${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`}
              download
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>📥</span>
              <span>ดาวน์โหลด Excel</span>
            </a>
          </div>

          {/* Search Bar & Tier Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ หรือรหัสนักกีฬา..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-zinc-900 placeholder:text-zinc-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] py-0.5">
              <button
                type="button"
                onClick={() => setTierFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                  tierFilter === 'ALL'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                }`}
              >
                ทั้งหมด ({allAthletesStats.length})
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('EXCELLENT')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                  tierFilter === 'EXCELLENT'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                🟢 80%+ ({excellentCount})
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('MODERATE')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                  tierFilter === 'MODERATE'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                🟡 50-79% ({moderateCount})
              </button>
              <button
                type="button"
                onClick={() => setTierFilter('NEEDS_ATTENTION')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                  tierFilter === 'NEEDS_ATTENTION'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                🔴 &lt;50% ({attentionCount})
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* MOBILE ATHLETE CARDS (< lg screens) - NO HORIZONTAL SCROLL! */}
          {/* ========================================================= */}
          <div className="lg:hidden space-y-2.5 pt-1">
            {filteredAthletes.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                ไม่พบนักกีฬาที่ตรงกับเงื่อนไขการค้นหา
              </div>
            ) : (
              filteredAthletes.map((stat) => (
                <Link
                  key={stat.athleteId}
                  href={`/athletes/${stat.athleteId}`}
                  className="block p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white active:bg-zinc-100 transition shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {stat.athleteName.charAt(0)}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 leading-tight">
                          {stat.athleteName}
                        </p>
                        <span className="text-[10px] font-mono font-bold text-zinc-400">
                          {stat.athleteCode}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${
                          stat.attendanceRate >= 80
                            ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                            : stat.attendanceRate >= 50
                            ? 'text-amber-700 bg-amber-100 border border-amber-200'
                            : 'text-rose-700 bg-rose-100 border border-rose-200'
                        }`}
                      >
                        {stat.attendanceRate}%
                      </span>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {stat.totalSessions} รอบ
                      </p>
                    </div>
                  </div>

                  {/* Attendance Micro-Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 flex overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${stat.totalSessions > 0 ? (stat.presentCount / stat.totalSessions) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${stat.totalSessions > 0 ? (stat.leaveCount / stat.totalSessions) * 100 : 0}%` }}
                      />
                      <div
                        className="bg-rose-500 h-full"
                        style={{ width: `${stat.totalSessions > 0 ? (stat.absentCount / stat.totalSessions) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                      <span className="text-emerald-700">มา: {stat.presentCount}</span>
                      <span className="text-amber-700">ลา: {stat.leaveCount}</span>
                      <span className="text-rose-700">ขาด: {stat.absentCount}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* ========================================================= */}
          {/* DESKTOP TABLE (>= lg screens) */}
          {/* ========================================================= */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-left text-xs text-zinc-600 whitespace-nowrap">
              <thead className="bg-zinc-50 uppercase font-bold text-zinc-500 border-b border-zinc-200 text-[11px]">
                <tr>
                  <th className="px-5 py-3">รหัส</th>
                  <th className="px-5 py-3">ชื่อ - นามสกุล</th>
                  <th className="px-5 py-3 text-center">รอบที่บันทึก</th>
                  <th className="px-5 py-3 text-center text-emerald-700">มา (Present)</th>
                  <th className="px-5 py-3 text-center text-rose-700">ขาด (Absent)</th>
                  <th className="px-5 py-3 text-center text-amber-700">ลา (Leave)</th>
                  <th className="px-5 py-3 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      ไม่พบนักกีฬาที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((stat) => (
                    <tr key={stat.athleteId} className="hover:bg-zinc-50/80 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-zinc-700">
                        <span className="px-2 py-0.5 rounded bg-zinc-100">
                          {stat.athleteCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-zinc-900">
                        <Link
                          href={`/athletes/${stat.athleteId}`}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1.5"
                        >
                          <span>{stat.athleteName}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">&rarr;</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium">
                        {stat.totalSessions} รอบ
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-emerald-700">
                        {stat.presentCount}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-rose-700">
                        {stat.absentCount}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-amber-700">
                        {stat.leaveCount}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-sm">
                        <span
                          className={`px-2.5 py-1 rounded-lg ${
                            stat.attendanceRate >= 80
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : stat.attendanceRate >= 50
                              ? 'text-amber-700 bg-amber-50 border border-amber-200'
                              : 'text-rose-700 bg-rose-50 border border-rose-200'
                          }`}
                        >
                          {stat.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
