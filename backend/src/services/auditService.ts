import crypto from 'crypto';
import { getDatabase } from '../database/db';
import { AdminRole } from '../security/permissions';

export interface AuditEntry {
  actorId: string;
  actorRole: AdminRole | string;
  action: string;
  objectType: string;
  objectId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogRow {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  object_type: string;
  object_id: string;
  before_state: string | null;
  after_state: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export class AuditService {
  /**
   * Appends an immutable audit log entry.
   * Can never be modified or deleted.
   */
  static log(entry: AuditEntry): AuditLogRow {
    const db = getDatabase();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, actor_id, actor_role, action, object_type, object_id,
        before_state, after_state, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.actorId,
      entry.actorRole,
      entry.action,
      entry.objectType,
      entry.objectId,
      entry.beforeState ? JSON.stringify(entry.beforeState) : null,
      entry.afterState ? JSON.stringify(entry.afterState) : null,
      entry.ipAddress || null,
      entry.userAgent || null,
      createdAt
    );

    return {
      id,
      actor_id: entry.actorId,
      actor_role: entry.actorRole,
      action: entry.action,
      object_type: entry.objectType,
      object_id: entry.objectId,
      before_state: entry.beforeState ? JSON.stringify(entry.beforeState) : null,
      after_state: entry.afterState ? JSON.stringify(entry.afterState) : null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      created_at: createdAt,
    };
  }

  /**
   * Retrieves audit logs with optional filters and pagination (Admin only).
   */
  static getLogs(filters?: {
    actorId?: string;
    action?: string;
    objectType?: string;
    limit?: number;
    offset?: number;
  }): AuditLogRow[] {
    const db = getDatabase();
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: unknown[] = [];

    if (filters?.actorId) {
      query += ' AND actor_id = ?';
      params.push(filters.actorId);
    }
    if (filters?.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters?.objectType) {
      query += ' AND object_type = ?';
      params.push(filters.objectType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(filters?.limit || 50, filters?.offset || 0);

    const stmt = db.prepare(query);
    return stmt.all(...params) as AuditLogRow[];
  }
}
