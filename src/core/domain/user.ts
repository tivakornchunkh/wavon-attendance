export type UserRole = 'ADMIN' | 'COACH';

export interface User {
  id: string;
  teamId: string;
  name: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

