import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../database/db';
import { authenticateAdmin } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { AuditService } from '../services/auditService';

export const publicDirectoryRoutes = Router();
export const directoryAdminRoutes = Router();

// ==========================================
// PUBLIC MOBILE DIRECTORY ENDPOINT
// ==========================================

publicDirectoryRoutes.get('/', (req: Request, res: Response) => {
  const db = getDatabase();
  const { category, state } = req.query;

  let query = `SELECT id, name, number, category, state, source_url, verified_on FROM emergency_directory WHERE is_active = 1`;
  const params: any[] = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  if (state) {
    query += ` AND (state = ? OR state = 'National')`;
    params.push(state);
  }

  query += ` ORDER BY category ASC, name ASC`;
  const helplines = db.prepare(query).all(...params);

  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour caching
  return res.json({
    total: helplines.length,
    timestamp: new Date().toISOString(),
    helplines,
  });
});

// ==========================================
// ADMIN DIRECTORY MANAGEMENT ENDPOINTS
// ==========================================

directoryAdminRoutes.use(authenticateAdmin);

const DirectorySchema = z.object({
  name: z.string().min(2).max(100),
  number: z.string().min(3).max(30),
  category: z.string().min(2).max(50),
  state: z.string().default('National'),
  sourceUrl: z.string().url(),
  verifiedOn: z.string().default(() => new Date().toISOString().slice(0, 10)),
  isActive: z.boolean().default(true),
});

directoryAdminRoutes.get('/', requirePermission('config.read'), (req: Request, res: Response) => {
  const db = getDatabase();
  const entries = db.prepare(`SELECT * FROM emergency_directory ORDER BY category ASC, updated_at DESC`).all();
  return res.json({ total: entries.length, entries });
});

directoryAdminRoutes.post('/', requirePermission('directory.manage'), async (req: Request, res: Response) => {
  const parsed = DirectorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { name, number, category, state, sourceUrl, verifiedOn, isActive } = parsed.data;
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO emergency_directory (id, name, number, category, state, source_url, verified_on, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, number, category, state, sourceUrl, verifiedOn, isActive ? 1 : 0, now, now);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'directory.create',
    objectType: 'emergency_directory',
    objectId: id,
    afterState: { name, number, category, state, sourceUrl, verifiedOn },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.status(201).json({ message: 'Directory entry registered', id });
});

directoryAdminRoutes.put('/:id', requirePermission('directory.manage'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const parsed = DirectorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const db = getDatabase();
  const existing = db.prepare(`SELECT * FROM emergency_directory WHERE id = ?`).get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Directory entry not found' });
  }

  const { name, number, category, state, sourceUrl, verifiedOn, isActive } = parsed.data;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE emergency_directory
    SET name = ?, number = ?, category = ?, state = ?, source_url = ?, verified_on = ?, is_active = ?, updated_at = ?
    WHERE id = ?
  `).run(name, number, category, state, sourceUrl, verifiedOn, isActive ? 1 : 0, now, id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'directory.update',
    objectType: 'emergency_directory',
    objectId: String(id),
    beforeState: existing,
    afterState: { name, number, category, state, sourceUrl, verifiedOn, isActive },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'Directory entry updated' });
});

directoryAdminRoutes.delete('/:id', requirePermission('directory.manage'), async (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const existing = db.prepare(`SELECT * FROM emergency_directory WHERE id = ?`).get(id) as any;
  if (!existing) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Directory entry not found' });
  }

  // Soft delete / deactivate
  db.prepare(`UPDATE emergency_directory SET is_active = 0, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'directory.deactivate',
    objectType: 'emergency_directory',
    objectId: String(id),
    beforeState: { is_active: existing.is_active },
    afterState: { is_active: 0 },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'Directory entry deactivated' });
});
