import { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../security/permissions';

/**
 * Middleware ensuring the authenticated admin possesses the specific permission.
 * Never trust client role checks. Server is the sole authority.
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.adminUser) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required prior to permission check',
      });
      return;
    }

    if (!hasPermission(req.adminUser.role, permission)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
        requiredPermission: permission,
      });
      return;
    }

    next();
  };
}
