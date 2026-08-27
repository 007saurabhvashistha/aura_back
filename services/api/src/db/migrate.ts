import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb } from './client.js';
import { logger } from '../utils/logger.js';

// Resolved from this module so the folder is found regardless of the cwd
// (works for both `tsx src/...` and the compiled `dist/db/migrate.js`).
const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

/**
 * Apply pending Drizzle migrations. Forward-only and idempotent — already
 * applied migrations are recorded in the drizzle metadata table and skipped.
 */
export async function runMigrations(): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error('DATABASE_URL is not configured; cannot run migrations');
  }
  logger.info('Applying database migrations', { migrationsFolder });
  await migrate(db, { migrationsFolder });
  logger.info('Database migrations up to date');
}
