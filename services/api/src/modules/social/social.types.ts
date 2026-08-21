import type {
  SocialConversationMessageRow,
  SocialConversationRow,
  SocialPostRow,
  SocialProfileRow,
  SocialStoryRow,
} from '../../db/schema.js';

export type EntityType = 'AI' | 'REAL_PERSON';
export type PresenceStatus = 'online' | 'away' | 'offline';
export type ProfileVisibility = 'public' | 'followers';
export type SocialConversationChannel = 'chat' | 'voice' | 'video';
export type SocialConversationStatus = 'live' | 'ended' | 'archived';
export type SocialConversationKind = 'companion' | 'direct';
export type SocialMessageAuthor = 'operator' | 'participant' | 'system';

export interface SocialPost {
  id: string;
  profileId: string;
  caption: string;
  mediaLabel: string;
  mediaUrl: string | null;
  visibility: ProfileVisibility;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface SocialStory {
  id: string;
  profileId: string;
  caption: string;
  mediaLabel: string;
  mediaUrl: string | null;
  status: 'active' | 'expired';
  views: number;
  createdAt: string;
  expiresAt: string;
}

export interface SocialProfile {
  id: string;
  userId: string | null;
  agentId: string | null;
  type: EntityType;
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string | null;
  interests: string[];
  presence: PresenceStatus;
  verified: boolean;
  discoverable: boolean;
  followers: number;
  following: number;
  /** Relative to the requesting user's own profile. */
  followedByViewer: boolean;
  isSelf: boolean;
  joinedAt: string;
  stories: SocialStory[];
  posts: SocialPost[];
}

export interface SocialConversationMessage {
  id: string;
  author: SocialMessageAuthor;
  authorName: string;
  entityType: EntityType | null;
  text: string;
  timestamp: string;
  status: 'sent' | 'failed';
  readAt: string | null;
}

export interface SocialConversation {
  id: string;
  kind: SocialConversationKind;
  profileId: string;
  participantName: string;
  participantHandle: string;
  entityType: EntityType;
  agentId: string | null;
  channel: SocialConversationChannel;
  status: SocialConversationStatus;
  topic: string;
  startedAt: string;
  lastActivityAt: string;
  lastReadAt: string | null;
  /** Messages from the counterpart that arrived after this viewer's read position. */
  unreadCount: number;
  messages: SocialConversationMessage[];
  lastTrace: unknown[];
  lastTurnStatus: 'passed' | 'failed' | null;
  errors: string[];
}

function stamp(value: Date | string | null): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 16).replace('T', ' ');
}

export function rowToPost(row: SocialPostRow): SocialPost {
  return {
    id: row.id,
    profileId: row.profileId,
    caption: row.caption,
    mediaLabel: row.mediaLabel,
    mediaUrl: row.mediaUrl,
    visibility: row.visibility === 'followers' ? 'followers' : 'public',
    likes: row.likesCount,
    comments: row.commentsCount,
    createdAt: stamp(row.createdAt),
  };
}

export function rowToStory(row: SocialStoryRow): SocialStory {
  return {
    id: row.id,
    profileId: row.profileId,
    caption: row.caption,
    mediaLabel: row.mediaLabel,
    mediaUrl: row.mediaUrl,
    status: row.status === 'expired' ? 'expired' : 'active',
    views: row.views,
    createdAt: stamp(row.createdAt),
    expiresAt: stamp(row.expiresAt),
  };
}

export function rowToProfile(
  row: SocialProfileRow,
  context: { followedByViewer: boolean; isSelf: boolean; stories: SocialStory[]; posts: SocialPost[] },
): SocialProfile {
  return {
    id: row.id,
    userId: row.userId,
    agentId: row.agentId,
    type: row.entityType === 'AI' ? 'AI' : 'REAL_PERSON',
    handle: row.handle,
    displayName: row.displayName,
    headline: row.headline ?? '',
    bio: row.bio ?? '',
    avatarUrl: row.avatarUrl,
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : [],
    presence: row.presence === 'online' || row.presence === 'away' ? row.presence : 'offline',
    verified: row.verified,
    discoverable: row.discoverable,
    followers: row.followersCount,
    following: row.followingCount,
    followedByViewer: context.followedByViewer,
    isSelf: context.isSelf,
    joinedAt: stamp(row.createdAt),
    stories: context.stories,
    posts: context.posts,
  };
}

/**
 * Message rendering is relative to the VIEWER, not to the thread creator. `author_role`
 * on the row is legacy; authorship is derived from `author_profile_id` so both sides of
 * a direct thread see the same history from their own perspective.
 */
export function rowToConversationMessage(
  row: SocialConversationMessageRow,
  context: { viewerProfileId: string; counterpart: SocialProfileRow },
): SocialConversationMessage {
  const isSystem = row.authorRole === 'system' || row.authorProfileId === null;
  const author: SocialMessageAuthor = isSystem
    ? 'system'
    : row.authorProfileId === context.viewerProfileId
      ? 'operator'
      : 'participant';

  return {
    id: row.id,
    author,
    authorName:
      author === 'participant' ? context.counterpart.displayName : author === 'operator' ? 'You' : 'Aura',
    entityType:
      author === 'participant' ? (context.counterpart.entityType === 'AI' ? 'AI' : 'REAL_PERSON') : null,
    text: row.body,
    timestamp: stamp(row.createdAt),
    status: row.status === 'failed' ? 'failed' : 'sent',
    readAt: stamp(row.readAt) || null,
  };
}

export function rowToConversation(
  row: SocialConversationRow,
  counterpart: SocialProfileRow,
  messages: SocialConversationMessage[],
  viewer: { lastReadAt: Date | null; unreadCount: number },
): SocialConversation {
  return {
    id: row.id,
    kind: row.kind === 'direct' ? 'direct' : 'companion',
    profileId: counterpart.id,
    participantName: counterpart.displayName,
    participantHandle: counterpart.handle.startsWith('@') ? counterpart.handle : `@${counterpart.handle}`,
    entityType: counterpart.entityType === 'AI' ? 'AI' : 'REAL_PERSON',
    agentId: counterpart.agentId,
    channel: row.channel === 'voice' || row.channel === 'video' ? row.channel : 'chat',
    status: row.status === 'ended' || row.status === 'archived' ? row.status : 'live',
    topic: row.topic,
    startedAt: stamp(row.createdAt),
    lastActivityAt: stamp(row.lastActivityAt),
    lastReadAt: stamp(viewer.lastReadAt) || null,
    unreadCount: viewer.unreadCount,
    messages,
    lastTrace: [],
    lastTurnStatus: null,
    errors: [],
  };
}

/** Canonical key so a direct thread between two people can only exist once. */
export function directKeyFor(a: string, b: string): string {
  return [a, b].sort().join(':');
}
