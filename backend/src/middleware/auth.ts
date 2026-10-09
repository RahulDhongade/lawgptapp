import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { getDatabase } from '../database/db';
import { AdminRole } from '../security/permissions';

export interface AdminUserPayload {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUserPayload;
    }
  }
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.admin_access_token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication token missing or invalid',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as AdminUserPayload & { type?: string };

    // Prevent using pre-2FA tokens as full access tokens
    if (decoded.type === 'pre_2fa') {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Two-factor authentication required',
      });
      return;
    }

    // Verify admin user exists and is active in database
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, email, full_name, role FROM admin_users WHERE id = ?');
    const user = stmt.get(decoded.id) as {
      id: string;
      email: string;
      full_name: string;
      role: AdminRole;
    } | undefined;

    if (!user) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Administrative user not found or deactivated',
      });
      return;
    }

    req.adminUser = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    next();
  } catch (err) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token expired or signature invalid',
    });
  }
}
