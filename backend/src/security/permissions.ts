/**
 * LawGPT Enterprise Permissions & Role-Based Access Control (RBAC) Specification
 * Single source of truth for all administrative authorization.
 */

export type AdminRole = 'user' | 'support' | 'reviewer' | 'subadmin' | 'admin';

export const ALL_ROLES: AdminRole[] = ['user', 'support', 'reviewer', 'subadmin', 'admin'];

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  // Mobile app user role - zero admin access
  user: [],

  // Support Tier: Read-only access to user dossiers, guest limits, and sessions
  support: [
    'users.read',
    'guest_quota.read',
    'sessions.read',
    'config.read',
  ],

  // Reviewer Tier: Content drafting, peer review, AI flagged queue inspection, and QA testing
  reviewer: [
    'users.read',
    'content.read',
    'content.edit_draft',
    'content.review',
    'ai.review_queue',
    'ai.qa_test',
    'feedback.read',
    'feedback.respond',
    'config.read',
  ],

  // Subadmin Tier: User moderation, session revocation, content publishing (with 4-eyes check), prompt edits
  subadmin: [
    'users.read',
    'users.suspend',
    'users.reset_quota',
    'guest_quota.read',
    'sessions.read',
    'sessions.revoke',
    'content.read',
    'content.edit_draft',
    'content.review',
    'content.publish',
    'ai.review_queue',
    'ai.qa_test',
    'ai.prompt_edit',
    'feedback.manage',
    'directory.manage',
    'config.read',
  ],

  // Admin Tier: Superuser authority. Superusers bypass granular checks via wildcard '*'
  admin: [
    '*',
  ],
};

/**
 * Checks if a given role possesses a specific permission.
 * Wildcard '*' grants all permissions.
 */
export function hasPermission(role: AdminRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) {
    return false;
  }
  if (permissions.includes('*')) {
    return true;
  }
  return permissions.includes(permission);
}

/**
 * Returns full list of effective permissions for a role.
 */
export function getRolePermissions(role: AdminRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}
