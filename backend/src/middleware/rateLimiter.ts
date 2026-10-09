import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/db';
import { config } from '../config/env';

interface IpRateRecord {
  count: number;
  resetAt: number;
}

const ipBuckets = new Map<string, IpRateRecord>();

/**
 * IP-based rate limiter for authentication endpoints
 */
export function loginIpRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const record = ipBuckets.get(ip);
  if (!record || now > record.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  record.count += 1;
  if (record.count > maxRequests) {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts from this IP. Please wait a minute before retrying.',
    });
    return;
  }

  next();
}

/**
 * Checks if a specific admin account is currently locked out due to excessive failed attempts.
 */
export function checkAccountLockout(email: string): { isLocked: boolean; remainingMinutes?: number } {
  const db = getDatabase();
  const stmt = db.prepare('SELECT failed_login_attempts, locked_until FROM admin_users WHERE email = ?');
  const user = stmt.get(email) as { failed_login_attempts: number; locked_until: string | null } | undefined;

  if (!user || !user.locked_until) {
    return { isLocked: false };
  }

  const lockedUntil = new Date(user.locked_until).getTime();
  const now = Date.now();

  if (now < lockedUntil) {
    const remainingMinutes = Math.ceil((lockedUntil - now) / (60 * 1000));
    return { isLocked: true, remainingMinutes };
  }

  // Lockout duration expired, reset lock
  db.prepare('UPDATE admin_users SET locked_until = NULL, failed_login_attempts = 0 WHERE email = ?').run(email);
  return { isLocked: false };
}

/**
 * Increments failed login count and triggers lockout if threshold reached.
 */
export function recordFailedLogin(email: string): { lockedNow: boolean; remainingAttempts: number } {
  const db = getDatabase();
  const stmt = db.prepare('SELECT failed_login_attempts FROM admin_users WHERE email = ?');
  const user = stmt.get(email) as { failed_login_attempts: number } | undefined;

  if (!user) {
    return { lockedNow: false, remainingAttempts: config.lockoutThreshold };
  }

  const nextAttempts = (user.failed_login_attempts || 0) + 1;
  if (nextAttempts >= config.lockoutThreshold) {
    const lockUntil = new Date(Date.now() + config.lockoutDurationMinutes * 60 * 1000).toISOString();
    db.prepare('UPDATE admin_users SET failed_login_attempts = ?, locked_until = ? WHERE email = ?').run(
      nextAttempts,
      lockUntil,
      email
    );
    return { lockedNow: true, remainingAttempts: 0 };
  }

  db.prepare('UPDATE admin_users SET failed_login_attempts = ? WHERE email = ?').run(nextAttempts, email);
  return { lockedNow: false, remainingAttempts: config.lockoutThreshold - nextAttempts };
}

/**
 * Clears failed attempts upon successful login and 2FA.
 */
export function resetFailedLogins(email: string): void {
  const db = getDatabase();
  db.prepare('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ?').run(email);
}
