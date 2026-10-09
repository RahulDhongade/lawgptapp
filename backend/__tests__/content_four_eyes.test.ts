import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { app } from '../src/app';
import { getDatabase, closeDatabase } from '../src/database/db';
import { config } from '../src/config/env';

describe('Phase 3: Content Management & Four-Eyes Principle Verification', () => {
  let db: any;
  let authorToken: string;
  let publisherToken: string;
  let supportToken: string;
  let authorId: string;
  let publisherId: string;
  let contentItemId: string;

  const customHeader = { 'X-Requested-With': 'LawGPT-Admin' };

  beforeAll(() => {
    db = getDatabase(':memory:');

    authorId = crypto.randomUUID();
    publisherId = crypto.randomUUID();
    const supportId = crypto.randomUUID();
    const passHash = bcrypt.hashSync('Pass123!', 10);

    // 1. Author (Subadmin with content.edit_draft, content.review, content.publish)
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'author@lawgpt.in', ?, 'Drafting Officer', 'subadmin', 1, ?, ?)
    `).run(authorId, passHash, new Date().toISOString(), new Date().toISOString());

    // 2. Publisher (Admin with *)
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'publisher@lawgpt.in', ?, 'Supervising Admin', 'admin', 1, ?, ?)
    `).run(publisherId, passHash, new Date().toISOString(), new Date().toISOString());

    // 3. Support (Support with no content write/publish)
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'support@lawgpt.in', ?, 'Support Agent', 'support', 1, ?, ?)
    `).run(supportId, passHash, new Date().toISOString(), new Date().toISOString());

    authorToken = jwt.sign({ id: authorId, email: 'author@lawgpt.in', fullName: 'Drafting Officer', role: 'subadmin' }, config.jwtSecret);
    publisherToken = jwt.sign({ id: publisherId, email: 'publisher@lawgpt.in', fullName: 'Supervising Admin', role: 'admin' }, config.jwtSecret);
    supportToken = jwt.sign({ id: supportId, email: 'support@lawgpt.in', fullName: 'Support Agent', role: 'support' }, config.jwtSecret);
  });

  afterAll(() => {
    closeDatabase();
  });

  test('1. Author creates a new content item in draft state', async () => {
    const res = await request(app)
      .post('/api/admin/content')
      .set('Cookie', [`admin_access_token=${authorToken}`])
      .set(customHeader)
      .send({
        type: 'ipc_bns_mapping',
        key: 'ipc_420',
        language: 'en',
        body: {
          ipcSection: '420',
          bnsSection: '318(4)',
          title: 'Cheating and dishonestly inducing delivery of property',
          punishment: 'Up to 7 years imprisonment and fine',
        },
        source: 'Acts 45 & 46 of 2023',
        sectionReference: 'BNS Section 318(4)',
      });

    expect(res.status).toBe(201);
    expect(res.body.itemId).toBeDefined();
    expect(res.body.versionNumber).toBe(1);
    contentItemId = res.body.itemId;

    // Check item state in DB
    const item = db.prepare('SELECT * FROM content_item WHERE id = ?').get(contentItemId) as any;
    expect(item.status).toBe('draft');
  });

  test('2. Public mobile endpoint DOES NOT expose unreviewed draft items', async () => {
    const res = await request(app).get('/api/content/ipc_bns_mapping?language=en');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.items).toHaveLength(0);
  });

  test('3. Author submits draft for review (transitions to in_review)', async () => {
    const res = await request(app)
      .post(`/api/admin/content/${contentItemId}/submit-review`)
      .set('Cookie', [`admin_access_token=${authorToken}`])
      .set(customHeader)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_review');

    const item = db.prepare('SELECT * FROM content_item WHERE id = ?').get(contentItemId) as any;
    expect(item.status).toBe('in_review');
  });

  test('4. Supervisor reviews content (transitions to reviewed)', async () => {
    const res = await request(app)
      .post(`/api/admin/content/${contentItemId}/review`)
      .set('Cookie', [`admin_access_token=${publisherToken}`])
      .set(customHeader)
      .send({ notes: 'Verified against official gazette notification. Ready for release.' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('reviewed');

    const item = db.prepare('SELECT * FROM content_item WHERE id = ?').get(contentItemId) as any;
    expect(item.status).toBe('reviewed');
  });

  test('5. ENFORCEMENT OF FOUR-EYES PRINCIPLE: Author CANNOT self-publish their own content revision', async () => {
    // authorId authored this version in step 1. Author attempts to publish it.
    const res = await request(app)
      .post(`/api/admin/content/${contentItemId}/publish`)
      .set('Cookie', [`admin_access_token=${authorToken}`])
      .set(customHeader)
      .send();

    // Must be blocked with HTTP 403 FOUR_EYES_VIOLATION
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FOUR_EYES_VIOLATION');
    expect(res.body.message).toContain('Four-Eyes Governance');

    // Confirm DB still has not published it
    const item = db.prepare('SELECT * FROM content_item WHERE id = ?').get(contentItemId) as any;
    expect(item.status).toBe('reviewed');
  });

  test('6. Second authorized administrator publishes the version successfully', async () => {
    // publisherId is different from authorId
    const res = await request(app)
      .post(`/api/admin/content/${contentItemId}/publish`)
      .set('Cookie', [`admin_access_token=${publisherToken}`])
      .set(customHeader)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');

    const item = db.prepare('SELECT * FROM content_item WHERE id = ?').get(contentItemId) as any;
    expect(item.status).toBe('published');
  });

  test('7. Public mobile distribution endpoint serves published content with ETag and caching headers', async () => {
    const res = await request(app).get('/api/content/ipc_bns_mapping?language=en');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.items[0].key).toBe('ipc_420');
    expect(res.body.items[0].data.bnsSection).toBe('318(4)');
    expect(res.header['etag']).toBeDefined();
    expect(res.header['cache-control']).toContain('public');

    const etag = res.header['etag'];

    // If-None-Match condition returns 304 Not Modified
    const cacheRes = await request(app)
      .get('/api/content/ipc_bns_mapping?language=en')
      .set('If-None-Match', etag);

    expect(cacheRes.status).toBe(304);
  });

  test('8. Audit log records all mutations append-only', async () => {
    const logs = db.prepare(`SELECT * FROM audit_logs WHERE object_id = ? ORDER BY created_at ASC`).all(contentItemId) as any[];
    expect(logs.length).toBeGreaterThanOrEqual(4);
    const actions = logs.map(l => l.action);
    expect(actions).toContain('content.create_draft');
    expect(actions).toContain('content.submit_review');
    expect(actions).toContain('content.mark_reviewed');
    expect(actions).toContain('content.publish');
  });
});
