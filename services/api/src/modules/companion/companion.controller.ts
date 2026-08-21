import type { Request, Response } from 'express';
import { socialService } from '../social/social.service.js';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import { companionPersonaService } from './companion.persona.service.js';
import { companionService } from './companion.service.js';
import {
  agentIdParamSchema,
  companionProfileIdParamSchema,
  listCompanionsQuerySchema,
  listMemoriesQuerySchema,
  upsertPersonaSchema,
} from './companion.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

export const companionController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = listCompanionsQuerySchema.parse(req.query);
    requireUserId(req);
    const companions = await companionService.listCompanions(query.limit);
    res.status(200).json(success(companions, 'Companions retrieved'));
  },

  async engineStatus(req: Request, res: Response): Promise<void> {
    requireUserId(req);
    res.status(200).json(success(companionService.engineStatus(), 'Companion engine status'));
  },

  async detail(req: Request, res: Response): Promise<void> {
    const { profileId } = companionProfileIdParamSchema.parse(req.params);
    const viewerProfileId = await socialService.getMyProfileId(requireUserId(req));
    const [{ companion }, persona, relationship] = await Promise.all([
      companionService.getCompanion(profileId),
      companionService.getPersona(profileId),
      companionService.getRelationship(viewerProfileId, profileId),
    ]);
    res.status(200).json(success({ companion, persona, relationship }, 'Companion retrieved'));
  },

  async relationship(req: Request, res: Response): Promise<void> {
    const { profileId } = companionProfileIdParamSchema.parse(req.params);
    const viewerProfileId = await socialService.getMyProfileId(requireUserId(req));
    const relationship = await companionService.getRelationship(viewerProfileId, profileId);
    res.status(200).json(success(relationship, 'Relationship retrieved'));
  },

  async memories(req: Request, res: Response): Promise<void> {
    const { profileId } = companionProfileIdParamSchema.parse(req.params);
    const query = listMemoriesQuerySchema.parse(req.query);
    const viewerProfileId = await socialService.getMyProfileId(requireUserId(req));
    const memories = await companionService.listMemories(viewerProfileId, profileId, query.limit);
    res.status(200).json(success(memories, 'Memories retrieved'));
  },

  /** Admin-only: authors the character definition for an agent. */
  async upsertPersona(req: Request, res: Response): Promise<void> {
    const { agentId } = agentIdParamSchema.parse(req.params);
    const input = upsertPersonaSchema.parse(req.body ?? {});
    const persona = await companionPersonaService.upsert(agentId, input);
    res.status(200).json(success(persona, 'Persona saved'));
  },
};
