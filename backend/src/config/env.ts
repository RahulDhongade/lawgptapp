import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'lawgpt_super_secure_admin_jwt_secret_change_in_prod_123!',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'lawgpt_super_secure_refresh_secret_change_in_prod_456!',
  adminCorsOrigin: process.env.ADMIN_CORS_ORIGIN || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../data/lawgpt.db'),
  tokenExpirySeconds: 15 * 60, // 15 minutes
  refreshTokenExpirySeconds: 24 * 60 * 60, // 24 hours
  lockoutThreshold: 5, // 5 failed attempts
  lockoutDurationMinutes: 15,
};
