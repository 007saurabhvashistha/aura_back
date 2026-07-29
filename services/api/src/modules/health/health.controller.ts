import type { Request, Response } from 'express';
import { getHealth } from './health.service.js';
import { success } from '../../utils/api_response.js';

/** GET /health — liveness/readiness probe. */
export async function healthController(_req: Request, res: Response): Promise<void> {
  const health = await getHealth();
  res.status(200).json(success(health, 'Service healthy'));
}
