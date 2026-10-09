import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import { app } from '../src/app';
import { getDatabase, closeDatabase } from '../src/database/db';
import { config } from '../src/config/env';
import { AdminRole } from '../src/security/permissions';

describe('Phase 1: Security Foundation & RBAC Matrix Tests', () => {
  let db: any;

  // Test credentials and secrets
  const testUsers: Record<
    AdminRole | 'locked',
    { id: string; email: string; role: AdminRole; secret: string; token: string }
  > = {
    user: { id: '', email: 'user@lawgpt.in', role: 'user', secret: '', token: '' },
    support: { id: '', email: 'support@lawgpt.in', role: 'support', secret: '', token: '' },
    reviewer: { id: '', email: 'reviewer@lawgpt.in', role: 'reviewer', secret: '', token: '' },
    subadmin: { id: '', email: 'subadmin@lawgpt.in', role: 'subadmin', secret: '', token: '' },
    admin: { id: '', email: 'admin@lawgpt.in', role: 'admin', secret: '', token: '' },
    locked: { id: '', email: 'locked@lawgpt.in', role: 'reviewer', secret: '', token: '' },
  };

  const passwordPlain = 'SuperSecurePass123!';
  const passwordHash = bcrypt.hashSync(passwordPlain, 10);

  beforeAll(() => {
    // Connect to test database
    db = getDatabase(':memory:');

    // Seed test users with TOTP enabled
    for (const [key, user] of Object.entries(testUsers)) {
      const id = crypto.randomUUID();
      const secret = speakeasy.generateSecret({ length: 20 });
      user.id = id;
      user.secret = secret.base32;

      db.prepare(`
        INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_secret, totp_enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(id, user.email, passwordHash, `Test ${key}`, user.role, secret.base32, new Date().toISOString(), new Date().toISOString());

      // Generate access tokens for permission tests
      user.token = jwt.sign(
        { id, email: user.email, fullName: `Test ${key}`, role: user.role },
        config.jwtSecret,
        { expiresIn: '15m' }
      );
    }
  });

  afterAll(() => {
    closeDatabase();
  });

  // -------------------------------------------------------------
  // 1. Permission Matrix Tests (Each Role vs Each Route)
  // -------------------------------------------------------------
  describe('RBAC Permission Matrix', () => {
    const customHeader = { 'X-Requested-With': 'LawGPT-Admin' };

    test('Route requiring "guest_quota.read" (/support-feature)', async () => {
      // Unauthenticated -> 401
      const resUnauth = await request(app).get('/api/admin/test/support-feature');
      expect(resUnauth.status).toBe(401);

      // Support -> 200
      const resSupport = await request(app)
        .get('/api/admin/test/support-feature')
        .set('Authorization', `Bearer ${testUsers.support.token}`);
      expect(resSupport.status).toBe(200);

      // Reviewer -> 403 (Lacks guest_quota.read)
      const resReviewer = await request(app)
        .get('/api/admin/test/support-feature')
        .set('Authorization', `Bearer ${testUsers.reviewer.token}`);
      expect(resReviewer.status).toBe(403);
      expect(resReviewer.body.error).toBe('FORBIDDEN');

      // Subadmin -> 200
      const resSubadmin = await request(app)
        .get('/api/admin/test/support-feature')
        .set('Authorization', `Bearer ${testUsers.subadmin.token}`);
      expect(resSubadmin.status).toBe(200);

      // Admin -> 200
      const resAdmin = await request(app)
        .get('/api/admin/test/support-feature')
        .set('Authorization', `Bearer ${testUsers.admin.token}`);
      expect(resAdmin.status).toBe(200);
    });

    test('Route requiring "content.review" (/reviewer-feature)', async () => {
      // Support -> 403
      const resSupport = await request(app)
        .get('/api/admin/test/reviewer-feature')
        .set('Authorization', `Bearer ${testUsers.support.token}`);
      expect(resSupport.status).toBe(403);

      // Reviewer -> 200
      const resReviewer = await request(app)
        .get('/api/admin/test/reviewer-feature')
        .set('Authorization', `Bearer ${testUsers.reviewer.token}`);
      expect(resReviewer.status).toBe(200);

      // Subadmin -> 200
      const resSubadmin = await request(app)
        .get('/api/admin/test/reviewer-feature')
        .set('Authorization', `Bearer ${testUsers.subadmin.token}`);
      expect(resSubadmin.status).toBe(200);

      // Admin -> 200
      const resAdmin = await request(app)
        .get('/api/admin/test/reviewer-feature')
        .set('Authorization', `Bearer ${testUsers.admin.token}`);
      expect(resAdmin.status).toBe(200);
    });

    test('Route requiring "content.publish" (/publish-action)', async () => {
      // Support -> 403
      const resSupport = await request(app)
        .post('/api/admin/test/publish-action')
        .set(customHeader)
        .set('Authorization', `Bearer ${testUsers.support.token}`);
      expect(resSupport.status).toBe(403);

      // Reviewer -> 403
      const resReviewer = await request(app)
        .post('/api/admin/test/publish-action')
        .set(customHeader)
        .set('Authorization', `Bearer ${testUsers.reviewer.token}`);
      expect(resReviewer.status).toBe(403);

      // Subadmin -> 200
      const resSubadmin = await request(app)
        .post('/api/admin/test/publish-action')
        .set(customHeader)
        .set('Authorization', `Bearer ${testUsers.subadmin.token}`);
      expect(resSubadmin.status).toBe(200);
      expect(resSubadmin.body.auditId).toBeDefined();

      // Admin -> 200
      const resAdmin = await request(app)
        .post('/api/admin/test/publish-action')
        .set(customHeader)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);
      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.auditId).toBeDefined();
    });

    test('Route requiring "audit.view" (/admin-exclusive)', async () => {
      // Subadmin -> 403
      const resSubadmin = await request(app)
        .post('/api/admin/test/admin-exclusive')
        .set(customHeader)
        .set('Authorization', `Bearer ${testUsers.subadmin.token}`);
      expect(resSubadmin.status).toBe(403);

      // Admin -> 200
      const resAdmin = await request(app)
        .post('/api/admin/test/admin-exclusive')
        .set(customHeader)
        .set('Authorization', `Bearer ${testUsers.admin.token}`);
      expect(resAdmin.status).toBe(200);
    });
  });

  // -------------------------------------------------------------
  // 2. Audit Logging & Immutability Tests
  // -------------------------------------------------------------
  describe('Audit Trail Verification', () => {
    test('Audit log is written on write mutations with before/after state', async () => {
      const initialCount = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;

      const res = await request(app)
        .post('/api/admin/test/publish-action')
        .set({ 'X-Requested-With': 'LawGPT-Admin' })
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(res.status).toBe(200);

      const latestLog = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 1').get();
      expect(latestLog).toBeDefined();
      expect(latestLog.action).toBe('content.publish');
      expect(latestLog.actor_role).toBe('admin');
      expect(JSON.parse(latestLog.before_state).status).toBe('reviewed');
      expect(JSON.parse(latestLog.after_state).status).toBe('published');

      const afterCount = db.prepare('SELECT COUNT(*) as c FROM audit_logs').get().c;
      expect(afterCount).toBe(initialCount + 1);
    });

    test('Audit logs cannot be updated or deleted (Append-Only Trigger enforcement)', () => {
      const anyLog = db.prepare('SELECT id FROM audit_logs LIMIT 1').get();
      expect(anyLog).toBeDefined();

      // Attempt UPDATE -> must throw SQLite trigger abort
      expect(() => {
        db.prepare("UPDATE audit_logs SET action = 'tampered' WHERE id = ?").run(anyLog.id);
      }).toThrow(/Audit log entries are strictly append-only and cannot be updated/);

      // Attempt DELETE -> must throw SQLite trigger abort
      expect(() => {
        db.prepare('DELETE FROM audit_logs WHERE id = ?').run(anyLog.id);
      }).toThrow(/Audit log entries are strictly append-only and cannot be deleted/);
    });
  });

  // -------------------------------------------------------------
  // 3. Brute Force & Lockout Tests
  // -------------------------------------------------------------
  describe('Brute-force Protection & Account Lockout', () => {
    test('5 consecutive failed attempts locks the account', async () => {
      const email = testUsers.locked.email;

      // 4 failed attempts
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post('/api/admin/auth/login')
          .send({ email, password: 'WrongPassword!' });
        expect(res.status).toBe(401);
        expect(res.body.remainingAttempts).toBe(5 - i);
      }

      // 5th failed attempt -> locks account
      const resLock = await request(app)
        .post('/api/admin/auth/login')
        .send({ email, password: 'WrongPassword!' });
      expect(resLock.status).toBe(429);
      expect(resLock.body.error).toBe('ACCOUNT_LOCKED');

      // Subsequent attempt even with correct password returns 429
      const resLockedOut = await request(app)
        .post('/api/admin/auth/login')
        .send({ email, password: passwordPlain });
      expect(resLockedOut.status).toBe(429);
      expect(resLockedOut.body.error).toBe('ACCOUNT_LOCKED');
    });
  });

  // -------------------------------------------------------------
  // 4. TOTP Two-Factor Authentication Flow
  // -------------------------------------------------------------
  describe('TOTP Two-Factor Authentication', () => {
    let pending2faToken: string;

    test('Step 1: Login returns 2FA challenge rather than session tokens', async () => {
      const res = await request(app)
        .post('/api/admin/auth/login')
        .send({ email: testUsers.reviewer.email, password: passwordPlain });

      expect(res.status).toBe(200);
      expect(res.body.require2fa).toBe(true);
      expect(res.body.pending2faToken).toBeDefined();
      pending2faToken = res.body.pending2faToken;
    });

    test('Step 2: Invalid 2FA token is rejected', async () => {
      const res = await request(app)
        .post('/api/admin/auth/2fa/verify')
        .send({ pending2faToken, code: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_2FA_CODE');
    });

    test('Step 3: Valid TOTP code issues session tokens and HttpOnly cookies', async () => {
      const validCode = speakeasy.totp({
        secret: testUsers.reviewer.secret,
        encoding: 'base32',
      });

      const res = await request(app)
        .post('/api/admin/auth/2fa/verify')
        .send({ pending2faToken, code: validCode });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('reviewer');

      // Check cookies
      const rawCookies = res.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookieArray = Array.isArray(rawCookies) ? rawCookies : [rawCookies as string];
      expect(cookieArray.some((c: string) => c.includes('admin_access_token'))).toBe(true);
      expect(cookieArray.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 5. CSRF Protection
  // -------------------------------------------------------------
  describe('CSRF Defense', () => {
    test('Mutating POST without CSRF header is rejected with 403', async () => {
      const res = await request(app)
        .post('/api/admin/test/publish-action')
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('CSRF_INVALID');
    });

    test('Mutating POST with X-Requested-With: LawGPT-Admin is accepted', async () => {
      const res = await request(app)
        .post('/api/admin/test/publish-action')
        .set({ 'X-Requested-With': 'LawGPT-Admin' })
        .set('Authorization', `Bearer ${testUsers.admin.token}`);

      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------
  // 6. Public /api/config
  // -------------------------------------------------------------
  describe('Public /api/config', () => {
    test('Returns cacheable JSON configuration without server secrets', async () => {
      const res = await request(app).get('/api/config');
      expect(res.status).toBe(200);
      expect(res.body.guest_question_limit).toBe(3);
      expect(res.body.ai_enabled).toBe(true);
      expect(res.body.jwtSecret).toBeUndefined();
      expect(res.headers['cache-control']).toContain('public');
    });
  });
});
