export type AthleteStatus = 'ACTIVE' | 'INACTIVE';

export interface Athlete {
  id: string;
  teamId: string;
  athleteCode: string;
  name: string;
  phone?: string | null;
  startDate: string; // YYYY-MM-DD
  status: AthleteStatus;
  createdAt: string;
  updatedAt: string;
}

