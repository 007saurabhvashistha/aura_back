import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { success } from './utils/api_response.js';
import { notFound } from './middleware/not_found.js';
import { errorHandler } from './middleware/error_handler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { profileRouter } from './modules/profile/profile.routes.js';
import { conversationsRouter } from './modules/conversations/conversations.routes.js';
import { socialRouter } from './modules/social/social.routes.js';
import { adminCompanionRouter, companionRouter } from './modules/companion/companion.routes.js';
import { benchmarkRouter } from './modules/benchmark/benchmark.routes.js';
import { agentsRouter } from './modules/agents/agents.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

/**
 * Match an origin against the configured allow-list. An entry may be an exact
 * origin or a wildcard host such as `https://*.vercel.app` (preview deploys).
 */
function isAllowedOrigin(origin: string, allowed: string[]): boolean {
  return allowed.some((entry) => {
    if (entry === origin) return true;
    if (!entry.includes('*')) return false;
    const pattern = new RegExp(
      `^${entry.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^.]*')}$`,
    );
    return pattern.test(origin);
  });
}

/** Build and configure the Express application (no listening here). */
export function createApp(): Express {
  const app = express();

  // Render/Vercel put the app behind a proxy; needed for correct req.ip and
  // secure-cookie detection in the rate limiters.
  if (env.TRUST_PROXY_HOPS > 0) {
    app.set('trust proxy', env.TRUST_PROXY_HOPS);
  }

  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin/non-browser requests (curl, health checks) send no Origin.
        if (!origin) return callback(null, true);
        // Disallowed origins get no CORS headers rather than an error response,
        // so the browser blocks them without the API logging a 500.
        return callback(null, isAllowedOrigin(origin, allowedOrigins));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Root — simple identity endpoint.
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json(
      success(
        { name: 'Aura API', docs: '/health' },
        'Aura — an AI Relationship Platform',
      ),
    );
  });

  // Health.
  app.use('/health', healthRouter);

  // Versioned API namespace (features mount here from Sprint 1 onward).
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', profileRouter);
  app.use('/api/v1/conversations', conversationsRouter);
  app.use('/api/v1/social', socialRouter);
  app.use('/api/v1/companions', companionRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/admin/agents', agentsRouter);
  app.use('/api/v1/admin/companions', adminCompanionRouter);
  app.use('/api/v1/admin/benchmarks', benchmarkRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
