import { getDb } from '../../db/client.js';
import { HttpError } from '../../utils/http_error.js';

export function requireCompanionDb() {
  const db = getDb();
  if (!db) {
    throw HttpError.badRequest('Database not available', 'DATABASE_UNAVAILABLE');
  }
  return db;
}

export type CompanionDb = ReturnType<typeof requireCompanionDb>;

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
