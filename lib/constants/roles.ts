import { UserRole } from '@/types/user';

export const ROLE_PERMISSIONS = {
  CPO: {
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: true,
    canManageUsers: true
  },
  BD: {
    canViewAll: true,
    canEditBusiness: true,
    canViewReports: true
  },
  PM: {
    canViewProjects: true,
    canManageTeam: true,
    canEditProject: true
  },
  PA: {
    canViewAssignedTasks: true,
    canUpdateTaskStatus: true
  },
  CLIENT: {
    canViewOwnProjects: true,
    canSubmitFeedback: true
  }
} as const;

export const ALL_ROLES: UserRole[] = ['CPO', 'BD', 'PM', 'PA', 'CLIENT'];