import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { getDatabase } from '../../database/db';
import { AuditService } from '../../services/auditService';
import { ALL_ROLES, ROLE_PERMISSIONS, AdminRole } from '../../security/permissions';

export const teamRoutes = Router();

teamRoutes.use(authenticateAdmin);

const InviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(['support', 'reviewer', 'subadmin', 'admin']),
  initialPassword: z.string().min(8).optional(),
});

const ChangeRoleSchema = z.object({
  role: z.enum(['support', 'reviewer', 'subadmin', 'admin']),
});

/**
 * GET /api/admin/team
 */
teamRoutes.get('/', requirePermission('users.read'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const members = db.prepare(`
    SELECT id, email, full_name, role, totp_enabled, failed_login_attempts, locked_until, created_at
    FROM admin_users
    ORDER BY created_at ASC
  `).all();

  res.status(200).json({ members });
});

/**
 * GET /api/admin/team/permissions-matrix
 * Returns the live role × permission matrix directly from permissions engine.
 */
teamRoutes.get('/permissions-matrix', requirePermission('users.read'), (req: Request, res: Response): void => {
  res.status(200).json({
    roles: ALL_ROLES,
    matrix: ROLE_PERMISSIONS,
  });
});

/**
 * POST /api/admin/team/invite
 * Create / Invite new admin team member (Admin role only)
 */
teamRoutes.post('/invite', requirePermission('*'), (req: Request, res: Response): void => {
  const parseResult = InviteSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parseResult.error.format() });
    return;
  }

  const { email, fullName, role, initialPassword } = parseResult.data;
  const db = getDatabase();

  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'USER_EXISTS', message: 'An administrative user with this email already exists' });
    return;
  }

  // Generate strong random password if not provided
  const generatedPassword = initialPassword || crypto.randomBytes(12).toString('base64url');
  const passwordHash = bcrypt.hashSync(generatedPassword, 12);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, email, passwordHash, fullName, role, now, now);

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'team.invite_member',
    objectType: 'admin_user',
    objectId: id,
    afterState: { email, fullName, role },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(201).json({
    success: true,
    member: { id, email, fullName, role },
    temporaryPassword: generatedPassword,
    message: 'Team member created. Share the temporary password securely; 2FA setup is required upon first login.',
  });
});

/**
 * PATCH /api/admin/team/:id/role
 * Change admin member's role (Superadmin only).
 * ENFORCES: Cannot demote the last remaining administrator!
 */
teamRoutes.patch('/:id/role', requirePermission('*'), (req: Request, res: Response): void => {
  const parseResult = ChangeRoleSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid role selection' });
    return;
  }

  const targetId = String(req.params.id);
  const newRole = parseResult.data.role;
  const db = getDatabase();

  const targetUser = db.prepare('SELECT id, email, role, full_name FROM admin_users WHERE id = ?').get(targetId) as any;
  if (!targetUser) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Admin user not found' });
    return;
  }

  // Safety constraint: Prevent demoting the last remaining admin
  if (targetUser.role === 'admin' && newRole !== 'admin') {
    const adminCount = (db.prepare("SELECT COUNT(*) as c FROM admin_users WHERE role = 'admin' AND id != ?").get(targetId) as any).c;
    if (adminCount === 0) {
      res.status(400).json({
        error: 'LAST_ADMIN_PROTECTED',
        message: 'Cannot demote the last remaining administrator on the platform.',
      });
      return;
    }
  }

  db.prepare('UPDATE admin_users SET role = ?, updated_at = ? WHERE id = ?').run(
    newRole,
    new Date().toISOString(),
    targetId
  );

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'team.change_role',
    objectType: 'admin_user',
    objectId: targetId,
    beforeState: { role: targetUser.role },
    afterState: { role: newRole },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    success: true,
    message: `Updated ${targetUser.full_name}'s role to ${newRole}`,
    member: { id: targetId, role: newRole },
  });
});
