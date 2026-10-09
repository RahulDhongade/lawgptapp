import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { getDatabase } from '../../database/db';
import { AuditService } from '../../services/auditService';

export const sessionRoutes = Router();

sessionRoutes.use(authenticateAdmin);

/**
 * GET /api/admin/sessions
 * Returns active user and admin web sessions.
 */
sessionRoutes.get('/', requirePermission('sessions.read'), (req: Request, res: Response): void => {
  const db = getDatabase();

  const adminSessions = db.prepare(`
    SELECT s.id, s.admin_user_id, u.email as admin_email, u.full_name, u.role,
           s.user_agent, s.ip_address, s.expires_at, s.revoked_at, s.created_at
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    ORDER BY s.created_at DESC
    LIMIT 50
  `).all();

  const userSessions = db.prepare(`
    SELECT s.id, s.user_id, u.email as user_email, u.full_name, s.device_id, s.device_name,
           s.ip_address, s.last_active_at, s.revoked_at, s.created_at
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.last_active_at DESC
    LIMIT 50
  `).all();

  res.status(200).json({
    adminSessions,
    userSessions,
  });
});

/**
 * POST /api/admin/sessions/:type/:id/revoke
 * Revokes an admin session or mobile user session.
 */
sessionRoutes.post('/:type/:id/revoke', requirePermission('sessions.revoke'), (req: Request, res: Response): void => {
  const type = String(req.params.type);
  const id = String(req.params.id);
  const db = getDatabase();
  const now = new Date().toISOString();

  if (type === 'admin') {
    const session = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(id) as any;
    if (!session) {
      res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'Admin session not found' });
      return;
    }

    db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE id = ?').run(now, id);

    AuditService.log({
      actorId: req.adminUser!.id,
      actorRole: req.adminUser!.role,
      action: 'sessions.revoke_admin_session',
      objectType: 'admin_session',
      objectId: id,
      afterState: { revoked_at: now },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, message: 'Admin session revoked successfully' });
    return;
  }

  if (type === 'user') {
    const session = db.prepare('SELECT * FROM user_sessions WHERE id = ?').get(id) as any;
    if (!session) {
      res.status(404).json({ error: 'SESSION_NOT_FOUND', message: 'User session not found' });
      return;
    }

    db.prepare('UPDATE user_sessions SET revoked_at = ? WHERE id = ?').run(now, id);

    AuditService.log({
      actorId: req.adminUser!.id,
      actorRole: req.adminUser!.role,
      action: 'sessions.revoke_user_session',
      objectType: 'user_session',
      objectId: id,
      afterState: { revoked_at: now },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({ success: true, message: 'User mobile device session revoked successfully' });
    return;
  }

  res.status(400).json({ error: 'INVALID_TYPE', message: 'Type must be admin or user' });
});
