import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/async_handler.js';
import { benchmarkController } from './benchmark.controller.js';

/**
 * Read-only. Execution stays in the CLI (`npm run benchmark`) so a long provider run can
 * never block an HTTP request or be triggered repeatedly against a paid vendor.
 */
export const benchmarkRouter = Router();
benchmarkRouter.use(authenticate, authorize('admin'));

benchmarkRouter.get('/suites', asyncHandler(benchmarkController.listSuites));
benchmarkRouter.get('/suites/detail', asyncHandler(benchmarkController.suiteDetail));
benchmarkRouter.get('/candidates', asyncHandler(benchmarkController.listCandidates));
benchmarkRouter.get('/comparison', asyncHandler(benchmarkController.comparison));
benchmarkRouter.get('/runs', asyncHandler(benchmarkController.listRuns));
benchmarkRouter.get('/runs/:runId', asyncHandler(benchmarkController.getRun));
benchmarkRouter.get('/runs/:runId/turns', asyncHandler(benchmarkController.getRunTurns));
benchmarkRouter.get('/runs/:runId/human', asyncHandler(benchmarkController.humanSummary));

/** Human evaluation is the only write here, and it records an opinion, not a model change. */
benchmarkRouter.post('/ratings', asyncHandler(benchmarkController.rateTurn));
