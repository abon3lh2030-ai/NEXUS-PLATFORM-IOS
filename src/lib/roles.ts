/**
 * NEXUS organization roles (owner/admin/manager/member/viewer) mapped to the app's three home views.
 * What a person may actually do is still decided by their permissions (e.g. approvals.decide).
 */
export type HumanRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type AppRole = 'ceo' | 'manager' | 'employee';

export function appRoleFor(role: HumanRole): AppRole {
  if (role === 'owner') return 'ceo';
  if (role === 'admin' || role === 'manager') return 'manager';
  return 'employee';
}

export const APP_ROLE_LABEL: Record<AppRole, string> = { ceo: 'الرئيس التنفيذي', manager: 'مدير', employee: 'موظف' };
