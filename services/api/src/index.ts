import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './db/client.js';
import { runMigrations } from './db/migrate.js';
import { logger } from './utils/logger.js';

if (env.RUN_MIGRATIONS_ON_START) {
  try {
    await runMigrations();
  } catch (error) {
    logger.error('Startup migrations failed', { error: String(error) });
    process.exit(1);
  }
}

const app = createApp();

const server = app.listen(env.API_PORT, () => {
  logger.info('Aura API started', {
    port: env.API_PORT,
    env: env.NODE_ENV,
    database: env.DATABASE_URL ? 'configured' : 'not configured',
  });
});

/** Graceful shutdown. */
async function shutdown(signal: string): Promise<void> {
  logger.info('Shutting down', { signal });
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
