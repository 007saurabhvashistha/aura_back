import type { Request, Response } from 'express';
import { z } from 'zod';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import { SELECTION_WEIGHTS } from './benchmark.selection.js';
import { benchmarkService } from './benchmark.service.js';

const runIdParamSchema = z.object({ runId: z.string().uuid() }).strict();
const suiteQuerySchema = z.object({ suite: z.string().trim().max(120).optional() }).strict();
const listQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(200).default(50) })
  .strict();

const rateTurnSchema = z
  .object({
    turnResultId: z.string().uuid(),
    criterion: z.enum([
      'character_quality',
      'conversation_naturalness',
      'emotional_intelligence',
      'relationship_and_memory',
      'language_fidelity',
      'would_continue',
    ]),
    score: z.coerce.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  })
  .strict();

function requireUserId(req: Request): string {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

export const benchmarkController = {
  async listSuites(_req: Request, res: Response): Promise<void> {
    res.status(200).json(success(benchmarkService.suites(), 'Benchmark suites retrieved'));
  },

  async suiteDetail(req: Request, res: Response): Promise<void> {
    const { suite } = suiteQuerySchema.parse(req.query);
    res.status(200).json(success(benchmarkService.suiteDetail(suite), 'Benchmark suite retrieved'));
  },

  async listRuns(req: Request, res: Response): Promise<void> {
    const { limit } = listQuerySchema.parse(req.query);
    res.status(200).json(success(await benchmarkService.listRuns(limit), 'Benchmark runs retrieved'));
  },

  async getRun(req: Request, res: Response): Promise<void> {
    const { runId } = runIdParamSchema.parse(req.params);
    res.status(200).json(success(await benchmarkService.getRun(runId), 'Benchmark run retrieved'));
  },

  async getRunTurns(req: Request, res: Response): Promise<void> {
    const { runId } = runIdParamSchema.parse(req.params);
    res.status(200).json(success(await benchmarkService.getRunTurns(runId), 'Benchmark turns retrieved'));
  },

  async comparison(req: Request, res: Response): Promise<void> {
    const { suite } = suiteQuerySchema.parse(req.query);
    res.status(200).json(success(await benchmarkService.comparison(suite), 'Benchmark comparison retrieved'));
  },

  async listCandidates(_req: Request, res: Response): Promise<void> {
    res.status(200).json(
      success(
        { candidates: benchmarkService.candidates(), selectionWeights: SELECTION_WEIGHTS },
        'Model candidates retrieved',
      ),
    );
  },

  async humanSummary(req: Request, res: Response): Promise<void> {
    const { runId } = runIdParamSchema.parse(req.params);
    res.status(200).json(success(await benchmarkService.humanSummary(runId), 'Human evaluation retrieved'));
  },

  async rateTurn(req: Request, res: Response): Promise<void> {
    const input = rateTurnSchema.parse(req.body ?? {});
    await benchmarkService.rateTurn({ ...input, raterUserId: requireUserId(req) });
    res.status(200).json(success(null, 'Rating recorded'));
  },
};
