export type UserRole = 'CPO' | 'BD' | 'PM' | 'PA' | 'CLIENT';

export interface UserProfile {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}