import type { ConversationMessage } from '@aura/shared';
import { DEFAULT_SHORT_TERM_MEMORY_MESSAGES } from './conversations.constants.js';

export interface MemoryFactCandidate {
  category: 'like' | 'dislike' | 'preference' | 'context';
  value: string;
}

export const conversationMemory = {
  shortTerm(messages: ConversationMessage[], take = DEFAULT_SHORT_TERM_MEMORY_MESSAGES) {
    return messages.slice(Math.max(0, messages.length - take));
  },

  // Sprint 3 boundary: return candidate memories only; persistence is explicit later.
  extractCandidates(_messages: ConversationMessage[]): MemoryFactCandidate[] {
    return [];
  },
};
