import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getDatabase } from '../../database/db';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { AuditService } from '../../services/auditService';

export const configAdminRoutes = Router();

configAdminRoutes.use(authenticateAdmin);

const UpdateConfigSchema = z.object({
  value: z.any(),
  valueType: z.enum(['boolean', 'string', 'number', 'object']),
  description: z.string().max(200).optional(),
  isPublic: z.boolean().default(false),
});

/**
 * GET /api/admin/config
 * List all application configurations
 */
configAdminRoutes.get('/', requirePermission('config.read'), (req: Request, res: Response) => {
  const db = getDatabase();
  const rows = db.prepare(`SELECT * FROM app_config ORDER BY key ASC`).all() as any[];

  return res.json({
    configs: rows.map((r) => {
      let parsedValue = r.value_json;
      try { parsedValue = JSON.parse(r.value_json); } catch {}
      return {
        key: r.key,
        value: parsedValue,
        valueType: r.value_type,
        description: r.description,
        isPublic: Boolean(r.is_public),
        updatedBy: r.updated_by,
        updatedAt: r.updated_at,
      };
    }),
  });
});

/**
 * PUT /api/admin/config/:key
 * Upsert configuration key
 */
configAdminRoutes.put('/:key', requirePermission('admin'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { key } = req.params;

  const parsed = UpdateConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { value, valueType, description, isPublic } = parsed.data;
  const now = new Date().toISOString();

  const existing = db.prepare(`SELECT * FROM app_config WHERE key = ?`).get(key) as any;

  db.prepare(`
    INSERT INTO app_config (key, value_json, value_type, description, is_public, updated_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      value_type = excluded.value_type,
      description = excluded.description,
      is_public = excluded.is_public,
      updated_by = excluded.updated_by,
      updated_at = excluded.updated_at
  `).run(
    key,
    JSON.stringify(value),
    valueType,
    description || existing?.description || null,
    isPublic ? 1 : 0,
    req.adminUser!.id,
    now
  );

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: existing ? 'config.update' : 'config.create',
    objectType: 'app_config',
    objectId: String(key),
    beforeState: existing ? { value: existing.value_json, is_public: existing.is_public } : null,
    afterState: { value, valueType, isPublic, description },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: `Configuration '${key}' saved successfully` });
});

/**
 * DELETE /api/admin/config/:key
 * Delete non-essential configuration key
 */
configAdminRoutes.delete('/:key', requirePermission('admin'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { key } = req.params;

  const existing = db.prepare(`SELECT * FROM app_config WHERE key = ?`).get(key) as any;
  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Config key not found' });
  }

  db.prepare(`DELETE FROM app_config WHERE key = ?`).run(key);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'config.delete',
    objectType: 'app_config',
    objectId: String(key),
    beforeState: { value: existing.value_json },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: `Configuration '${key}' deleted` });
});
