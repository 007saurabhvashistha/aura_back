import type {
  Conversation,
  ConversationDetailResponse,
  ConversationListResponse,
  ConversationStartResponse,
} from '@aura/shared';
import { apiRequest } from './api';

export const conversationApi = {
  start(agentKey = 'aura_default'): Promise<ConversationStartResponse> {
    return apiRequest<ConversationStartResponse>('/api/v1/conversations', {
      method: 'POST',
      body: { agentKey },
    });
  },

  list(limit = 20): Promise<ConversationListResponse> {
    const params = new URLSearchParams({ limit: String(limit) });
    return apiRequest<ConversationListResponse>(`/api/v1/conversations?${params.toString()}`);
  },

  getById(id: string): Promise<ConversationDetailResponse> {
    return apiRequest<ConversationDetailResponse>(`/api/v1/conversations/${id}`);
  },

  end(id: string): Promise<{ conversation: Conversation }> {
    return apiRequest<{ conversation: Conversation }>(`/api/v1/conversations/${id}/end`, {
      method: 'POST',
    });
  },
};
