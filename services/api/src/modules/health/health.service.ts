import { checkDatabase } from '../../db/client.js';
import { env } from '../../config/env.js';
import type { HealthStatus } from '@aura/shared';

const startedAt = Date.now();

/** Compute the current health of the API service. */
export async function getHealth(): Promise<HealthStatus> {
  const dbConnected = await checkDatabase();
  return {
    service: 'aura-api',
    status: 'ok',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    version: '0.1.0',
    database: env.DATABASE_URL
      ? dbConnected
        ? 'connected'
        : 'disconnected'
      : 'unknown',
  };
}
