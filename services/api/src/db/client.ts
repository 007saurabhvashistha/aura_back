import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { HttpError } from '../utils/http_error.js';
import * as schema from './schema.js';

const { Pool } = pkg;

let pool: pkg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

/**
 * Lazily create the Neon/Postgres pool and Drizzle client.
 * Returns null when DATABASE_URL is not configured so the API can still boot
 * (health will report the database as disconnected).
 */
export function getDb(): NodePgDatabase<typeof schema> | null {
  if (!env.DATABASE_URL) {
    return null;
  }
  if (!dbInstance) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      // Neon requires SSL.
      ssl: env.DATABASE_URL.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    });
    dbInstance = drizzle(pool, { schema });
    logger.info('Database client initialized');
  }
  return dbInstance;
}

/** Ping the database. Returns true when a trivial query succeeds. */
export async function checkDatabase(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.execute('select 1');
    return true;
  } catch (error) {
    logger.error('Database ping failed', { error: String(error) });
    return false;
  }
}

/** Return the Drizzle client or throw a 503 when the database is not configured. */
export function requireDb(): NodePgDatabase<typeof schema> {
  const db = getDb();
  if (!db) {
    throw new HttpError(503, 'Database is not configured', 'db_unavailable');
  }
  return db;
}

/** Close the pool during graceful shutdown. */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}
