import type { AgentConfig } from '@aura/shared';
import { HttpError } from '../../utils/http_error.js';

const AGENTS: Record<string, AgentConfig> = {
  aura_default: {
    key: 'aura_default',
    name: 'Aura',
    systemPrompt:
      'You are Aura, a warm and emotionally intelligent AI companion. Be supportive without fostering dependency, avoid manipulative language, and never claim to be human.',
    personality: 'warm',
    voice: 'default',
    languageMode: 'mirror_user',
  },
};

export const agentConfigService = {
  getByKey(key: string): AgentConfig {
    const config = AGENTS[key];
    if (!config) {
      throw HttpError.badRequest('Unknown agent key', 'unknown_agent_key');
    }
    return config;
  },
};
