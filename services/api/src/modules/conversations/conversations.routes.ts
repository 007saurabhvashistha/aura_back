import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { conversationLimiter } from '../../middleware/rate_limit.js';
import { asyncHandler } from '../../utils/async_handler.js';
import { conversationsController } from './conversations.controller.js';

export const conversationsRouter = Router();

conversationsRouter.use(authenticate);
conversationsRouter.use(conversationLimiter);

conversationsRouter.post('/', asyncHandler(conversationsController.create));
conversationsRouter.get('/', asyncHandler(conversationsController.list));
conversationsRouter.get('/:id', asyncHandler(conversationsController.getById));
conversationsRouter.post('/:id/end', asyncHandler(conversationsController.end));
