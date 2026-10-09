import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import { csrfProtection } from './middleware/csrf';
import { authRoutes } from './routes/admin/authRoutes';
import { auditRoutes } from './routes/admin/auditRoutes';
import { userRoutes } from './routes/admin/userRoutes';
import { teamRoutes } from './routes/admin/teamRoutes';
import { sessionRoutes } from './routes/admin/sessionRoutes';
import { testRoutes } from './routes/admin/testRoutes';
import { publicConfigRoutes } from './routes/configRoutes';
import { contentAdminRoutes } from './routes/admin/contentRoutes';
import { publicContentRoutes } from './routes/contentRoutes';
import { aiAdminRoutes } from './routes/admin/aiRoutes';
import { publicChatRoutes } from './routes/chatTelemetryRoutes';
import { configAdminRoutes } from './routes/admin/configManagementRoutes';
import { publicDirectoryRoutes, directoryAdminRoutes } from './routes/directoryRoutes';
import { publicDpdpRoutes, dpdpAdminRoutes } from './routes/dpdpRoutes';

export const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Strict CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // In development or if matching admin origin
      if (
        origin === config.adminCorsOrigin ||
        origin === 'http://localhost:5173' ||
        origin === 'http://localhost:3000'
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS blocked: Origin not authorized for LawGPT Admin API'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  })
);

// 3. Parsers & Middleware
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// 4. CSRF Protection for admin mutations
app.use('/api/admin', csrfProtection);

// 5. Route Mounting
app.use('/api/config', publicConfigRoutes);
app.use('/api/content', publicContentRoutes);
app.use('/api/chat', publicChatRoutes);
app.use('/api/directory', publicDirectoryRoutes);
app.use('/api/dpdp', publicDpdpRoutes);
app.use('/api/admin/auth', authRoutes);
app.use('/api/admin/audit', auditRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/team', teamRoutes);
app.use('/api/admin/sessions', sessionRoutes);
app.use('/api/admin/content', contentAdminRoutes);
app.use('/api/admin/ai', aiAdminRoutes);
app.use('/api/admin/config-mgmt', configAdminRoutes);
app.use('/api/admin/directory', directoryAdminRoutes);
app.use('/api/admin/dpdp', dpdpAdminRoutes);
app.use('/api/admin/test', testRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'LawGPT Enterprise Gateway', timestamp: new Date().toISOString() });
});

// 6. Safe Error Handling Middleware (Never exposes stack traces in production)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const isProd = config.nodeEnv === 'production';

  // Log error internally
  console.error(`[Error] ${req.method} ${req.path}:`, err.message || err);

  res.status(statusCode).json({
    error: err.name || 'INTERNAL_SERVER_ERROR',
    message: isProd && statusCode === 500 ? 'An unexpected internal error occurred' : err.message,
    statusCode,
  });
});
