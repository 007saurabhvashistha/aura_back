import { and, asc, desc, eq, inArray, isNull, ne, not, or, sql } from 'drizzle-orm';
import { getDb } from '../../db/client.js';
import {
  socialBlocks,
  socialConversationMessages,
  socialConversationParticipants,
  socialConversations,
  socialFollows,
  socialNotifications,
  socialPosts,
  socialProfiles,
  socialReports,
  socialStories,
  userProfiles,
  users,
  type SocialProfileRow,
} from '../../db/schema.js';
import { HttpError } from '../../utils/http_error.js';
import { companionService } from '../companion/companion.service.js';
import type {
  CreatePostInput,
  CreateStoryInput,
  CreateSocialConversationInput,
  ListProfilesQuery,
  SendSocialMessageInput,
  UpdateMyProfileInput,
} from './social.schemas.js';
import {
  directKeyFor,
  rowToConversation,
  rowToConversationMessage,
  rowToPost,
  rowToProfile,
  rowToStory,
  type SocialConversation,
  type SocialPost,
  type SocialProfile,
  type SocialStory,
} from './social.types.js';
import { conversationEvents } from './social.events.js';

const STORY_TTL_HOURS = 24;

function getDatabase() {
  const db = getDb();
  if (!db) {
    throw HttpError.badRequest('Database not available', 'DATABASE_UNAVAILABLE');
  }
  return db;
}

function slugifyHandle(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 20);
  return base || 'aura';
}

/** Loads posts + stories for a set of profiles in two queries (no N+1). */
async function loadContent(profileIds: string[]): Promise<{
  posts: Map<string, SocialPost[]>;
  stories: Map<string, SocialStory[]>;
}> {
  const posts = new Map<string, SocialPost[]>();
  const stories = new Map<string, SocialStory[]>();
  if (profileIds.length === 0) return { posts, stories };

  const db = getDatabase();
  const [postRows, storyRows] = await Promise.all([
    db
      .select()
      .from(socialPosts)
      .where(and(inArray(socialPosts.profileId, profileIds), isNull(socialPosts.deletedAt)))
      .orderBy(desc(socialPosts.createdAt)),
    db
      .select()
      .from(socialStories)
      .where(inArray(socialStories.profileId, profileIds))
      .orderBy(desc(socialStories.createdAt)),
  ]);

  for (const row of postRows) {
    const list = posts.get(row.profileId) ?? [];
    list.push(rowToPost(row));
    posts.set(row.profileId, list);
  }

  const now = Date.now();
  for (const row of storyRows) {
    const story = rowToStory(row);
    // Expiry is derived on read so a background job is not required yet.
    if (story.status === 'active' && new Date(row.expiresAt).getTime() < now) {
      story.status = 'expired';
    }
    const list = stories.get(row.profileId) ?? [];
    list.push(story);
    stories.set(row.profileId, list);
  }

  return { posts, stories };
}

async function followedIdsFor(viewerProfileId: string | null, targetIds: string[]): Promise<Set<string>> {
  if (!viewerProfileId || targetIds.length === 0) return new Set();
  const db = getDatabase();
  const rows = await db
    .select({ followingProfileId: socialFollows.followingProfileId })
    .from(socialFollows)
    .where(
      and(
        eq(socialFollows.followerProfileId, viewerProfileId),
        inArray(socialFollows.followingProfileId, targetIds),
      ),
    );
  return new Set(rows.map((row) => row.followingProfileId));
}

/**
 * Profiles hidden from a viewer because either side blocked the other. A block is stored
 * directionally but always applies both ways so neither person can reach the other.
 */
async function hiddenProfileIdsFor(viewerProfileId: string | null): Promise<Set<string>> {
  if (!viewerProfileId) return new Set();
  const db = getDatabase();
  const rows = await db
    .select({ blocker: socialBlocks.blockerProfileId, blocked: socialBlocks.blockedProfileId })
    .from(socialBlocks)
    .where(
      or(eq(socialBlocks.blockerProfileId, viewerProfileId), eq(socialBlocks.blockedProfileId, viewerProfileId)),
    );

  const hidden = new Set<string>();
  for (const row of rows) {
    hidden.add(row.blocker === viewerProfileId ? row.blocked : row.blocker);
  }
  return hidden;
}

async function assertNotBlocked(viewerProfileId: string, otherProfileId: string): Promise<void> {
  const hidden = await hiddenProfileIdsFor(viewerProfileId);
  if (hidden.has(otherProfileId)) {
    throw HttpError.notFound('Profile not found', 'PROFILE_NOT_FOUND');
  }
}

async function notify(input: {
  profileId: string;
  actorProfileId: string | null;
  type: string;
  body: string;
  entityId?: string | null;
}): Promise<void> {
  // Never notify a profile about its own action, and never notify an AI companion.
  if (input.profileId === input.actorProfileId) return;
  const db = getDatabase();
  const [target] = await db.select().from(socialProfiles).where(eq(socialProfiles.id, input.profileId)).limit(1);
  if (!target || target.entityType === 'AI') return;

  await db.insert(socialNotifications).values({
    profileId: input.profileId,
    actorProfileId: input.actorProfileId,
    type: input.type,
    body: input.body,
    entityId: input.entityId ?? null,
  });
}

/** Idempotently guarantees membership rows; also repairs threads created before 4L. */
async function ensureParticipants(conversationId: string, profileIds: string[]): Promise<void> {
  const db = getDatabase();
  await db
    .insert(socialConversationParticipants)
    .values(profileIds.map((profileId) => ({ conversationId, profileId })))
    .onConflictDoNothing();
}

/** Authorization for every conversation operation: membership, never ownership. */
async function requireMembership(conversationId: string, viewerProfileId: string) {
  const db = getDatabase();
  const [row] = await db
    .select({ conversation: socialConversations })
    .from(socialConversations)
    .innerJoin(
      socialConversationParticipants,
      eq(socialConversationParticipants.conversationId, socialConversations.id),
    )
    .where(
      and(
        eq(socialConversations.id, conversationId),
        eq(socialConversationParticipants.profileId, viewerProfileId),
      ),
    )
    .limit(1);

  if (!row) {
    // Non-members are told the thread does not exist rather than that it is forbidden.
    throw HttpError.notFound('Conversation not found', 'CONVERSATION_NOT_FOUND');
  }
  return row.conversation;
}

/** The other side of the thread, relative to the viewer. */
async function counterpartFor(
  row: typeof socialConversations.$inferSelect,
  viewerProfileId: string,
): Promise<SocialProfileRow> {
  const db = getDatabase();
  const otherId = row.ownerProfileId === viewerProfileId ? row.participantProfileId : row.ownerProfileId;
  const [profile] = await db.select().from(socialProfiles).where(eq(socialProfiles.id, otherId)).limit(1);
  if (!profile) {
    throw HttpError.notFound('Conversation participant not found', 'PARTICIPANT_NOT_FOUND');
  }
  return profile;
}

async function loadSocialConversation(
  row: typeof socialConversations.$inferSelect,
  viewerProfileId: string,
): Promise<SocialConversation> {
  const db = getDatabase();
  const counterpart = await counterpartFor(row, viewerProfileId);

  const [[membership], messages] = await Promise.all([
    db
      .select()
      .from(socialConversationParticipants)
      .where(
        and(
          eq(socialConversationParticipants.conversationId, row.id),
          eq(socialConversationParticipants.profileId, viewerProfileId),
        ),
      )
      .limit(1),
    db
      .select()
      .from(socialConversationMessages)
      .where(eq(socialConversationMessages.conversationId, row.id))
      .orderBy(asc(socialConversationMessages.createdAt)),
  ]);

  const lastReadAt = membership?.lastReadAt ?? null;
  const unreadCount = messages.filter(
    (message) =>
      message.authorProfileId !== viewerProfileId &&
      message.authorRole !== 'system' &&
      (!lastReadAt || message.createdAt > lastReadAt),
  ).length;

  const conversation = rowToConversation(
    row,
    counterpart,
    messages.map((message) => rowToConversationMessage(message, { viewerProfileId, counterpart })),
    { lastReadAt, unreadCount },
  );

  // The last non-viewer message carries the turn trace produced by the companion engine.
  const lastReply = [...messages].reverse().find((message) => message.authorProfileId !== viewerProfileId);
  if (lastReply) {
    conversation.lastTrace = Array.isArray(lastReply.trace) ? (lastReply.trace as unknown[]) : [];
    conversation.lastTurnStatus = lastReply.status === 'failed' ? 'failed' : 'passed';
    conversation.errors = lastReply.status === 'failed' ? ['Companion reply failed'] : [];
  }

  return conversation;
}

export const socialService = {
  /**
   * Resolve the signed-in user's social profile, provisioning it on first use
   * from the existing auth identity. Identity is never taken from the client.
   */
  async ensureMyProfile(userId: string): Promise<SocialProfile> {
    const db = getDatabase();

    const existing = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.userId, userId))
      .limit(1);

    if (existing.length) {
      return this.getProfileById(existing[0].id, existing[0].id);
    }

    const [account] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!account) {
      throw HttpError.unauthorized();
    }
    const [profileRow] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const displayName = profileRow?.displayName?.trim() || account.name?.trim() || account.email.split('@')[0];
    const baseHandle = slugifyHandle(displayName);

    let handle = baseHandle;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = await db
        .select({ id: socialProfiles.id })
        .from(socialProfiles)
        .where(eq(socialProfiles.handle, handle))
        .limit(1);
      if (!clash.length) break;
      handle = `${baseHandle}${Math.floor(Math.random() * 9000) + 1000}`;
    }

    const [created] = await db
      .insert(socialProfiles)
      .values({
        userId,
        entityType: 'REAL_PERSON',
        handle,
        displayName,
        headline: profileRow?.bio ? null : null,
        bio: profileRow?.bio ?? null,
        avatarUrl: profileRow?.avatarUrl ?? null,
        interests: [],
        presence: 'online',
        discoverable: true,
      })
      .returning();

    return this.getProfileById(created.id, created.id);
  },

  async getMyProfileId(userId: string): Promise<string> {
    const profile = await this.ensureMyProfile(userId);
    return profile.id;
  },

  async getProfileById(profileId: string, viewerProfileId: string | null): Promise<SocialProfile> {
    const db = getDatabase();
    if (viewerProfileId) {
      await assertNotBlocked(viewerProfileId, profileId);
    }
    const [row] = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.id, profileId))
      .limit(1);

    if (!row) {
      throw HttpError.notFound('Profile not found');
    }

    const [{ posts, stories }, followed] = await Promise.all([
      loadContent([row.id]),
      followedIdsFor(viewerProfileId, [row.id]),
    ]);

    return rowToProfile(row, {
      followedByViewer: followed.has(row.id),
      isSelf: row.id === viewerProfileId,
      posts: posts.get(row.id) ?? [],
      stories: stories.get(row.id) ?? [],
    });
  },

  /** Discovery list. The viewer always sees their own profile even if hidden. */
  async listProfiles(viewerProfileId: string | null, query: ListProfilesQuery): Promise<SocialProfile[]> {
    const db = getDatabase();

    const visibility = viewerProfileId
      ? or(eq(socialProfiles.discoverable, true), eq(socialProfiles.id, viewerProfileId))
      : eq(socialProfiles.discoverable, true);

    const hidden = await hiddenProfileIdsFor(viewerProfileId);
    const notBlocked = hidden.size > 0 ? not(inArray(socialProfiles.id, [...hidden])) : undefined;

    const needle = query.search?.trim().toLowerCase();
    const search = needle
      ? sql`(lower(${socialProfiles.displayName}) like ${`%${needle}%`} or lower(${socialProfiles.handle}) like ${`%${needle}%`})`
      : undefined;

    const conditions = and(...[visibility, notBlocked, search].filter(Boolean));

    const rows = await db
      .select()
      .from(socialProfiles)
      .where(conditions)
      .orderBy(desc(socialProfiles.followersCount))
      .limit(query.limit);

    const ids = rows.map((row) => row.id);
    const [{ posts, stories }, followed] = await Promise.all([
      loadContent(ids),
      followedIdsFor(viewerProfileId, ids),
    ]);

    return rows.map((row) =>
      rowToProfile(row, {
        followedByViewer: followed.has(row.id),
        isSelf: row.id === viewerProfileId,
        posts: posts.get(row.id) ?? [],
        stories: stories.get(row.id) ?? [],
      }),
    );
  },

  async updateMyProfile(userId: string, input: UpdateMyProfileInput): Promise<SocialProfile> {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);

    await db
      .update(socialProfiles)
      .set({
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.headline !== undefined ? { headline: input.headline } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.interests !== undefined ? { interests: input.interests } : {}),
        ...(input.presence !== undefined ? { presence: input.presence } : {}),
        ...(input.discoverable !== undefined ? { discoverable: input.discoverable } : {}),
        updatedAt: new Date(),
      })
      .where(eq(socialProfiles.id, profileId));

    return this.getProfileById(profileId, profileId);
  },

  async follow(userId: string, targetProfileId: string): Promise<SocialProfile> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);

    if (viewerProfileId === targetProfileId) {
      throw HttpError.badRequest('You cannot follow your own profile', 'SELF_FOLLOW');
    }

    const [target] = await db
      .select({ id: socialProfiles.id })
      .from(socialProfiles)
      .where(eq(socialProfiles.id, targetProfileId))
      .limit(1);
    if (!target) {
      throw HttpError.notFound('Profile not found');
    }
    await assertNotBlocked(viewerProfileId, targetProfileId);

    let followed = false;
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(socialFollows)
        .values({ followerProfileId: viewerProfileId, followingProfileId: targetProfileId })
        .onConflictDoNothing()
        .returning({ id: socialFollows.id });

      if (inserted.length === 0) return; // already following — idempotent
      followed = true;

      await tx
        .update(socialProfiles)
        .set({ followersCount: sql`${socialProfiles.followersCount} + 1` })
        .where(eq(socialProfiles.id, targetProfileId));
      await tx
        .update(socialProfiles)
        .set({ followingCount: sql`${socialProfiles.followingCount} + 1` })
        .where(eq(socialProfiles.id, viewerProfileId));
    });

    if (followed) {
      const [viewer] = await db
        .select({ displayName: socialProfiles.displayName })
        .from(socialProfiles)
        .where(eq(socialProfiles.id, viewerProfileId))
        .limit(1);
      await notify({
        profileId: targetProfileId,
        actorProfileId: viewerProfileId,
        type: 'follow',
        body: `${viewer?.displayName ?? 'Someone'} started following you.`,
      });
    }

    return this.getProfileById(targetProfileId, viewerProfileId);
  },

  async unfollow(userId: string, targetProfileId: string): Promise<SocialProfile> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);

    await db.transaction(async (tx) => {
      const removed = await tx
        .delete(socialFollows)
        .where(
          and(
            eq(socialFollows.followerProfileId, viewerProfileId),
            eq(socialFollows.followingProfileId, targetProfileId),
          ),
        )
        .returning({ id: socialFollows.id });

      if (removed.length === 0) return;

      await tx
        .update(socialProfiles)
        .set({ followersCount: sql`greatest(${socialProfiles.followersCount} - 1, 0)` })
        .where(eq(socialProfiles.id, targetProfileId));
      await tx
        .update(socialProfiles)
        .set({ followingCount: sql`greatest(${socialProfiles.followingCount} - 1, 0)` })
        .where(eq(socialProfiles.id, viewerProfileId));
    });

    return this.getProfileById(targetProfileId, viewerProfileId);
  },

  async createPost(userId: string, input: CreatePostInput): Promise<SocialPost> {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);

    const [row] = await db
      .insert(socialPosts)
      .values({
        profileId,
        caption: input.caption,
        mediaLabel: input.mediaLabel,
        visibility: input.visibility,
      })
      .returning();

    return rowToPost(row);
  },

  /** Ownership is derived from the session, never from the request body. */
  async deletePost(userId: string, postId: string): Promise<void> {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);

    const deleted = await db
      .update(socialPosts)
      .set({ deletedAt: new Date() })
      .where(and(eq(socialPosts.id, postId), eq(socialPosts.profileId, profileId), isNull(socialPosts.deletedAt)))
      .returning({ id: socialPosts.id });

    if (deleted.length === 0) {
      throw HttpError.notFound('Post not found');
    }
  },

  async createStory(userId: string, input: CreateStoryInput): Promise<SocialStory> {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);

    const [row] = await db
      .insert(socialStories)
      .values({
        profileId,
        caption: input.caption,
        mediaLabel: input.mediaLabel,
        expiresAt: new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000),
      })
      .returning();

    return rowToStory(row);
  },

  async expireStory(userId: string, storyId: string): Promise<void> {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);

    const updated = await db
      .update(socialStories)
      .set({ status: 'expired', expiresAt: new Date() })
      .where(and(eq(socialStories.id, storyId), eq(socialStories.profileId, profileId)))
      .returning({ id: socialStories.id });

    if (updated.length === 0) {
      throw HttpError.notFound('Story not found');
    }
  },

  /** Public posts from discoverable profiles, plus the viewer's own posts. */
  async feed(viewerProfileId: string | null, limit: number): Promise<SocialPost[]> {
    const db = getDatabase();
    const hidden = await hiddenProfileIdsFor(viewerProfileId);

    const rows = await db
      .select({ post: socialPosts })
      .from(socialPosts)
      .innerJoin(socialProfiles, eq(socialPosts.profileId, socialProfiles.id))
      .where(
        and(
          ...[
            isNull(socialPosts.deletedAt),
            viewerProfileId
              ? or(eq(socialProfiles.discoverable, true), eq(socialProfiles.id, viewerProfileId))
              : eq(socialProfiles.discoverable, true),
            viewerProfileId
              ? or(eq(socialPosts.visibility, 'public'), eq(socialPosts.profileId, viewerProfileId))
              : eq(socialPosts.visibility, 'public'),
            hidden.size > 0 ? not(inArray(socialPosts.profileId, [...hidden])) : undefined,
          ].filter(Boolean),
        ),
      )
      .orderBy(desc(socialPosts.createdAt))
      .limit(limit);

    return rows.map((row) => rowToPost(row.post));
  },

  /** Blocking is mutual in effect: neither profile can see or reach the other. */
  async block(userId: string, targetProfileId: string): Promise<void> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    if (viewerProfileId === targetProfileId) {
      throw HttpError.badRequest('You cannot block your own profile', 'SELF_BLOCK');
    }

    const [target] = await db
      .select({ id: socialProfiles.id })
      .from(socialProfiles)
      .where(eq(socialProfiles.id, targetProfileId))
      .limit(1);
    if (!target) {
      throw HttpError.notFound('Profile not found', 'PROFILE_NOT_FOUND');
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(socialBlocks)
        .values({ blockerProfileId: viewerProfileId, blockedProfileId: targetProfileId })
        .onConflictDoNothing();

      // A block removes any existing relationship in both directions.
      for (const [follower, following] of [
        [viewerProfileId, targetProfileId],
        [targetProfileId, viewerProfileId],
      ]) {
        const removed = await tx
          .delete(socialFollows)
          .where(and(eq(socialFollows.followerProfileId, follower), eq(socialFollows.followingProfileId, following)))
          .returning({ id: socialFollows.id });
        if (removed.length === 0) continue;
        await tx
          .update(socialProfiles)
          .set({ followersCount: sql`greatest(${socialProfiles.followersCount} - 1, 0)` })
          .where(eq(socialProfiles.id, following));
        await tx
          .update(socialProfiles)
          .set({ followingCount: sql`greatest(${socialProfiles.followingCount} - 1, 0)` })
          .where(eq(socialProfiles.id, follower));
      }
    });
  },

  async unblock(userId: string, targetProfileId: string): Promise<void> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    await db
      .delete(socialBlocks)
      .where(
        and(eq(socialBlocks.blockerProfileId, viewerProfileId), eq(socialBlocks.blockedProfileId, targetProfileId)),
      );
  },

  /** Profiles this user has blocked. Profiles that blocked them are not disclosed. */
  async listBlocked(userId: string): Promise<Array<{ id: string; displayName: string; handle: string }>> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    return db
      .select({
        id: socialProfiles.id,
        displayName: socialProfiles.displayName,
        handle: socialProfiles.handle,
      })
      .from(socialBlocks)
      .innerJoin(socialProfiles, eq(socialBlocks.blockedProfileId, socialProfiles.id))
      .where(eq(socialBlocks.blockerProfileId, viewerProfileId))
      .orderBy(asc(socialProfiles.displayName));
  },

  async report(
    userId: string,
    input: { profileId: string; reason: string; details?: string; subjectType: string; subjectId?: string },
  ): Promise<void> {
    const db = getDatabase();
    const reporterProfileId = await this.getMyProfileId(userId);
    if (reporterProfileId === input.profileId) {
      throw HttpError.badRequest('You cannot report your own profile', 'SELF_REPORT');
    }

    const [target] = await db
      .select({ id: socialProfiles.id })
      .from(socialProfiles)
      .where(eq(socialProfiles.id, input.profileId))
      .limit(1);
    if (!target) {
      throw HttpError.notFound('Profile not found', 'PROFILE_NOT_FOUND');
    }

    await db.insert(socialReports).values({
      reporterProfileId,
      subjectProfileId: input.profileId,
      subjectType: input.subjectType,
      subjectId: input.subjectId ?? null,
      reason: input.reason,
      details: input.details ?? null,
    });
  },

  async listNotifications(userId: string, limit: number) {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);
    const rows = await db
      .select({
        id: socialNotifications.id,
        type: socialNotifications.type,
        body: socialNotifications.body,
        entityId: socialNotifications.entityId,
        readAt: socialNotifications.readAt,
        createdAt: socialNotifications.createdAt,
        actorProfileId: socialNotifications.actorProfileId,
        actorName: socialProfiles.displayName,
        actorHandle: socialProfiles.handle,
      })
      .from(socialNotifications)
      .leftJoin(socialProfiles, eq(socialNotifications.actorProfileId, socialProfiles.id))
      .where(eq(socialNotifications.profileId, profileId))
      .orderBy(desc(socialNotifications.createdAt))
      .limit(limit);

    return {
      unread: rows.filter((row) => row.readAt === null).length,
      items: rows.map((row) => ({
        ...row,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  },

  async markNotificationsRead(userId: string): Promise<void> {
    const db = getDatabase();
    const profileId = await this.getMyProfileId(userId);
    await db
      .update(socialNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(socialNotifications.profileId, profileId), isNull(socialNotifications.readAt)));
  },

  async listConversations(userId: string): Promise<SocialConversation[]> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    const hidden = await hiddenProfileIdsFor(viewerProfileId);

    const rows = await db
      .select({ conversation: socialConversations })
      .from(socialConversations)
      .innerJoin(
        socialConversationParticipants,
        eq(socialConversationParticipants.conversationId, socialConversations.id),
      )
      .where(
        and(
          eq(socialConversationParticipants.profileId, viewerProfileId),
          isNull(socialConversationParticipants.archivedAt),
        ),
      )
      .orderBy(desc(socialConversations.lastActivityAt));

    const conversations = await Promise.all(
      rows.map((row) => loadSocialConversation(row.conversation, viewerProfileId)),
    );
    // A blocked counterpart hides the thread; history survives and returns on unblock.
    return conversations.filter((conversation) => !hidden.has(conversation.profileId));
  },

  async createConversation(userId: string, input: CreateSocialConversationInput): Promise<SocialConversation> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);

    if (viewerProfileId === input.profileId) {
      throw HttpError.badRequest('You cannot start a conversation with your own profile', 'SELF_CONVERSATION');
    }

    const [participant] = await db
      .select()
      .from(socialProfiles)
      .where(eq(socialProfiles.id, input.profileId))
      .limit(1);
    if (!participant) {
      throw HttpError.notFound('Profile not found', 'PROFILE_NOT_FOUND');
    }
    if (participant.entityType === 'AI' && !participant.agentId) {
      throw HttpError.badRequest('This companion has no agent bound to it', 'COMPANION_NOT_CONFIGURED');
    }
    await assertNotBlocked(viewerProfileId, input.profileId);

    const isDirect = participant.entityType !== 'AI';
    const directKey = isDirect ? directKeyFor(viewerProfileId, input.profileId) : null;

    // A direct thread between two people is a single shared row, reachable from both sides.
    if (directKey) {
      const [existing] = await db
        .select()
        .from(socialConversations)
        .where(eq(socialConversations.directKey, directKey))
        .limit(1);
      if (existing) {
        await ensureParticipants(existing.id, [viewerProfileId, input.profileId]);
        return loadSocialConversation(existing, viewerProfileId);
      }
    }

    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(socialConversations)
        .values({
          kind: isDirect ? 'direct' : 'companion',
          ownerProfileId: viewerProfileId,
          participantProfileId: input.profileId,
          directKey,
          channel: input.channel,
          topic: input.topic,
          status: 'live',
          lastActivityAt: new Date(),
        })
        .returning();

      // Companion threads have one member: the AI has no inbox.
      const members = isDirect ? [viewerProfileId, input.profileId] : [viewerProfileId];
      await tx
        .insert(socialConversationParticipants)
        .values(members.map((profileId) => ({ conversationId: row.id, profileId })))
        .onConflictDoNothing();

      return row;
    });

    return loadSocialConversation(created, viewerProfileId);
  },

  async getConversation(userId: string, conversationId: string): Promise<SocialConversation> {
    const viewerProfileId = await this.getMyProfileId(userId);
    const row = await requireMembership(conversationId, viewerProfileId);
    return loadSocialConversation(row, viewerProfileId);
  },

  async sendMessage(
    userId: string,
    conversationId: string,
    input: SendSocialMessageInput,
    options?: { onDelta?: (delta: string) => void },
  ): Promise<SocialConversation> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    const conversation = await requireMembership(conversationId, viewerProfileId);

    if (conversation.status === 'archived') {
      throw HttpError.badRequest('Archived conversations cannot receive messages', 'CONVERSATION_ARCHIVED');
    }

    const counterpart = await counterpartFor(conversation, viewerProfileId);
    // A block severs an existing thread in both directions; history stays but is unreachable.
    await assertNotBlocked(viewerProfileId, counterpart.id);

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx.insert(socialConversationMessages).values({
        conversationId,
        authorProfileId: viewerProfileId,
        authorRole: conversation.ownerProfileId === viewerProfileId ? 'owner' : 'participant',
        body: input.text,
        status: 'sent',
        trace: [
          { stage: 'input', label: 'Message sent', status: 'passed' },
          { stage: 'transport', label: 'Persisted message', status: 'passed' },
        ],
      });
      await tx
        .update(socialConversations)
        .set({ status: 'live', lastActivityAt: now, updatedAt: now })
        .where(eq(socialConversations.id, conversationId));
      // Sending is an implicit read for the sender only.
      await tx
        .update(socialConversationParticipants)
        .set({ lastReadAt: now })
        .where(
          and(
            eq(socialConversationParticipants.conversationId, conversationId),
            eq(socialConversationParticipants.profileId, viewerProfileId),
          ),
        );
    });

    if (counterpart.entityType === 'AI') {
      // Companion threads run the character engine; the AI has no inbox to notify.
      await companionService.respondToUserMessage({
        conversationId,
        viewerProfileId,
        participant: counterpart,
        userMessage: input.text,
        onDelta: options?.onDelta,
      });
    } else {
      const [sender] = await db
        .select({ displayName: socialProfiles.displayName })
        .from(socialProfiles)
        .where(eq(socialProfiles.id, viewerProfileId))
        .limit(1);
      await notify({
        profileId: counterpart.id,
        actorProfileId: viewerProfileId,
        type: 'message',
        body: `${sender?.displayName ?? 'Someone'} sent you a message.`,
        entityId: conversationId,
      });
      conversationEvents.emit('message', { conversationId, recipientProfileId: counterpart.id });
    }

    return loadSocialConversation(conversation, viewerProfileId);
  },

  async markConversationRead(userId: string, conversationId: string): Promise<SocialConversation> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    const conversation = await requireMembership(conversationId, viewerProfileId);

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(socialConversationParticipants)
        .set({ lastReadAt: now })
        .where(
          and(
            eq(socialConversationParticipants.conversationId, conversationId),
            eq(socialConversationParticipants.profileId, viewerProfileId),
          ),
        );
      // Receipts only cover messages this viewer did not write.
      await tx
        .update(socialConversationMessages)
        .set({ readAt: now })
        .where(
          and(
            eq(socialConversationMessages.conversationId, conversationId),
            ne(socialConversationMessages.authorProfileId, viewerProfileId),
            isNull(socialConversationMessages.readAt),
          ),
        );
    });

    return loadSocialConversation(conversation, viewerProfileId);
  },

  /** Ending affects the thread; archiving is per participant so the other side keeps theirs. */
  async updateConversationStatus(
    userId: string,
    conversationId: string,
    status: 'ended' | 'archived',
  ): Promise<SocialConversation> {
    const db = getDatabase();
    const viewerProfileId = await this.getMyProfileId(userId);
    const conversation = await requireMembership(conversationId, viewerProfileId);
    const now = new Date();

    if (status === 'archived' && conversation.kind === 'direct') {
      await db
        .update(socialConversationParticipants)
        .set({ archivedAt: now })
        .where(
          and(
            eq(socialConversationParticipants.conversationId, conversationId),
            eq(socialConversationParticipants.profileId, viewerProfileId),
          ),
        );
      return loadSocialConversation(conversation, viewerProfileId);
    }

    const [row] = await db
      .update(socialConversations)
      .set({ status, updatedAt: now, lastActivityAt: now })
      .where(eq(socialConversations.id, conversationId))
      .returning();

    return loadSocialConversation(row, viewerProfileId);
  },
};
