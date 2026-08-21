import { describe, expect, it } from 'vitest';
import {
  directKeyFor,
  rowToConversation,
  rowToConversationMessage,
} from '../src/modules/social/social.types.js';
import { conversationEvents } from '../src/modules/social/social.events.js';
import type { SocialConversationMessageRow, SocialConversationRow, SocialProfileRow } from '../src/db/schema.js';

const A = 'aaaaaaaa-0000-0000-0000-000000000001';
const B = 'bbbbbbbb-0000-0000-0000-000000000002';

function profile(id: string, overrides: Partial<SocialProfileRow> = {}): SocialProfileRow {
  return {
    id,
    userId: null,
    agentId: null,
    entityType: 'REAL_PERSON',
    handle: id === A ? 'ava' : 'ben',
    displayName: id === A ? 'Ava' : 'Ben',
    headline: null,
    bio: null,
    avatarUrl: null,
    interests: [],
    presence: 'online',
    verified: false,
    discoverable: true,
    followersCount: 0,
    followingCount: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as SocialProfileRow;
}

function message(authorProfileId: string | null, body: string): SocialConversationMessageRow {
  return {
    id: `msg-${body}`,
    conversationId: 'conv-1',
    authorProfileId,
    authorRole: authorProfileId === A ? 'owner' : authorProfileId === null ? 'system' : 'participant',
    body,
    status: 'sent',
    trace: [],
    readAt: null,
    createdAt: new Date('2026-01-02'),
  } as SocialConversationMessageRow;
}

const conversationRow = {
  id: 'conv-1',
  kind: 'direct',
  ownerProfileId: A,
  participantProfileId: B,
  directKey: directKeyFor(A, B),
  channel: 'chat',
  status: 'live',
  topic: 'Hello',
  lastReadAt: null,
  lastActivityAt: new Date('2026-01-02'),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
} as SocialConversationRow;

describe('direct thread identity', () => {
  it('produces the same key regardless of who starts the conversation', () => {
    expect(directKeyFor(A, B)).toBe(directKeyFor(B, A));
  });

  it('produces different keys for different pairs', () => {
    expect(directKeyFor(A, B)).not.toBe(directKeyFor(A, 'cccccccc-0000-0000-0000-000000000003'));
  });
});

describe('viewer-relative message authorship', () => {
  const fromA = message(A, 'hello from A');

  it('renders the same row as outgoing for the sender', () => {
    const rendered = rowToConversationMessage(fromA, { viewerProfileId: A, counterpart: profile(B) });
    expect(rendered.author).toBe('operator');
    expect(rendered.authorName).toBe('You');
    expect(rendered.entityType).toBeNull();
  });

  it('renders the same row as incoming for the recipient', () => {
    const rendered = rowToConversationMessage(fromA, { viewerProfileId: B, counterpart: profile(A) });
    expect(rendered.author).toBe('participant');
    expect(rendered.authorName).toBe('Ava');
    expect(rendered.entityType).toBe('REAL_PERSON');
  });

  it('does not rely on the legacy author_role column', () => {
    // A row written before 4L can carry a role that contradicts the viewer.
    const legacy = { ...fromA, authorRole: 'participant' } as SocialConversationMessageRow;
    expect(rowToConversationMessage(legacy, { viewerProfileId: A, counterpart: profile(B) }).author).toBe('operator');
  });

  it('always renders a system message as system', () => {
    const system = message(null, 'Message not delivered.');
    for (const viewer of [A, B]) {
      const rendered = rowToConversationMessage(system, {
        viewerProfileId: viewer,
        counterpart: profile(viewer === A ? B : A),
      });
      expect(rendered.author).toBe('system');
      expect(rendered.entityType).toBeNull();
    }
  });

  it('labels an AI counterpart correctly', () => {
    const companion = profile(B, { entityType: 'AI', displayName: 'Maya' });
    const rendered = rowToConversationMessage(message(B, 'hi'), { viewerProfileId: A, counterpart: companion });
    expect(rendered.entityType).toBe('AI');
    expect(rendered.authorName).toBe('Maya');
  });
});

describe('viewer-relative conversation shape', () => {
  const messages = [message(A, 'one'), message(B, 'two')];

  it('names the other side as the counterpart for each viewer', () => {
    const forA = rowToConversation(conversationRow, profile(B), [], { lastReadAt: null, unreadCount: 0 });
    const forB = rowToConversation(conversationRow, profile(A), [], { lastReadAt: null, unreadCount: 2 });

    expect(forA.profileId).toBe(B);
    expect(forA.participantName).toBe('Ben');
    expect(forB.profileId).toBe(A);
    expect(forB.participantName).toBe('Ava');
    expect(forA.id).toBe(forB.id);
  });

  it('carries a per-viewer unread count', () => {
    const forB = rowToConversation(conversationRow, profile(A), [], { lastReadAt: null, unreadCount: 2 });
    expect(forB.unreadCount).toBe(2);
  });

  it('exposes the thread kind so companion and direct stay distinguishable', () => {
    expect(rowToConversation(conversationRow, profile(B), [], { lastReadAt: null, unreadCount: 0 }).kind).toBe(
      'direct',
    );
    const companionRow = { ...conversationRow, kind: 'companion' } as SocialConversationRow;
    expect(rowToConversation(companionRow, profile(B), [], { lastReadAt: null, unreadCount: 0 }).kind).toBe(
      'companion',
    );
  });

  it('renders one shared history from two perspectives', () => {
    const forA = rowToConversation(
      conversationRow,
      profile(B),
      messages.map((row) => rowToConversationMessage(row, { viewerProfileId: A, counterpart: profile(B) })),
      { lastReadAt: null, unreadCount: 1 },
    );
    const forB = rowToConversation(
      conversationRow,
      profile(A),
      messages.map((row) => rowToConversationMessage(row, { viewerProfileId: B, counterpart: profile(A) })),
      { lastReadAt: null, unreadCount: 1 },
    );

    expect(forA.messages.map((m) => m.author)).toEqual(['operator', 'participant']);
    expect(forB.messages.map((m) => m.author)).toEqual(['participant', 'operator']);
    expect(forA.messages.map((m) => m.text)).toEqual(forB.messages.map((m) => m.text));
  });
});

describe('delivery event bus', () => {
  it('delivers only to the addressed recipient', () => {
    const seen: string[] = [];
    const forB = (event: { recipientProfileId: string; conversationId: string }): void => {
      if (event.recipientProfileId === B) seen.push(event.conversationId);
    };
    conversationEvents.on('message', forB);

    conversationEvents.emit('message', { conversationId: 'conv-1', recipientProfileId: B });
    conversationEvents.emit('message', { conversationId: 'conv-2', recipientProfileId: A });

    conversationEvents.off('message', forB);
    expect(seen).toEqual(['conv-1']);
  });

  it('does not cap listeners, so many connected clients are supported', () => {
    expect(conversationEvents.getMaxListeners()).toBe(0);
  });
});
