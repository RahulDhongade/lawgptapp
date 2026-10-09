import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { AuditService } from '../../services/auditService';

export const testRoutes = Router();

testRoutes.use(authenticateAdmin);

/**
 * Route accessible by support, subadmin, and admin (has 'guest_quota.read')
 */
testRoutes.get('/support-feature', requirePermission('guest_quota.read'), (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Support scope access granted' });
});

/**
 * Route accessible by reviewer, subadmin, and admin (has 'content.review')
 */
testRoutes.get('/reviewer-feature', requirePermission('content.review'), (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Reviewer scope access granted' });
});

/**
 * Route accessible by subadmin and admin (has 'content.publish')
 * Demonstrates audit log recording on write.
 */
testRoutes.post('/publish-action', requirePermission('content.publish'), (req: Request, res: Response) => {
  const audit = AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.publish',
    objectType: 'content_version',
    objectId: 'test_version_123',
    beforeState: { status: 'reviewed' },
    afterState: { status: 'published' },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'Published successfully', auditId: audit.id });
});

/**
 * Route accessible by admin only (has 'audit.view' which only admin possesses via wildcard '*')
 */
testRoutes.post('/admin-exclusive', requirePermission('audit.view'), (req: Request, res: Response) => {
  const audit = AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'admin.super_action',
    objectType: 'system',
    objectId: 'global_config',
    beforeState: { state: 'locked' },
    afterState: { state: 'unlocked' },
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, message: 'Admin exclusive action executed', auditId: audit.id });
});
