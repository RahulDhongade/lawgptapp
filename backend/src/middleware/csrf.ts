import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods do not mutate state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    if (!req.cookies?.csrf_token) {
      const newToken = crypto.randomBytes(24).toString('hex');
      res.cookie('csrf_token', newToken, {
        httpOnly: false, // Accessible to front-end to read and submit in header
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });
    }
    return next();
  }

  // Exempt auth bootstrap endpoints (login & 2FA verify) where session does not yet exist
  const fullPath = req.originalUrl || `${req.baseUrl}${req.path}`;
  if (
    fullPath.includes('/auth/login') ||
    fullPath.includes('/auth/2fa/verify') ||
    fullPath.includes('/auth/2fa/setup') ||
    fullPath.includes('/auth/2fa/confirm-setup')
  ) {
    return next();
  }

  // Validate CSRF token via header or custom client header
  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  const cookieToken = req.cookies?.csrf_token as string | undefined;
  const customClientHeader = req.headers['x-requested-with'];

  // Accept custom secure header or matching CSRF double-submit token
  if (
    customClientHeader === 'LawGPT-Admin' ||
    (headerToken && cookieToken && headerToken === cookieToken)
  ) {
    return next();
  }

  res.status(403).json({
    error: 'CSRF_INVALID',
    message: 'CSRF validation failed. Missing or mismatched X-CSRF-Token or X-Requested-With header.',
  });
}
