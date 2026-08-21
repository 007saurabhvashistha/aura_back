import { EventEmitter } from 'node:events';

/**
 * In-process delivery bus for live inbox updates.
 *
 * Single-instance only: a horizontally scaled deployment needs a shared broker
 * (Redis pub/sub or similar) behind this same interface. Delivery is best effort and
 * purely a notification that something changed — persistence is always the source of
 * truth, so a missed event costs a refresh, never a message.
 */
export interface ConversationMessageEvent {
  conversationId: string;
  recipientProfileId: string;
}

class ConversationEventBus extends EventEmitter {
  constructor() {
    super();
    // One listener per connected client; the default cap of 10 is far too low.
    this.setMaxListeners(0);
  }
}

export const conversationEvents = new ConversationEventBus();
