import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/async_handler.js';
import { companionController } from './companion.controller.js';

/** Read surface for consumers. Viewer identity is always derived from the token. */
export const companionRouter = Router();
companionRouter.use(authenticate);

companionRouter.get('/', asyncHandler(companionController.list));
companionRouter.get('/engine/status', asyncHandler(companionController.engineStatus));
companionRouter.get('/:profileId', asyncHandler(companionController.detail));
companionRouter.get('/:profileId/relationship', asyncHandler(companionController.relationship));
companionRouter.get('/:profileId/memories', asyncHandler(companionController.memories));

/** Character authoring is an admin capability and stays separate from the read surface. */
export const adminCompanionRouter = Router();
adminCompanionRouter.use(authenticate, authorize('admin'));

adminCompanionRouter.put('/:agentId/persona', asyncHandler(companionController.upsertPersona));
