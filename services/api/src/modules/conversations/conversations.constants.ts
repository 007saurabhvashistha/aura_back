export const CONVERSATION_STATUSES = [
  'created',
  'connecting',
  'active',
  'ending',
  'completed',
  'failed',
] as const;

export const CONVERSATION_ROLES = ['user', 'assistant', 'system'] as const;

export const DEFAULT_AGENT_KEY = 'aura_default';

export const DEFAULT_SHORT_TERM_MEMORY_MESSAGES = 12;
