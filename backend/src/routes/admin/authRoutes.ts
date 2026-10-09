import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';
import { z } from 'zod';
import { getDatabase } from '../../database/db';
import { config } from '../../config/env';
import { authenticateAdmin } from '../../middleware/auth';
import {
  loginIpRateLimiter,
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
} from '../../middleware/rateLimiter';
import { AuditService } from '../../services/auditService';
import { getRolePermissions, AdminRole } from '../../security/permissions';

export const authRoutes = Router();

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const Verify2faSchema = z.object({
  pending2faToken: z.string().min(10),
  code: z.string().min(6).max(8),
});

const Setup2faConfirmSchema = z.object({
  pending2faToken: z.string().min(10),
  code: z.string().min(6).max(8),
});

/**
 * Helper to generate secure session cookies
 */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = config.nodeEnv === 'production';

  res.cookie('admin_access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: config.tokenExpirySeconds * 1000,
  });

  res.cookie('admin_refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/admin/auth',
    maxAge: config.refreshTokenExpirySeconds * 1000,
  });
}

/**
 * POST /api/admin/auth/login
 * Step 1: Validate email + password and check lockout.
 * Never directly returns full session tokens; issues 2FA pre-auth challenge.
 */
authRoutes.post('/login', loginIpRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid email or password format',
      details: parseResult.error.format(),
    });
    return;
  }

  const { email, password } = parseResult.data;

  // Check account lockout
  const lockout = checkAccountLockout(email);
  if (lockout.isLocked) {
    res.status(429).json({
      error: 'ACCOUNT_LOCKED',
      message: `Account is temporarily locked due to excessive failed attempts. Try again in ${lockout.remainingMinutes} minutes.`,
    });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    const { lockedNow, remainingAttempts } = recordFailedLogin(email);

    AuditService.log({
      actorId: user?.id || 'unknown',
      actorRole: user?.role || 'unknown',
      action: 'admin.login_failed',
      objectType: 'admin_user',
      objectId: user?.id || 'none',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      beforeState: { email },
    });

    if (lockedNow) {
      res.status(429).json({
        error: 'ACCOUNT_LOCKED',
        message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.',
      });
      return;
    }

    res.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      remainingAttempts,
    });
    return;
  }

  // Password correct: generate short-lived pre-2FA challenge token (5-minute TTL)
  const pending2faToken = jwt.sign(
    { id: user.id, email: user.email, type: 'pre_2fa' },
    config.jwtSecret,
    { expiresIn: '5m' }
  );

  // If TOTP is already enabled on account
  if (user.totp_enabled && user.totp_secret) {
    res.status(200).json({
      require2fa: true,
      pending2faToken,
      message: 'Please provide the 6-digit code from your authenticator app',
    });
    return;
  }

  // First-time admin login: require 2FA enrollment
  res.status(200).json({
    require2faSetup: true,
    pending2faToken,
    message: 'Two-factor authentication enrollment required for this account',
  });
});

/**
 * POST /api/admin/auth/2fa/verify
 * Step 2: Validate RFC 6238 TOTP code and issue session cookies + tokens.
 */
authRoutes.post('/2fa/verify', loginIpRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const parseResult = Verify2faSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid 2FA submission format',
    });
    return;
  }

  const { pending2faToken, code } = parseResult.data;

  let decoded: any;
  try {
    decoded = jwt.verify(pending2faToken, config.jwtSecret);
    if (decoded.type !== 'pre_2fa') {
      throw new Error('Not a pre-2FA challenge token');
    }
  } catch (err) {
    res.status(401).json({
      error: 'CHALLENGE_EXPIRED',
      message: 'Two-factor session expired. Please log in again.',
    });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(decoded.id) as any;

  if (!user || !user.totp_secret) {
    res.status(401).json({
      error: 'INVALID_STATE',
      message: 'Two-factor authentication is not configured for this account',
    });
    return;
  }

  const verified = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token: code,
    window: 1, // Allow 30s clock drift
  });

  if (!verified) {
    AuditService.log({
      actorId: user.id,
      actorRole: user.role,
      action: 'admin.2fa_failed',
      objectType: 'admin_user',
      objectId: user.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    res.status(401).json({
      error: 'INVALID_2FA_CODE',
      message: 'Invalid two-factor authentication code',
    });
    return;
  }

  // Clear failed attempts counter
  resetFailedLogins(user.email);

  // Generate tokens
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role as AdminRole,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.tokenExpirySeconds,
  });

  // Generate opaque refresh token
  const rawRefreshToken = crypto.randomBytes(32).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + config.refreshTokenExpirySeconds * 1000).toISOString();

  db.prepare(`
    INSERT INTO admin_sessions (id, admin_user_id, refresh_token_hash, user_agent, ip_address, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    user.id,
    refreshTokenHash,
    req.headers['user-agent'] || null,
    req.ip || req.socket.remoteAddress || null,
    expiresAt,
    new Date().toISOString()
  );

  setAuthCookies(res, accessToken, rawRefreshToken);

  AuditService.log({
    actorId: user.id,
    actorRole: user.role,
    action: 'admin.login_success',
    objectType: 'admin_session',
    objectId: sessionId,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    user: payload,
    accessToken,
    permissions: getRolePermissions(user.role),
  });
});

/**
 * POST /api/admin/auth/2fa/setup
 * Generates a new TOTP secret & QR code for initial admin onboarding.
 */
authRoutes.post('/2fa/setup', async (req: Request, res: Response): Promise<void> => {
  const token = req.body?.pending2faToken;
  if (!token) {
    res.status(400).json({ error: 'TOKEN_REQUIRED', message: 'pending2faToken is required' });
    return;
  }

  let decoded: any;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.type !== 'pre_2fa') throw new Error();
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Challenge token expired or invalid' });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT id, email, full_name FROM admin_users WHERE id = ?').get(decoded.id) as any;
  if (!user) {
    res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Admin user not found' });
    return;
  }

  const secret = speakeasy.generateSecret({
    name: `LawGPT Admin (${user.email})`,
    issuer: 'LawGPT Enterprise',
    length: 20,
  });

  // Temporarily store secret
  db.prepare('UPDATE admin_users SET totp_secret = ? WHERE id = ?').run(secret.base32, user.id);

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || '');

  res.status(200).json({
    secret: secret.base32,
    qrCodeUrl,
    message: 'Scan the QR code with Google Authenticator or enter the secret key manually',
  });
});

/**
 * POST /api/admin/auth/2fa/confirm-setup
 * Confirms newly enrolled TOTP secret and activates account.
 */
authRoutes.post('/2fa/confirm-setup', async (req: Request, res: Response): Promise<void> => {
  const parseResult = Setup2faConfirmSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid confirmation format' });
    return;
  }

  const { pending2faToken, code } = parseResult.data;

  let decoded: any;
  try {
    decoded = jwt.verify(pending2faToken, config.jwtSecret);
  } catch {
    res.status(401).json({ error: 'UNAUTHORIZED', message: 'Challenge token expired' });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(decoded.id) as any;

  if (!user || !user.totp_secret) {
    res.status(400).json({ error: 'SETUP_NOT_INITIATED', message: 'TOTP setup was not initiated' });
    return;
  }

  const verified = speakeasy.totp.verify({
    secret: user.totp_secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    res.status(400).json({ error: 'INVALID_CODE', message: 'Verification code did not match secret' });
    return;
  }

  // Activate TOTP
  db.prepare('UPDATE admin_users SET totp_enabled = 1 WHERE id = ?').run(user.id);
  resetFailedLogins(user.email);

  // Issue session
  const payload = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role as AdminRole,
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.tokenExpirySeconds,
  });

  const rawRefreshToken = crypto.randomBytes(32).toString('hex');
  const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + config.refreshTokenExpirySeconds * 1000).toISOString();

  db.prepare(`
    INSERT INTO admin_sessions (id, admin_user_id, refresh_token_hash, user_agent, ip_address, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    sessionId,
    user.id,
    refreshTokenHash,
    req.headers['user-agent'] || null,
    req.ip || req.socket.remoteAddress || null,
    expiresAt,
    new Date().toISOString()
  );

  setAuthCookies(res, accessToken, rawRefreshToken);

  AuditService.log({
    actorId: user.id,
    actorRole: user.role,
    action: 'admin.2fa_enrolled',
    objectType: 'admin_user',
    objectId: user.id,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({
    user: payload,
    accessToken,
    permissions: getRolePermissions(user.role),
  });
});

/**
 * POST /api/admin/auth/refresh
 * Rotates refresh token and issues new access token.
 */
authRoutes.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.admin_refresh_token || req.body?.refreshToken;
  if (!token) {
    res.status(401).json({ error: 'TOKEN_REQUIRED', message: 'Refresh token required' });
    return;
  }

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const db = getDatabase();

  const session = db.prepare(`
    SELECT s.*, u.email, u.full_name, u.role
    FROM admin_sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.refresh_token_hash = ? AND s.revoked_at IS NULL
  `).get(hash) as any;

  if (!session || new Date(session.expires_at).getTime() < Date.now()) {
    res.status(401).json({ error: 'INVALID_SESSION', message: 'Refresh session expired or revoked' });
    return;
  }

  // Revoke old session
  db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    session.id
  );

  // Issue new tokens
  const payload = {
    id: session.admin_user_id,
    email: session.email,
    fullName: session.full_name,
    role: session.role as AdminRole,
  };

  const newAccessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.tokenExpirySeconds,
  });

  const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
  const newHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
  const newSessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + config.refreshTokenExpirySeconds * 1000).toISOString();

  db.prepare(`
    INSERT INTO admin_sessions (id, admin_user_id, refresh_token_hash, user_agent, ip_address, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    newSessionId,
    session.admin_user_id,
    newHash,
    req.headers['user-agent'] || null,
    req.ip || req.socket.remoteAddress || null,
    expiresAt,
    new Date().toISOString()
  );

  setAuthCookies(res, newAccessToken, newRawRefreshToken);

  res.status(200).json({
    accessToken: newAccessToken,
    user: payload,
  });
});

/**
 * POST /api/admin/auth/logout
 */
authRoutes.post('/logout', authenticateAdmin, async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.admin_refresh_token;
  if (token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const db = getDatabase();
    db.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE refresh_token_hash = ?').run(
      new Date().toISOString(),
      hash
    );
  }

  res.clearCookie('admin_access_token');
  res.clearCookie('admin_refresh_token', { path: '/api/admin/auth' });

  if (req.adminUser) {
    AuditService.log({
      actorId: req.adminUser.id,
      actorRole: req.adminUser.role,
      action: 'admin.logout',
      objectType: 'admin_session',
      objectId: req.adminUser.id,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  }

  res.status(200).json({ success: true, message: 'Successfully logged out' });
});

/**
 * GET /api/admin/auth/me
 */
authRoutes.get('/me', authenticateAdmin, (req: Request, res: Response): void => {
  if (!req.adminUser) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
    return;
  }

  res.status(200).json({
    user: req.adminUser,
    permissions: getRolePermissions(req.adminUser.role),
  });
});
