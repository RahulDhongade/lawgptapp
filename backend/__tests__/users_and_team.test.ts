import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { app } from '../src/app';
import { getDatabase, closeDatabase } from '../src/database/db';
import { config } from '../src/config/env';

describe('Phase 2: Users, Team, Roles, and Sessions Verification', () => {
  let db: any;
  let adminToken: string;
  let subadminToken: string;
  let supportToken: string;
  let adminId: string;
  let testUserId: string;

  const customHeader = { 'X-Requested-With': 'LawGPT-Admin' };

  beforeAll(() => {
    db = getDatabase(':memory:');

    adminId = crypto.randomUUID();
    const subadminId = crypto.randomUUID();
    const supportId = crypto.randomUUID();
    const passHash = bcrypt.hashSync('Pass123!', 10);

    // Create 1 admin
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(adminId, 'boss@lawgpt.in', passHash, 'Chief Admin', 'admin', new Date().toISOString(), new Date().toISOString());

    // Create 1 subadmin
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(subadminId, 'sub@lawgpt.in', passHash, 'Sub Admin', 'subadmin', new Date().toISOString(), new Date().toISOString());

    // Create 1 support
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(supportId, 'supp@lawgpt.in', passHash, 'Support Agent', 'support', new Date().toISOString(), new Date().toISOString());

    adminToken = jwt.sign({ id: adminId, email: 'boss@lawgpt.in', fullName: 'Chief Admin', role: 'admin' }, config.jwtSecret);
    subadminToken = jwt.sign({ id: subadminId, email: 'sub@lawgpt.in', fullName: 'Sub Admin', role: 'subadmin' }, config.jwtSecret);
    supportToken = jwt.sign({ id: supportId, email: 'supp@lawgpt.in', fullName: 'Support Agent', role: 'support' }, config.jwtSecret);

    // Seed test mobile user
    testUserId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (id, email, mobile, full_name, role, free_quota_used, is_suspended, is_blocked, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 2, 0, 0, ?, ?)
    `).run(testUserId, 'citizen.raj@example.com', '9876543210', 'Rajesh Sharma', 'citizen', new Date().toISOString(), new Date().toISOString());

    // Seed active session for this user
    db.prepare(`
      INSERT INTO user_sessions (id, user_id, device_id, device_name, refresh_token_hash, last_active_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), testUserId, 'dev_123', 'Pixel 8', 'hash_abc', new Date().toISOString(), new Date().toISOString());
  });

  afterAll(() => {
    closeDatabase();
  });

  // 1. User Directory & Dossier
  test('GET /api/admin/users lists users with search & pagination', async () => {
    const res = await request(app)
      .get('/api/admin/users?q=Rajesh')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].full_name).toBe('Rajesh Sharma');
    expect(res.body.pagination.total).toBe(1);
  });

  test('GET /api/admin/users/:id returns user details and active sessions', async () => {
    const res = await request(app)
      .get(`/api/admin/users/${testUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('citizen.raj@example.com');
    expect(res.body.sessions.length).toBe(1);
    expect(res.body.sessions[0].device_name).toBe('Pixel 8');
  });

  // 2. User Suspension, Quota Reset & Force Logout
  test('POST /api/admin/users/:id/suspend suspends account and terminates sessions', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${testUserId}/suspend`)
      .set(customHeader)
      .set('Authorization', `Bearer ${subadminToken}`)
      .send({ reason: 'Reported malicious automated scraping activity' });

    expect(res.status).toBe(200);

    const user = db.prepare('SELECT is_suspended, suspension_reason FROM users WHERE id = ?').get(testUserId);
    expect(user.is_suspended).toBe(1);
    expect(user.suspension_reason).toContain('scraping');

    // Verify session revoked
    const session = db.prepare('SELECT revoked_at FROM user_sessions WHERE user_id = ?').get(testUserId);
    expect(session.revoked_at).toBeDefined();

    // Verify audit log
    const audit = db.prepare("SELECT * FROM audit_logs WHERE action = 'users.suspend'").get();
    expect(audit).toBeDefined();
    expect(audit.object_id).toBe(testUserId);
  });

  test('POST /api/admin/users/:id/reset-quota resets quota to 0', async () => {
    const res = await request(app)
      .post(`/api/admin/users/${testUserId}/reset-quota`)
      .set(customHeader)
      .set('Authorization', `Bearer ${subadminToken}`);

    expect(res.status).toBe(200);
    const user = db.prepare('SELECT free_quota_used FROM users WHERE id = ?').get(testUserId);
    expect(user.free_quota_used).toBe(0);
  });

  // 3. Team Management & Last Admin Protection
  test('Superadmin can invite team members', async () => {
    const res = await request(app)
      .post('/api/admin/team/invite')
      .set(customHeader)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'newreviewer@lawgpt.in',
        fullName: 'Adv. Ananya Iyer',
        role: 'reviewer',
      });

    expect(res.status).toBe(201);
    expect(res.body.member.role).toBe('reviewer');
    expect(res.body.temporaryPassword).toBeDefined();
  });

  test('Unauthorized role cannot invite team members (Support -> 403)', async () => {
    const res = await request(app)
      .post('/api/admin/team/invite')
      .set(customHeader)
      .set('Authorization', `Bearer ${supportToken}`)
      .send({
        email: 'illegal@lawgpt.in',
        fullName: 'Illegal User',
        role: 'reviewer',
      });

    expect(res.status).toBe(403);
  });

  test('CRITICAL RULE: Cannot demote the last remaining administrator', async () => {
    // Only 1 admin exists currently (boss@lawgpt.in)
    const res = await request(app)
      .patch(`/api/admin/team/${adminId}/role`)
      .set(customHeader)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'reviewer' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('LAST_ADMIN_PROTECTED');
    expect(res.body.message).toContain('Cannot demote the last remaining administrator');
  });

  // 4. Session Revocation
  test('POST /api/admin/sessions/:type/:id/revoke revokes session with audit', async () => {
    const dummySessionId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_sessions (id, user_id, device_id, refresh_token_hash, last_active_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(dummySessionId, testUserId, 'dev_other', 'hash_xyz', new Date().toISOString(), new Date().toISOString());

    const res = await request(app)
      .post(`/api/admin/sessions/user/${dummySessionId}/revoke`)
      .set(customHeader)
      .set('Authorization', `Bearer ${subadminToken}`);

    expect(res.status).toBe(200);
    const session = db.prepare('SELECT revoked_at FROM user_sessions WHERE id = ?').get(dummySessionId);
    expect(session.revoked_at).not.toBeNull();
  });
});
