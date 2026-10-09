import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { app } from '../src/app';
import { getDatabase, closeDatabase } from '../src/database/db';
import { config } from '../src/config/env';

describe('Phase 4: AI Telemetry, Review Queue, QA Benchmarks, and Settings', () => {
  let db: any;
  let reviewerToken: string;
  let adminToken: string;
  let reviewerId: string;
  let adminId: string;
  let flaggedLogId: string;

  const customHeader = { 'X-Requested-With': 'LawGPT-Admin' };

  beforeAll(() => {
    db = getDatabase(':memory:');

    reviewerId = crypto.randomUUID();
    adminId = crypto.randomUUID();
    const passHash = bcrypt.hashSync('Pass123!', 10);

    // 1. Reviewer
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'reviewer@lawgpt.in', ?, 'Legal Reviewer', 'reviewer', 1, ?, ?)
    `).run(reviewerId, passHash, new Date().toISOString(), new Date().toISOString());

    // 2. Admin
    db.prepare(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, totp_enabled, created_at, updated_at)
      VALUES (?, 'admin@lawgpt.in', ?, 'Super Administrator', 'admin', 1, ?, ?)
    `).run(adminId, passHash, new Date().toISOString(), new Date().toISOString());

    reviewerToken = jwt.sign({ id: reviewerId, email: 'reviewer@lawgpt.in', fullName: 'Legal Reviewer', role: 'reviewer' }, config.jwtSecret);
    adminToken = jwt.sign({ id: adminId, email: 'admin@lawgpt.in', fullName: 'Super Administrator', role: 'admin' }, config.jwtSecret);
  });

  afterAll(() => {
    closeDatabase();
  });

  test('1. Chat telemetry detects missing citations and routes to pending review queue', async () => {
    const res = await request(app)
      .post('/api/chat/log')
      .send({
        userId: 'usr_mobile_999',
        question: 'What is the punishment for cheating in the new law?',
        answer: 'It is up to 7 years imprisonment.',
        citations: [], // Missing citations!
        latencyMs: 420,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.flagsCount).toBeGreaterThan(0);
    flaggedLogId = res.body.id;

    // Verify DB
    const log = db.prepare('SELECT * FROM chat_logs WHERE id = ?').get(flaggedLogId) as any;
    expect(log.risk_level).toBe('MEDIUM');
    expect(log.review_status).toBe('pending');
    expect(log.flags_json).toContain('MISSING_VERIFIED_CITATION');
  });

  test('2. Chat telemetry detects high-risk statutory keywords and marks HIGH risk', async () => {
    const res = await request(app)
      .post('/api/chat/log')
      .send({
        userId: 'usr_mobile_888',
        question: 'How to report a POCSO offense immediately?',
        answer: 'Immediate reporting is required under Section 19 of the POCSO Act to Special Juvenile Police Unit.',
        citations: ['POCSO Act, 2012 Section 19'],
        latencyMs: 350,
      });

    expect(res.status).toBe(201);
    const log = db.prepare('SELECT * FROM chat_logs WHERE id = ?').get(res.body.id) as any;
    expect(log.risk_level).toBe('HIGH');
    expect(log.review_status).toBe('pending');
    expect(log.flags_json).toContain('HIGH_RISK_TRIGGER');
  });

  test('3. Mobile user thumbs-down report flags chat for review', async () => {
    // Insert a previously approved log
    const normalId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO chat_logs (id, user_id_hash, question, answer, citations_json, verified_flags, model, prompt_version, latency_ms, risk_level, review_status, created_at)
      VALUES (?, 'hash_anon', 'What is bail?', 'Bail is release.', '[]', 1, 'gemini', 'v1', 200, 'LOW', 'approved', ?)
    `).run(normalId, new Date().toISOString());

    const res = await request(app)
      .post('/api/chat/report')
      .send({
        logId: normalId,
        reason: 'Hallucinated section number in advice',
      });

    expect(res.status).toBe(200);

    const updated = db.prepare('SELECT * FROM chat_logs WHERE id = ?').get(normalId) as any;
    expect(updated.review_status).toBe('pending');
    expect(updated.flags_json).toContain('USER_REPORTED_WRONG_ANSWER');
  });

  test('4. Reviewer views flagged queue and performs Correct + Add to QA test set', async () => {
    const queueRes = await request(app)
      .get('/api/admin/ai/review-queue?status=pending')
      .set('Cookie', [`admin_access_token=${reviewerToken}`]);

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.counts.pending).toBeGreaterThanOrEqual(1);

    // Reviewer performs action: add_to_test_set
    const actionRes = await request(app)
      .post(`/api/admin/ai/review-queue/${flaggedLogId}/action`)
      .set('Cookie', [`admin_access_token=${reviewerToken}`])
      .set(customHeader)
      .send({
        action: 'add_to_test_set',
        notes: 'Section 318(4) of Bharatiya Nyaya Sanhita, 2023 must be explicitly cited.',
        correctionText: 'Cheating is defined under Section 318 of BNS 2023. Under Section 318(4), cheating and dishonestly inducing delivery of property carries imprisonment up to seven years and fine.',
      });

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.status).toBe('corrected');

    // Confirm it was promoted into qa_test_cases table
    const qaCases = db.prepare('SELECT * FROM qa_test_cases WHERE question LIKE ?').all('%cheating%') as any[];
    expect(qaCases.length).toBeGreaterThanOrEqual(1);
    expect(qaCases[0].reviewer_notes).toContain('Imported from reviewer queue');
  });

  test('5. QA Benchmark Suite: Run evaluation and record human verdict', async () => {
    // 1. Run benchmark evaluation
    const runRes = await request(app)
      .post('/api/admin/ai/qa-benchmarks/run')
      .set('Cookie', [`admin_access_token=${reviewerToken}`])
      .set(customHeader);

    expect(runRes.status).toBe(200);
    expect(runRes.body.evaluatedCount).toBeGreaterThanOrEqual(1);

    // 2. Fetch test case
    const listRes = await request(app)
      .get('/api/admin/ai/qa-benchmarks')
      .set('Cookie', [`admin_access_token=${reviewerToken}`]);

    expect(listRes.status).toBe(200);
    expect(listRes.body.testCases.length).toBeGreaterThanOrEqual(1);
    const targetCase = listRes.body.testCases[0];
    expect(targetCase.last_run_answer).toBeDefined();

    // 3. Human reviewer registers verdict (PASS)
    const verdictRes = await request(app)
      .post(`/api/admin/ai/qa-benchmarks/${targetCase.id}/verdict`)
      .set('Cookie', [`admin_access_token=${reviewerToken}`])
      .set(customHeader)
      .send({
        verdict: 'PASS',
        notes: 'Properly cited BNS and BNSS with constitutional guarantees.',
        score: 1.0,
      });

    expect(verdictRes.status).toBe(200);
    expect(verdictRes.body.verdict).toBe('PASS');

    // Confirm metrics updated
    const updatedMetricsRes = await request(app)
      .get('/api/admin/ai/qa-benchmarks')
      .set('Cookie', [`admin_access_token=${reviewerToken}`]);

    expect(updatedMetricsRes.body.metrics.passCount).toBeGreaterThanOrEqual(1);
  });

  test('6. AI Settings management and prompt update', async () => {
    const getRes = await request(app)
      .get('/api/admin/ai/settings')
      .set('Cookie', [`admin_access_token=${reviewerToken}`]);

    expect(getRes.status).toBe(200);
    expect(getRes.body.model).toBeDefined();

    // Admin updates prompt and model
    const patchRes = await request(app)
      .patch('/api/admin/ai/settings')
      .set('Cookie', [`admin_access_token=${adminToken}`])
      .set(customHeader)
      .send({
        model: 'gemini-1.5-pro',
        promptVersion: 'v2.5-supremecourt',
        citationRequired: true,
      });

    expect(patchRes.status).toBe(200);

    const verifyRes = await request(app)
      .get('/api/admin/ai/settings')
      .set('Cookie', [`admin_access_token=${adminToken}`]);

    expect(verifyRes.body.promptVersion).toBe('v2.5-supremecourt');
    expect(verifyRes.body.citationRequired).toBe(true);
  });
});
