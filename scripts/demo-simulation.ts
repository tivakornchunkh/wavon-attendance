import { db } from '../src/server/db/client';
import { teams, users, athletes, trainingSessions, attendances, attendanceLogs } from '../src/server/db/schema';
import { AthleteRepository } from '../src/server/repositories/athlete.repo';
import { SessionRepository } from '../src/server/repositories/session.repo';
import { AttendanceRepository } from '../src/server/repositories/attendance.repo';
import { AthleteService } from '../src/core/services/athlete.service';
import { SessionService } from '../src/core/services/session.service';
import { AttendanceService } from '../src/core/services/attendance.service';
import { StatisticsService } from '../src/core/services/statistics.service';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function main() {
  console.log('🚀 === WAVON Athlete Attendance: Core System Simulation ===\n');

  const athleteRepo = new AthleteRepository(db);
  const sessionRepo = new SessionRepository(db);
  const attendanceRepo = new AttendanceRepository(db);

  const athleteService = new AthleteService(athleteRepo);
  const sessionService = new SessionService(sessionRepo, athleteRepo, attendanceRepo);
  const attendanceService = new AttendanceService(attendanceRepo, sessionRepo);
  const statsService = new StatisticsService(attendanceRepo, athleteRepo, sessionRepo);

  // 1. Initial Setup: Team & Coach
  const teamId = 'team-wavon-pro';
  const coachId = 'coach-matt';

  // เคลียร์ข้อมูลจำลองเก่าของทีมนักกีฬานี้ออกก่อน เพื่อให้สามารถรันซ้ำได้เรื่อยๆ โดยไม่ติด duplicate error
  await db.delete(teams).where(eq(teams.id, teamId));

  await db.insert(teams).values({ id: teamId, name: 'WAVON Elite Academy' });
  await db.insert(users).values({
    id: coachId,
    teamId,
    name: 'Head Coach Matt',
    username: 'coach_matt',
    passwordHash: 'argon2_or_bcrypt_hash',
    role: 'COACH',
  });

  console.log('✅ 1. Team & Coach initialized.');

  // 2. Register Athletes (Testing Auto-code & Custom Code)
  console.log('\n🏃 2. Registering Athletes...');
  const a1 = await athleteService.createAthlete({
    teamId,
    name: 'Somchai Jaidee',
    phone: '0812345678',
    startDate: '2026-01-01',
    status: 'ACTIVE',
  });
  console.log(`   - Created ${a1.name} with auto-code: [${a1.athleteCode}]`);

  const a2 = await athleteService.createAthlete({
    teamId,
    athleteCode: 'NO-10', // Custom code
    name: 'Wichai Thongdee',
    phone: '0898765432',
    startDate: '2026-01-01',
    status: 'ACTIVE',
  });
  console.log(`   - Created ${a2.name} with custom code: [${a2.athleteCode}]`);

  const a3 = await athleteService.createAthlete({
    teamId,
    name: 'Komsan Srisuk',
    startDate: '2026-03-15', // Joined mid-month
    status: 'ACTIVE',
  });
  console.log(`   - Created ${a3.name} with auto-code: [${a3.athleteCode}] (Joined 2026-03-15)`);

  // 3. Create Training Sessions
  console.log('\n📅 3. Creating Training Sessions...');
  const s1 = await sessionService.createPlannedSession({
    teamId,
    title: 'Morning Drills & Conditioning',
    date: '2026-03-01',
    startTime: '07:00',
    endTime: '09:00',
    createdBy: coachId,
  });
  console.log(`   - Session 1: ${s1.title} (${s1.date} ${s1.startTime}-${s1.endTime})`);

  const s2 = await sessionService.createPlannedSession({
    teamId,
    title: 'Tactical Play & Scrimmage',
    date: '2026-03-10',
    startTime: '16:00',
    endTime: '18:00',
    createdBy: coachId,
  });
  console.log(`   - Session 2: ${s2.title} (${s2.date} ${s2.startTime}-${s2.endTime})`);

  // 4. Check Roster Eligibility for Session 1 (Before Athlete 3 joined)
  console.log('\n📋 4. Checking Eligibility Roster for Session 1 (2026-03-01)...');
  const { roster } = await sessionService.getSessionAttendanceRoster(s1.id);
  console.log(`   - Eligible athletes on roster: ${roster.map((r) => r.athlete.name).join(', ')}`);
  console.log(`   (Note: Komsan is automatically excluded because start_date > 2026-03-01)`);

  // 5. Batch Check-in
  console.log('\n✍️  5. Recording Attendance for Session 1...');
  await attendanceService.recordBatchAttendance({
    sessionId: s1.id,
    checkedBy: coachId,
    records: [
      { athleteId: a1.id, status: 'PRESENT' },
      { athleteId: a2.id, status: 'ABSENT', notes: 'Unnotified absence' },
    ],
  });
  console.log('   - Recorded: Somchai = PRESENT, Wichai = ABSENT');

  // Also record Session 2
  await attendanceService.recordBatchAttendance({
    sessionId: s2.id,
    checkedBy: coachId,
    records: [
      { athleteId: a1.id, status: 'PRESENT' },
      { athleteId: a2.id, status: 'PRESENT' },
    ],
  });
  console.log('   - Session 2 Recorded: Somchai = PRESENT, Wichai = PRESENT');

  // 6. Retroactive Status Update & Audit Logging
  console.log('\n🔄 6. Retroactive Update (Coach updates Wichai from ABSENT -> LEAVE)...');
  const existingAtt = await attendanceRepo.findBySessionAndAthlete(s1.id, a2.id);
  if (existingAtt) {
    await attendanceService.updateAttendance(existingAtt.id, {
      status: 'LEAVE',
      changedBy: coachId,
      reason: 'Parent submitted doctor note',
    });
    console.log('   - Updated status to LEAVE with reason: "Parent submitted doctor note"');
  }

  // Check Audit Log
  const logs = await attendanceService.getSessionAuditLogs(s1.id);
  console.log(`\n🔍 7. Audit Log for Session 1 (Found ${logs.length} log):`);
  logs.forEach((log) => {
    console.log(`   - [${log.changedAt}] Status changed from ${log.previousStatus} -> ${log.newStatus} by ${log.changedBy}`);
    console.log(`     Reason: "${log.reason}"`);
  });

  // 8. Calculate Statistics & Dashboard
  console.log('\n📊 8. Generating Statistics & Dashboard Summary...');
  const somchaiStats = await statsService.getAthleteStats(a1.id);
  const wichaiStats = await statsService.getAthleteStats(a2.id);

  console.log(`   - ${somchaiStats.athleteName} ([${somchaiStats.athleteCode}]):`);
  console.log(`     Total: ${somchaiStats.totalSessions} | Present: ${somchaiStats.presentCount} | Absent: ${somchaiStats.absentCount} | Leave: ${somchaiStats.leaveCount}`);
  console.log(`     Attendance Rate: ${somchaiStats.attendanceRate}%`);

  console.log(`   - ${wichaiStats.athleteName} ([${wichaiStats.athleteCode}]):`);
  console.log(`     Total: ${wichaiStats.totalSessions} | Present: ${wichaiStats.presentCount} | Absent: ${wichaiStats.absentCount} | Leave: ${wichaiStats.leaveCount}`);
  console.log(`     Attendance Rate: ${wichaiStats.attendanceRate}% (Formula: 1 Present / (2 Total - 1 Leave) * 100)`);

  const dashboard = await statsService.getDashboardSummary(teamId);
  console.log('\n📈 === Team Dashboard Summary ===');
  console.log(`   Total Athletes: ${dashboard.totalAthletes} (Active: ${dashboard.activeAthletes})`);
  console.log(`   Total Sessions: ${dashboard.totalSessions}`);
  console.log(`   Overall Attendance Rate: ${dashboard.overallAttendanceRate}%`);
  console.log(`   Top Attendees: ${dashboard.frequentAttendees.map((a) => `${a.athleteName} (${a.attendanceRate}%)`).join(', ')}`);

  console.log('\n🎉 Simulation completed successfully! All business logic verified.');
}

main().catch((err) => {
  console.error('Error running simulation:', err);
  process.exit(1);
});

