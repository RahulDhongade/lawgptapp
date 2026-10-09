import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../database/db';

export const publicChatRoutes = Router();

const HIGH_RISK_KEYWORDS = [
  'pocso',
  'child abuse',
  'suicide',
  'self harm',
  'bomb',
  'terror',
  'bribe judge',
  'kill',
  'domestic violence emergency',
  'rape threat',
];

const ChatLogSchema = z.object({
  userId: z.string().optional(),
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(10000),
  citations: z.array(z.string()).default([]),
  model: z.string().default('gemini-1.5-pro'),
  promptVersion: z.string().default('v2.4-gazette'),
  latencyMs: z.number().int().nonnegative().default(300),
});

/**
 * POST /api/chat/log
 * Secure privacy-preserving telemetry for legal chat exchanges
 */
publicChatRoutes.post('/log', (req: Request, res: Response) => {
  const parsed = ChatLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.issues });
  }

  const { userId, question, answer, citations, model, promptVersion, latencyMs } = parsed.data;

  // Privacy-preserving hash of user ID
  const userIdHash = userId
    ? crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16)
    : 'anonymous';

  // Automated Risk Detection
  const lowerQuestion = question.toLowerCase();
  const lowerAnswer = answer.toLowerCase();
  const matchedHighRisk = HIGH_RISK_KEYWORDS.filter(
    (kw) => lowerQuestion.includes(kw) || lowerAnswer.includes(kw)
  );

  const missingCitations = citations.length === 0;
  const isHighRisk = matchedHighRisk.length > 0;
  const riskLevel = isHighRisk ? 'HIGH' : missingCitations ? 'MEDIUM' : 'LOW';

  const flags: string[] = [];
  if (isHighRisk) flags.push(`HIGH_RISK_TRIGGER: ${matchedHighRisk.join(', ')}`);
  if (missingCitations) flags.push('MISSING_VERIFIED_CITATION');

  // Should enter review queue if flagged
  const reviewStatus = flags.length > 0 ? 'pending' : 'approved';

  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO chat_logs (
      id, user_id_hash, question, answer, citations_json, verified_flags,
      model, prompt_version, latency_ms, risk_level, flags_json, review_status, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userIdHash,
    question,
    answer,
    JSON.stringify(citations),
    missingCitations ? 0 : 1,
    model,
    promptVersion,
    latencyMs,
    riskLevel,
    JSON.stringify(flags),
    reviewStatus,
    now
  );

  return res.status(201).json({ id, status: 'recorded', flagsCount: flags.length });
});

/**
 * POST /api/chat/report
 * User-initiated thumbs-down / wrong answer report
 */
publicChatRoutes.post('/report', (req: Request, res: Response) => {
  const { logId, reason } = req.body;
  if (!logId) {
    return res.status(400).json({ error: 'MISSING_PARAM', message: 'logId is required' });
  }

  const db = getDatabase();
  const item = db.prepare('SELECT * FROM chat_logs WHERE id = ?').get(logId) as any;
  if (!item) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Chat record not found' });
  }

  let flags: string[] = [];
  try { flags = JSON.parse(item.flags_json || '[]'); } catch {}
  flags.push(`USER_REPORTED_WRONG_ANSWER: ${reason || 'Incorrect legal statute'}`);

  db.prepare(`
    UPDATE chat_logs 
    SET flags_json = ?, review_status = 'pending', risk_level = CASE WHEN risk_level = 'LOW' THEN 'MEDIUM' ELSE risk_level END
    WHERE id = ?
  `).run(JSON.stringify(flags), logId);

  return res.json({ message: 'Report submitted to legal review queue', logId });
});
