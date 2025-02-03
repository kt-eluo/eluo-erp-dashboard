export type UserRole = 'CPO' | 'BD/BM' | 'PM/PL' | 'PA' | 'Client';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}