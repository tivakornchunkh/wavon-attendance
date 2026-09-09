export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';

export interface Attendance {
  id: string;
  sessionId: string;
  athleteId: string;
  status: AttendanceStatus;
  checkedAt: string;
  checkedBy: string;
  notes?: string | null;
}

export interface AttendanceLog {
  id: string;
  attendanceId: string;
  sessionId: string;
  athleteId: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  changedBy: string;
  changedAt: string;
  reason?: string | null;
}

export interface AttendanceWithAthlete extends Attendance {
  athlete: {
    id: string;
    athleteCode: string;
    name: string;
    phone?: string | null;
    status: string;
  };
}

