import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { app } from '../src/app';
import { getDatabase, closeDatabase } from '../src/database/db';
import { config } from '../src/config/env';

describe('Phase 5: Remote Config, Directory, and DPDP Act Compliance', () => {
  let db: any;
  let adminToken: string;
  let adminId: string;
  let testUserId: string;
  let deletionRequestId: string;
  let directoryEntryId: string;

  const customHeader = { 'X-Requested-With': 'LawGPT-Admin' };

  beforeAll(() => {
    db = getDatabase(':memory:');

    adminId = crypto.randomUUID();
    const passHash = bcrypt.hashSync('Pass123!', 10);

    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'chief@lawgpt.in', ?, 'Chief Administrator', 'admin', 1, ?, ?)
    `).run(adminId, passHash, new Date().toISOString(), new Date().toISOString());

    adminToken = jwt.sign({ id: adminId, email: 'chief@lawgpt.in', fullName: 'Chief Administrator', role: 'admin' }, config.jwtSecret);

    // Create mobile user for DPDP test
    testUserId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, mobile, full_name, role, created_at, updated_at)
      VALUES (?, 'vikram.singh@example.com', '9811223344', 'Vikram Singh', 'citizen', ?, ?)
    `).run(testUserId, new Date().toISOString(), new Date().toISOString());

    // Create active session for mobile user
    db.prepare(`
      INSERT INTO user_sessions (id, user_id, device_id, device_name, refresh_token_hash, last_active_at, created_at)
      VALUES (?, ?, 'dev_vikram', 'Samsung S24', 'hash_v', ?, ?)
    `).run(crypto.randomUUID(), testUserId, new Date().toISOString(), new Date().toISOString());
  });

  afterAll(() => {
    closeDatabase();
  });

  // 1. Remote App Configuration
  test('1. Admin upserts dynamic config and public /api/config reflects public key', async () => {
    const putRes = await request(app)
      .put('/api/admin/config-mgmt/min_supported_version')
      .set('Cookie', [`admin_access_token=${adminToken}`])
      .set(customHeader)
      .send({
        value: '2.1.0',
        valueType: 'string',
        description: 'Mandatory minimum version for BNS update',
        isPublic: true,
      });

    expect(putRes.status).toBe(200);

    // Verify public endpoint
    const pubRes = await request(app).get('/api/config');
    expect(pubRes.status).toBe(200);
    expect(pubRes.body.min_supported_version).toBe('2.1.0');
  });

  // 2. Emergency Directory
  test('2. Admin registers emergency helpline and public /api/directory distributes it', async () => {
    const createRes = await request(app)
      .post('/api/admin/directory')
      .set('Cookie', [`admin_access_token=${adminToken}`])
      .set(customHeader)
      .send({
        name: 'National Cyber Crime Reporting Helpline',
        number: '1930',
        category: 'cyber_crime',
        state: 'National',
        sourceUrl: 'https://cybercrime.gov.in',
        isActive: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();
    directoryEntryId = createRes.body.id;

    // Verify public mobile endpoint
    const pubDirRes = await request(app).get('/api/directory?category=cyber_crime');
    expect(pubDirRes.status).toBe(200);
    expect(pubDirRes.body.helplines.length).toBeGreaterThanOrEqual(1);
    expect(pubDirRes.body.helplines[0].number).toBe('1930');
  });

  // 3. DPDP Act Erasure Flow
  test('3. Mobile user requests statutory data erasure under DPDP Act 2023', async () => {
    const reqRes = await request(app)
      .post('/api/dpdp/request-deletion')
      .send({
        userId: testUserId,
        userIdentifier: 'vikram.singh@example.com',
        reason: 'User requests account closure and statutory data deletion under DPDP Act 2023.',
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.requestId).toBeDefined();
    expect(reqRes.body.slaDueDate).toBeDefined();
    deletionRequestId = reqRes.body.requestId;
  });

  test('4. Admin inspects DPDP queue and executes statutory erasure fulfillment', async () => {
    // 1. Check queue
    const listRes = await request(app)
      .get('/api/admin/dpdp/requests')
      .set('Cookie', [`admin_access_token=${adminToken}`]);

    expect(listRes.status).toBe(200);
    expect(listRes.body.stats.pending).toBeGreaterThanOrEqual(1);

    // 2. Fulfill erasure
    const fulfillRes = await request(app)
      .post(`/api/admin/dpdp/requests/${deletionRequestId}/fulfill`)
      .set('Cookie', [`admin_access_token=${adminToken}`])
      .set(customHeader)
      .send();

    expect(fulfillRes.status).toBe(200);
    expect(fulfillRes.body.status).toBe('completed');

    // 3. Verify user record is completely anonymized in database
    const userInDb = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId) as any;
    expect(userInDb.full_name).toBe('DELETED_PRINCIPAL');
    expect(userInDb.email).toContain('@erased.internal');
    expect(userInDb.is_blocked).toBe(1);

    // 4. Verify all user sessions were revoked
    const sessions = db.prepare('SELECT * FROM user_sessions WHERE user_id = ?').all(testUserId) as any[];
    for (const s of sessions) {
      expect(s.revoked_at).not.toBeNull();
    }
  });
});
