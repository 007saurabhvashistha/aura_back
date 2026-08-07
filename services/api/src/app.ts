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
import { agentsRouter } from './modules/agents/agents.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';

/** Build and configure the Express application (no listening here). */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
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
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/admin/agents', agentsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
