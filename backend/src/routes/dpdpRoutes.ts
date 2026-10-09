import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../database/db';
import { authenticateAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { AuditService } from '../services/auditService';

export const publicDpdpRoutes = Router();
export const dpdpAdminRoutes = Router();

// ==========================================
// PUBLIC USER ERASURE REQUEST (DPDP ACT 2023)
// ==========================================

const DeletionRequestSchema = z.object({
  userId: z.string().min(1),
  userIdentifier: z.string().min(3).max(100), // Email or Mobile
  reason: z.string().max(500).optional(),
});

publicDpdpRoutes.post('/request-deletion', (req: Request, res: Response) => {
  const parsed = DeletionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { userId, userIdentifier } = parsed.data;
  const db = getDatabase();

  // Check if pending request already exists
  const existing = db.prepare(`
    SELECT id, status, sla_due_date FROM data_deletion_requests 
    WHERE user_id = ? AND status = 'pending'
  `).get(userId) as any;

  if (existing) {
    return res.status(200).json({
      message: 'A statutory data erasure request is already pending under DPDP Act SLA.',
      requestId: existing.id,
      slaDueDate: existing.sla_due_date,
    });
  }

  const id = `dpdp_${crypto.randomUUID().substring(0, 12)}`;
  const now = new Date();
  // Statutory 30-day SLA computation
  const slaDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO data_deletion_requests (id, user_id, user_identifier, status, sla_due_date, created_at)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(id, userId, userIdentifier, slaDueDate, now.toISOString());

  return res.status(201).json({
    message: 'DPDP Act data erasure request acknowledged. Statutory processing SLA initiated.',
    requestId: id,
    slaDueDate,
    statutoryNotice: 'Pursuant to the Digital Personal Data Protection Act, 2023, data will be purged within 30 days.',
  });
});

// ==========================================
// ADMIN DPDP STATUTORY ERASURE QUEUE
// ==========================================

dpdpAdminRoutes.use(authenticateAdmin);

dpdpAdminRoutes.get('/requests', requirePermission('users.read'), (req: Request, res: Response) => {
  const db = getDatabase();
  const { status = 'all' } = req.query;

  let query = `SELECT * FROM data_deletion_requests WHERE 1=1`;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, sla_due_date ASC`;

  const requests = db.prepare(query).all(...params) as any[];

  // Statistics
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedCount
    FROM data_deletion_requests
  `).get() as any;

  return res.json({
    stats: {
      total: stats?.total || 0,
      pending: stats?.pendingCount || 0,
      completed: stats?.completedCount || 0,
    },
    requests: requests.map((r) => {
      const isOverdue = r.status === 'pending' && new Date(r.sla_due_date).getTime() < Date.now();
      const daysRemaining = Math.ceil((new Date(r.sla_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        ...r,
        isOverdue,
        daysRemaining: r.status === 'pending' ? daysRemaining : null,
      };
    }),
  });
});

/**
 * POST /api/admin/dpdp/requests/:id/fulfill
 * Execute irreversible statutory data erasure
 */
dpdpAdminRoutes.post('/requests/:id/fulfill', requirePermission('admin'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const requestRow = db.prepare(`SELECT * FROM data_deletion_requests WHERE id = ?`).get(id) as any;
  if (!requestRow) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Erasure request not found' });
  }

  if (requestRow.status !== 'pending') {
    return res.status(400).json({ error: 'ALREADY_PROCESSED', message: `Request is already in '${requestRow.status}' state` });
  }

  const now = new Date().toISOString();
  const anonymizedHash = crypto.randomBytes(6).toString('hex');

  // Execute Anonymization / Erasure transaction
  db.transaction(() => {
    // 1. Erase personal identifiers in users table
    db.prepare(`
      UPDATE users 
      SET 
        full_name = 'DELETED_PRINCIPAL',
        email = ?,
        mobile = ?,
        bar_council_number = NULL,
        is_suspended = 1,
        is_blocked = 1,
        suspension_reason = 'DPDP Act 2023 Statutory Erasure',
        updated_at = ?
      WHERE id = ?
    `).run(
      `deleted_${anonymizedHash}@erased.internal`,
      `DEL_${anonymizedHash}`,
      now,
      requestRow.user_id
    );

    // 2. Revoke all active sessions
    db.prepare(`
      UPDATE user_sessions
      SET revoked_at = ?
      WHERE user_id = ?
    `).run(now, requestRow.user_id);

    // 3. Mark request as completed
    db.prepare(`
      UPDATE data_deletion_requests
      SET status = 'completed', completed_at = ?, completed_by = ?
      WHERE id = ?
    `).run(now, req.adminUser!.id, id);
  })();

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'dpdp.fulfill_erasure',
    objectType: 'data_deletion_requests',
    objectId: String(id),
    afterState: { userId: requestRow.user_id, status: 'completed', anonymizedHash },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({
    message: 'DPDP statutory erasure successfully executed. Data principal personal records purged and anonymized.',
    status: 'completed',
  });
});

/**
 * POST /api/admin/dpdp/requests/:id/reject
 * Reject erasure request due to statutory exception
 */
dpdpAdminRoutes.post('/requests/:id/reject', requirePermission('admin'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ error: 'MISSING_REASON', message: 'Statutory justification reason is required to reject an erasure request.' });
  }

  const requestRow = db.prepare(`SELECT * FROM data_deletion_requests WHERE id = ?`).get(id) as any;
  if (!requestRow) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Erasure request not found' });
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE data_deletion_requests
    SET status = 'rejected', rejection_reason = ?, completed_at = ?, completed_by = ?
    WHERE id = ?
  `).run(rejectionReason, now, req.adminUser!.id, id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'dpdp.reject_erasure',
    objectType: 'data_deletion_requests',
    objectId: String(id),
    afterState: { rejectionReason, status: 'rejected' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'Erasure request rejected with statutory justification', status: 'rejected' });
});
