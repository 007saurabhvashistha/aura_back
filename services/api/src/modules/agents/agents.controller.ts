import type { Request, Response } from 'express';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import { agentsService } from './agents.service.js';
import {
  agentIdParamSchema,
  createAgentSchema,
  listAgentsQuerySchema,
  updateAgentSchema,
} from './agents.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

function requireAdminRole(req: Request): void {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  if (req.user.role !== 'admin') {
    throw HttpError.forbidden('Admin access required');
  }
}

export const agentsController = {
  async list(req: Request, res: Response): Promise<void> {
    requireAdminRole(req);

    const query = listAgentsQuerySchema.parse(req.query);
    const { data, total } = await agentsService.list(query);
    const totalPages = Math.ceil(total / query.limit);

    res.status(200).json(
      success(
        {
          data,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
          },
        },
        'Agents retrieved',
      ),
    );
  },

  async create(req: Request, res: Response): Promise<void> {
    requireAdminRole(req);

    const input = createAgentSchema.parse(req.body ?? {});
    const createdBy = requireUserId(req);
    const agent = await agentsService.create(input, createdBy);

    res.status(201).json(success(agent, 'Agent created'));
  },

  async getById(req: Request, res: Response): Promise<void> {
    requireAdminRole(req);

    const { id } = agentIdParamSchema.parse(req.params);
    const agent = await agentsService.getById(id);

    res.status(200).json(success(agent, 'Agent retrieved'));
  },

  async update(req: Request, res: Response): Promise<void> {
    requireAdminRole(req);

    const { id } = agentIdParamSchema.parse(req.params);
    const input = updateAgentSchema.parse(req.body ?? {});
    const agent = await agentsService.update(id, input);

    res.status(200).json(success(agent, 'Agent updated'));
  },

  async delete(req: Request, res: Response): Promise<void> {
    requireAdminRole(req);

    const { id } = agentIdParamSchema.parse(req.params);
    await agentsService.delete(id);

    res.status(204).send();
  },
};
