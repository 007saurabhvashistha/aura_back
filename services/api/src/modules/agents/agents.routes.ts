import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/async_handler.js';
import { agentsController } from './agents.controller.js';

export const agentsRouter = Router();

// All agent routes require authentication (admin check is in controller)
agentsRouter.use(authenticate);

agentsRouter.get('/', asyncHandler(agentsController.list));
agentsRouter.post('/', asyncHandler(agentsController.create));
agentsRouter.get('/:id', asyncHandler(agentsController.getById));
agentsRouter.put('/:id', asyncHandler(agentsController.update));
agentsRouter.delete('/:id', asyncHandler(agentsController.delete));
