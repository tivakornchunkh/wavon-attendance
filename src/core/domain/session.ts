export interface TrainingSession {
  id: string;
  teamId: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  createdBy: string;
  createdAt: string;
}

export interface SessionWithAttendanceInfo extends TrainingSession {
  totalAthletesCount: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  attendanceRate: number;
}

