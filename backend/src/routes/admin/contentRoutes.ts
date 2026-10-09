import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../../database/db';
import { authenticateAdmin } from '../../middleware/auth';
import { requirePermission } from '../../middleware/requirePermission';
import { AuditService } from '../../services/auditService';

export const contentAdminRoutes = Router();

// All routes require administrative authentication
contentAdminRoutes.use(authenticateAdmin);

const VALID_CONTENT_TYPES = [
  'rights',
  'glossary',
  'ipc_bns_mapping',
  'document_template',
  'law_of_the_day',
  'fir_guide',
  'cyber_fraud_guide',
  'legal_aid_entry',
] as const;

// Schemas
const CreateContentSchema = z.object({
  type: z.enum(VALID_CONTENT_TYPES),
  key: z.string().min(1).max(100),
  language: z.enum(['en', 'hi', 'mr']).default('en'),
  body: z.record(z.any()),
  source: z.string().optional(),
  sectionReference: z.string().optional(),
});

const CreateVersionSchema = z.object({
  body: z.record(z.any()),
  source: z.string().optional(),
  sectionReference: z.string().optional(),
});

const ReviewSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * GET /api/admin/content
 * List content items with filtering by type, language, status, and search
 */
contentAdminRoutes.get('/', requirePermission('content.read'), (req: Request, res: Response) => {
  const db = getDatabase();
  const { type, language, status, search, limit = '50', offset = '0' } = req.query;

  let query = `
    SELECT c.*, 
      v.version_number, 
      v.body_json, 
      v.source, 
      v.section_reference,
      v.created_by,
      u.full_name as author_name
    FROM content_item c
    LEFT JOIN content_version v ON c.current_version_id = v.id
    LEFT JOIN admin_users u ON v.created_by = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (type) {
    query += ` AND c.type = ?`;
    params.push(type);
  }
  if (language) {
    query += ` AND c.language = ?`;
    params.push(language);
  }
  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  if (search) {
    query += ` AND (c.key LIKE ? OR v.body_json LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const items = db.prepare(query).all(...params);

  // Total count
  let countQuery = `SELECT COUNT(*) as count FROM content_item c WHERE 1=1`;
  const countParams: any[] = [];
  if (type) {
    countQuery += ` AND c.type = ?`;
    countParams.push(type);
  }
  if (language) {
    countQuery += ` AND c.language = ?`;
    countParams.push(language);
  }
  if (status) {
    countQuery += ` AND c.status = ?`;
    countParams.push(status);
  }
  const total = (db.prepare(countQuery).get(...countParams) as any)?.count || 0;

  return res.json({
    total,
    items: items.map((item: any) => ({
      ...item,
      body: item.body_json ? JSON.parse(item.body_json) : null,
    })),
  });
});

/**
 * GET /api/admin/content/:id
 * Get details of a content item with its complete version history
 */
contentAdminRoutes.get('/:id', requirePermission('content.read'), (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const item = db.prepare(`SELECT * FROM content_item WHERE id = ?`).get(id) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Content item not found' });
  }

  const versions = db.prepare(`
    SELECT v.*, u.full_name as author_name, r.full_name as reviewer_name
    FROM content_version v
    LEFT JOIN admin_users u ON v.created_by = u.id
    LEFT JOIN admin_users r ON v.reviewed_by = r.id
    WHERE v.content_item_id = ?
    ORDER BY v.version_number DESC
  `).all(id);

  return res.json({
    item,
    versions: versions.map((v: any) => ({
      ...v,
      body: JSON.parse(v.body_json),
    })),
  });
});

/**
 * POST /api/admin/content
 * Create a new statutory content item and its initial draft version
 */
contentAdminRoutes.post('/', requirePermission('content.edit_draft'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const parsed = CreateContentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { type, key, language, body, source, sectionReference } = parsed.data;

  // Check unique constraint (type, key, language)
  const existing = db.prepare(`SELECT id FROM content_item WHERE type = ? AND key = ? AND language = ?`).get(type, key, language);
  if (existing) {
    return res.status(409).json({
      error: 'DUPLICATE_KEY',
      message: `A content item with type '${type}', key '${key}', and language '${language}' already exists`,
    });
  }

  const now = new Date().toISOString();
  const itemId = crypto.randomUUID();
  const versionId = crypto.randomUUID();

  const insertItem = db.prepare(`
    INSERT INTO content_item (id, type, key, language, status, current_version_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)
  `);

  const insertVersion = db.prepare(`
    INSERT INTO content_version (id, content_item_id, version_number, body_json, source, section_reference, created_by, review_status, created_at)
    VALUES (?, ?, 1, ?, ?, ?, ?, 'draft', ?)
  `);

  const transaction = db.transaction(() => {
    insertItem.run(itemId, type, key, language, versionId, now, now);
    insertVersion.run(versionId, itemId, JSON.stringify(body), source || null, sectionReference || null, req.adminUser!.id, now);
  });

  transaction();

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.create_draft',
    objectType: 'content_item',
    objectId: itemId,
    afterState: { type, key, language, version: 1, body },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.status(201).json({
    message: 'Content draft created successfully',
    itemId,
    versionId,
    versionNumber: 1,
  });
});

/**
 * POST /api/admin/content/:id/version
 * Create a new draft version for an existing content item
 */
contentAdminRoutes.post('/:id/version', requirePermission('content.edit_draft'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const parsed = CreateVersionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const item = db.prepare(`SELECT * FROM content_item WHERE id = ?`).get(id) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Content item not found' });
  }

  const latestVersion = db.prepare(`
    SELECT MAX(version_number) as max_v FROM content_version WHERE content_item_id = ?
  `).get(id) as any;
  const nextVersionNumber = (latestVersion?.max_v || 0) + 1;

  const now = new Date().toISOString();
  const versionId = crypto.randomUUID();
  const { body, source, sectionReference } = parsed.data;

  const insertVersion = db.prepare(`
    INSERT INTO content_version (id, content_item_id, version_number, body_json, source, section_reference, created_by, review_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `);

  const updateItem = db.prepare(`
    UPDATE content_item 
    SET current_version_id = ?, status = 'draft', updated_at = ?
    WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    insertVersion.run(versionId, id, nextVersionNumber, JSON.stringify(body), source || null, sectionReference || null, req.adminUser!.id, now);
    updateItem.run(versionId, now, id);
  });

  transaction();

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.new_version',
    objectType: 'content_item',
    objectId: String(id),
    beforeState: { current_version_id: item.current_version_id, status: item.status },
    afterState: { current_version_id: versionId, versionNumber: nextVersionNumber, status: 'draft' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.status(201).json({
    message: 'New draft version created',
    versionId,
    versionNumber: nextVersionNumber,
  });
});

/**
 * POST /api/admin/content/:id/submit-review
 * Submit draft version for review: draft -> in_review
 */
contentAdminRoutes.post('/:id/submit-review', requirePermission('content.edit_draft'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const item = db.prepare(`SELECT * FROM content_item WHERE id = ?`).get(id) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Content item not found' });
  }

  const version = db.prepare(`SELECT * FROM content_version WHERE id = ?`).get(item.current_version_id) as any;
  if (!version) {
    return res.status(400).json({ error: 'NO_VERSION', message: 'No current version to submit' });
  }

  if (version.review_status !== 'draft') {
    return res.status(400).json({ error: 'INVALID_STATE', message: `Cannot submit version with status '${version.review_status}' for review` });
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE content_version SET review_status = 'in_review' WHERE id = ?`).run(version.id);
  db.prepare(`UPDATE content_item SET status = 'in_review', updated_at = ? WHERE id = ?`).run(now, id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.submit_review',
    objectType: 'content_item',
    objectId: String(id),
    beforeState: { status: 'draft', versionId: version.id },
    afterState: { status: 'in_review', versionId: version.id },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'Content submitted for review', status: 'in_review' });
});

/**
 * POST /api/admin/content/:id/review
 * Mark version as reviewed: in_review -> reviewed
 */
contentAdminRoutes.post('/:id/review', requirePermission('content.review'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const parsed = ReviewSchema.safeParse(req.body);
  const notes = parsed.success ? parsed.data.notes : undefined;

  const item = db.prepare(`SELECT * FROM content_item WHERE id = ?`).get(id) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Content item not found' });
  }

  const version = db.prepare(`SELECT * FROM content_version WHERE id = ?`).get(item.current_version_id) as any;
  if (!version) {
    return res.status(400).json({ error: 'NO_VERSION', message: 'No current version' });
  }

  if (version.review_status !== 'in_review') {
    return res.status(400).json({ error: 'INVALID_STATE', message: `Can only review items currently 'in_review' (found '${version.review_status}')` });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE content_version 
    SET review_status = 'reviewed', reviewed_by = ?, review_notes = ?, reviewed_at = ?
    WHERE id = ?
  `).run(req.adminUser!.id, notes || null, now, version.id);

  db.prepare(`UPDATE content_item SET status = 'reviewed', updated_at = ? WHERE id = ?`).run(now, id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.mark_reviewed',
    objectType: 'content_item',
    objectId: String(id),
    beforeState: { status: 'in_review', versionId: version.id },
    afterState: { status: 'reviewed', versionId: version.id, notes, reviewer: req.adminUser!.id },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'Content marked as reviewed', status: 'reviewed' });
});

/**
 * POST /api/admin/content/:id/publish
 * Publish content version: reviewed -> published
 * 
 * HARD SERVER-SIDE ENFORCEMENT OF FOUR-EYES PRINCIPLE:
 * The admin who authored/edited the version cannot publish it!
 * A second authorized officer with 'content.publish' must publish.
 */
contentAdminRoutes.post('/:id/publish', requirePermission('content.publish'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;

  const item = db.prepare(`SELECT * FROM content_item WHERE id = ?`).get(id) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Content item not found' });
  }

  const version = db.prepare(`SELECT * FROM content_version WHERE id = ?`).get(item.current_version_id) as any;
  if (!version) {
    return res.status(400).json({ error: 'NO_VERSION', message: 'No current version to publish' });
  }

  // 1. Must be in 'reviewed' state to publish
  if (version.review_status !== 'reviewed') {
    return res.status(400).json({
      error: 'INVALID_STATE',
      message: `Content must be 'reviewed' prior to publication. Current status is '${version.review_status}'.`,
    });
  }

  // 2. CRITICAL FOUR-EYES RULE: Creator cannot self-publish their own content revision!
  if (version.created_by === req.adminUser!.id) {
    return res.status(403).json({
      error: 'FOUR_EYES_VIOLATION',
      message: 'Four-Eyes Governance: The author of a content revision cannot publish it. A second authorized administrator must verify and publish.',
    });
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE content_version SET review_status = 'published' WHERE id = ?`).run(version.id);
  db.prepare(`UPDATE content_item SET status = 'published', updated_at = ? WHERE id = ?`).run(now, id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.publish',
    objectType: 'content_item',
    objectId: String(id),
    beforeState: { status: 'reviewed', versionId: version.id, author: version.created_by },
    afterState: { status: 'published', versionId: version.id, publisher: req.adminUser!.id },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({ message: 'Content version published to LawGPT live mobile registry', status: 'published' });
});

/**
 * POST /api/admin/content/:id/revert
 * Revert content item to a previous version
 */
contentAdminRoutes.post('/:id/revert', requirePermission('content.publish'), async (req: Request, res: Response) => {
  const db = getDatabase();
  const { id } = req.params;
  const { targetVersionId } = req.body;

  if (!targetVersionId) {
    return res.status(400).json({ error: 'MISSING_PARAM', message: 'targetVersionId is required' });
  }

  const item = db.prepare(`SELECT * FROM content_item WHERE id = ?`).get(id) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Content item not found' });
  }

  const targetVersion = db.prepare(`
    SELECT * FROM content_version WHERE id = ? AND content_item_id = ?
  `).get(targetVersionId, id) as any;

  if (!targetVersion) {
    return res.status(404).json({ error: 'VERSION_NOT_FOUND', message: 'Target version not found for this item' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE content_item 
    SET current_version_id = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(targetVersion.id, targetVersion.review_status, now, id);

  await AuditService.log({
    actorId: req.adminUser!.id,
    actorRole: req.adminUser!.role,
    action: 'content.revert',
    objectType: 'content_item',
    objectId: String(id),
    beforeState: { current_version_id: item.current_version_id, status: item.status },
    afterState: { current_version_id: targetVersion.id, version_number: targetVersion.version_number, status: targetVersion.review_status },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  return res.json({
    message: `Content reverted to version ${targetVersion.version_number}`,
    currentVersionId: targetVersion.id,
    status: targetVersion.review_status,
  });
});
