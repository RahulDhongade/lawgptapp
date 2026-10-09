import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { AuditService } from '../../services/auditService';

export const auditRoutes = Router();

// Gated strictly with requirePermission('audit.view')
auditRoutes.use(authenticateAdmin);

/**
 * GET /api/admin/audit
 * Returns paginated audit logs.
 */
auditRoutes.get('/', requirePermission('audit.view'), (req: Request, res: Response): void => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const actorId = req.query.actorId as string | undefined;
  const action = req.query.action as string | undefined;
  const objectType = req.query.objectType as string | undefined;

  const logs = AuditService.getLogs({
    limit,
    offset,
    actorId,
    action,
    objectType,
  });

  res.status(200).json({
    logs,
    pagination: {
      limit,
      offset,
      count: logs.length,
    },
  });
});

/**
 * GET /api/admin/audit/export
 * Exports audit logs as CSV for administrative compliance.
 */
auditRoutes.get('/export', requirePermission('audit.view'), (req: Request, res: Response): void => {
  const logs = AuditService.getLogs({ limit: 1000, offset: 0 });

  const headers = ['id', 'actor_id', 'actor_role', 'action', 'object_type', 'object_id', 'ip_address', 'created_at'];
  const rows = logs.map((log) => [
    log.id,
    log.actor_id,
    log.actor_role,
    `"${log.action.replace(/"/g, '""')}"`,
    `"${log.object_type.replace(/"/g, '""')}"`,
    log.object_id,
    log.ip_address || '',
    log.created_at,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=lawgpt-audit-log-${Date.now()}.csv`);
  res.status(200).send(csvContent);
});
