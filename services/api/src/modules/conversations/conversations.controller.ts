import type { Request, Response } from 'express';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import {
  conversationIdParamSchema,
  createConversationSchema,
  listConversationsQuerySchema,
} from './conversations.schemas.js';
import { conversationsService } from './conversations.service.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

export const conversationsController = {
  async create(req: Request, res: Response): Promise<void> {
    const input = createConversationSchema.parse(req.body ?? {});
    const data = await conversationsService.start(requireUserId(req), input);
    res.status(201).json(success(data, 'Conversation created'));
  },

  async list(req: Request, res: Response): Promise<void> {
    const { limit } = listConversationsQuerySchema.parse(req.query);
    const data = await conversationsService.list(requireUserId(req), limit);
    res.status(200).json(success(data, 'OK'));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = conversationIdParamSchema.parse(req.params);
    const data = await conversationsService.get(requireUserId(req), id);
    res.status(200).json(success(data, 'OK'));
  },

  async end(req: Request, res: Response): Promise<void> {
    const { id } = conversationIdParamSchema.parse(req.params);
    const data = await conversationsService.end(requireUserId(req), id);
    res.status(200).json(success({ conversation: data }, 'Conversation ended'));
  },
};
