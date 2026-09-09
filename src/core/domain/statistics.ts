export interface AthleteAttendanceStats {
  athleteId: string;
  athleteCode: string;
  athleteName: string;
  status?: 'ACTIVE' | 'INACTIVE';
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number; // Formula: (present / (total - leave)) * 100
}

export interface DashboardSummary {
  totalAthletes: number;
  activeAthletes: number;
  totalSessions: number;
  overallAttendanceRate: number;
  todaySummary?: {
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    attendanceRate: number;
  };
  frequentAttendees: AthleteAttendanceStats[]; // Top attendees
  frequentAbsentees: AthleteAttendanceStats[]; // Top absentees
}

export interface PeriodicStats {
  period: string; // เช่น "2026-03-01", "2026-W10", "2026-03"
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number;
}

