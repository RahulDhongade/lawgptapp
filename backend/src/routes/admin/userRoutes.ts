import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { getDatabase } from '../../database/db';
import { AuditService } from '../../services/auditService';

export const userRoutes = Router();

userRoutes.use(authenticateAdmin);

const SuspendSchema = z.object({
  reason: z.string().min(3).max(500),
});

/**
 * GET /api/admin/users
 * Paginated user directory with search and role/status filtering.
 */
userRoutes.get('/', requirePermission('users.read'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const q = req.query.q as string | undefined;
  const role = req.query.role as string | undefined;
  const status = req.query.status as string | undefined; // 'active' | 'suspended' | 'blocked'

  let query = 'SELECT id, email, mobile, full_name, role, bar_council_number, free_quota_used, is_suspended, is_blocked, created_at FROM users WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const params: unknown[] = [];
  const countParams: unknown[] = [];

  if (q) {
    const searchFilter = ' AND (full_name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
    query += searchFilter;
    countQuery += searchFilter;
    const term = `%${q}%`;
    params.push(term, term, term);
    countParams.push(term, term, term);
  }

  if (role) {
    query += ' AND role = ?';
    countQuery += ' AND role = ?';
    params.push(role);
    countParams.push(role);
  }

  if (status === 'suspended') {
    query += ' AND is_suspended = 1';
    countQuery += ' AND is_suspended = 1';
  } else if (status === 'blocked') {
    query += ' AND is_blocked = 1';
    countQuery += ' AND is_blocked = 1';
  } else if (status === 'active') {
    query += ' AND is_suspended = 0 AND is_blocked = 0';
    countQuery += ' AND is_suspended = 0 AND is_blocked = 0';
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const users = db.prepare(query).all(...params);
  const total = (db.prepare(countQuery).get(...countParams) as any)?.total || 0;

  res.status(200).json({
    users,
    pagination: {
      total,
      limit,
      offset,
    },
  });
});

/**
 * GET /api/admin/users/:id
 * Retrieve user detail dossier with active sessions and chat history statistics.
 */
userRoutes.get('/:id', requirePermission('users.read'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const userId = String(req.params.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  const sessions = db.prepare(`
    SELECT id, device_id, device_name, ip_address, last_active_at, revoked_at, created_at
    FROM user_sessions
    WHERE user_id = ?
    ORDER BY last_active_at DESC
  `).all(userId);

  res.status(200).json({
    user,
    sessions,
  });
});

/**
 * POST /api/admin/users/:id/suspend
 */
userRoutes.post('/:id/suspend', requirePermission('users.suspend'), (req: Request, res: Response): void => {
  const parseResult = SuspendSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Suspension reason is required' });
    return;
  }

  const db = getDatabase();
  const userId = String(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  db.prepare(`
    UPDATE users SET is_suspended = 1, suspension_reason = ?, updated_at = ? WHERE id = ?
  `).run(parseResult.data.reason, new Date().toISOString(), userId);

  // Automatically revoke user sessions on suspension
  db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
    new Date().toISOString(),
    userId
  );

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'users.suspend',
    objectType: 'user',
    objectId: userId,
    beforeState: { is_suspended: user.is_suspended, suspension_reason: user.suspension_reason },
    afterState: { is_suspended: 1, suspension_reason: parseResult.data.reason },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'User account suspended and active sessions terminated' });
});

/**
 * POST /api/admin/users/:id/unsuspend
 */
userRoutes.post('/:id/unsuspend', requirePermission('users.suspend'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const userId = String(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  db.prepare(`
    UPDATE users SET is_suspended = 0, suspension_reason = NULL, updated_at = ? WHERE id = ?
  `).run(new Date().toISOString(), userId);

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'users.unsuspend',
    objectType: 'user',
    objectId: userId,
    beforeState: { is_suspended: user.is_suspended, suspension_reason: user.suspension_reason },
    afterState: { is_suspended: 0, suspension_reason: null },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'User account unsuspended successfully' });
});

/**
 * POST /api/admin/users/:id/block
 */
userRoutes.post('/:id/block', requirePermission('users.suspend'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const userId = String(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  db.prepare(`
    UPDATE users SET is_blocked = 1, updated_at = ? WHERE id = ?
  `).run(new Date().toISOString(), userId);

  db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(
    new Date().toISOString(),
    userId
  );

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'users.block',
    objectType: 'user',
    objectId: userId,
    beforeState: { is_blocked: user.is_blocked },
    afterState: { is_blocked: 1 },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'User permanently blocked' });
});

/**
 * POST /api/admin/users/:id/reset-quota
 */
userRoutes.post('/:id/reset-quota', requirePermission('users.reset_quota'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const userId = String(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    return;
  }

  db.prepare(`
    UPDATE users SET free_quota_used = 0, updated_at = ? WHERE id = ?
  `).run(new Date().toISOString(), userId);

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'users.reset_quota',
    objectType: 'user',
    objectId: userId,
    beforeState: { free_quota_used: user.free_quota_used },
    afterState: { free_quota_used: 0 },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'Free question quota reset to 0 used' });
});

/**
 * POST /api/admin/users/:id/force-logout
 */
userRoutes.post('/:id/force-logout', requirePermission('sessions.revoke'), (req: Request, res: Response): void => {
  const db = getDatabase();
  const userId = String(req.params.id);

  const result = db.prepare(`
    UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL
  `).run(new Date().toISOString(), userId);

  AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'sessions.force_logout_user',
    objectType: 'user',
    objectId: userId,
    afterState: { revokedSessionsCount: result.changes },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: `Revoked ${result.changes} active user sessions` });
});
