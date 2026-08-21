import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  unique,
  integer,
} from 'drizzle-orm/pg-core';

/**
 * Database schema (Drizzle ORM).
 *
 * Conventions (see docs/architecture/database-guidelines.md):
 * snake_case columns, plural tables, UUID primary keys, created_at/updated_at.
 */

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Refresh tokens are persisted (hashed) so they can be rotated and revoked.
 * The row id is used as the JWT `jti`.
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
export type NewRefreshTokenRow = typeof refreshTokens.$inferInsert;

/**
 * One-to-one product profile for a user. Auth identity stays in `users`;
 * personalization lives here so the two concerns evolve independently.
 *
 * Age policy: date of birth is intentionally NOT stored. Eligibility is
 * derived once (server-side) and only the boolean + timestamp are persisted.
 */
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  primaryLanguage: text('primary_language'),
  communicationStyle: text('communication_style'),
  aiPersonality: text('ai_personality'),
  preferences: jsonb('preferences').notNull().default({}),
  isAgeVerified: boolean('is_age_verified').notNull().default(false),
  ageVerifiedAt: timestamp('age_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Normalized languages a user speaks (enables cohort/analytics queries). */
export const userLanguages = pgTable(
  'user_languages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    languageCode: text('language_code').notNull(),
    proficiency: text('proficiency'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userLanguageUnique: unique('user_languages_user_id_language_code_unique').on(
      table.userId,
      table.languageCode,
    ),
  }),
);

/** Normalized interests (controlled catalogue slugs, validated at the boundary). */
export const userInterests = pgTable(
  'user_interests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    interest: text('interest').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userInterestUnique: unique('user_interests_user_id_interest_unique').on(
      table.userId,
      table.interest,
    ),
  }),
);

export type UserProfileRow = typeof userProfiles.$inferSelect;
export type NewUserProfileRow = typeof userProfiles.$inferInsert;
export type UserLanguageRow = typeof userLanguages.$inferSelect;
export type NewUserLanguageRow = typeof userLanguages.$inferInsert;
export type UserInterestRow = typeof userInterests.$inferSelect;
export type NewUserInterestRow = typeof userInterests.$inferInsert;

/** Conversation session lifecycle for realtime voice interactions. */
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  agentKey: text('agent_key').notNull(),
  livekitRoomName: text('livekit_room_name').notNull().unique(),
  status: text('status').notNull().default('created'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Text messages only; raw audio never persists in the database. */
export const conversationMessages = pgTable(
  'conversation_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    sequence: integer('sequence').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    conversationSequenceUnique: unique('conversation_messages_conversation_id_sequence_unique').on(
      table.conversationId,
      table.sequence,
    ),
  }),
);

export type ConversationRow = typeof conversations.$inferSelect;
export type NewConversationRow = typeof conversations.$inferInsert;
export type ConversationMessageRow = typeof conversationMessages.$inferSelect;
export type NewConversationMessageRow = typeof conversationMessages.$inferInsert;

/** AI Agents management for the Aura platform. */
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    model: text('model').notNull(), // 'gpt-4', 'claude-3', 'llama-2', etc.
    status: text('status').notNull().default('inactive'), // 'active', 'inactive', 'training'
    accuracy: integer('accuracy'), // 0-100, nullable for new agents
    conversationCount: integer('conversation_count').notNull().default(0),
    systemPromptId: uuid('system_prompt_id'), // FK to prompts (future)
    personaPromptId: uuid('persona_prompt_id'), // FK to prompts (future)
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    agentNameUnique: unique('agents_name_unique').on(table.name),
  }),
);

export type AgentRow = typeof agents.$inferSelect;
export type NewAgentRow = typeof agents.$inferInsert;

/**
 * Admin sessions track login/logout activity for admin panel.
 * Used for security auditing and concurrent session management.
 */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    loggedInAt: timestamp('logged_in_at', { withTimezone: true }).defaultNow().notNull(),
    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
    loggedOutAt: timestamp('logged_out_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  // Index on userId for efficient lookups
);

export type AdminSessionRow = typeof adminSessions.$inferSelect;
export type NewAdminSessionRow = typeof adminSessions.$inferInsert;

/**
 * Social spine.
 *
 * Aura hosts two participant categories in one graph:
 *   entity_type = 'REAL_PERSON' -> owned by a user row (user_id set, agent_id null)
 *   entity_type = 'AI'          -> backed by an agent (agent_id set, user_id null)
 *
 * The distinction is a first-class domain fact and is never derived from UI.
 */
export const socialProfiles = pgTable(
  'social_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    entityType: text('entity_type').notNull().default('REAL_PERSON'), // 'AI' | 'REAL_PERSON'
    handle: text('handle').notNull().unique(),
    displayName: text('display_name').notNull(),
    headline: text('headline'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    interests: jsonb('interests').notNull().default([]),
    presence: text('presence').notNull().default('offline'), // 'online' | 'away' | 'offline'
    verified: boolean('verified').notNull().default(false),
    discoverable: boolean('discoverable').notNull().default(true),
    followersCount: integer('followers_count').notNull().default(0),
    followingCount: integer('following_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
);

/** Directed follow edge. Counters on social_profiles are maintained in the same transaction. */
export const socialFollows = pgTable(
  'social_follows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    followerProfileId: uuid('follower_profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    followingProfileId: uuid('following_profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    socialFollowUnique: unique('social_follows_follower_following_unique').on(
      table.followerProfileId,
      table.followingProfileId,
    ),
  }),
);

/** Posts are a real-person capability; AI profiles are rejected in the service layer. */
export const socialPosts = pgTable('social_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  caption: text('caption').notNull(),
  mediaLabel: text('media_label').notNull(),
  mediaUrl: text('media_url'),
  visibility: text('visibility').notNull().default('public'), // 'public' | 'followers'
  likesCount: integer('likes_count').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

/** Stories are a real-person capability; AI profiles are rejected in the service layer. */
export const socialStories = pgTable('social_stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  caption: text('caption').notNull(),
  mediaLabel: text('media_label').notNull(),
  mediaUrl: text('media_url'),
  status: text('status').notNull().default('active'), // 'active' | 'expired'
  views: integer('views').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Conversation threads.
 *
 * Two kinds share one transport but not one ownership model:
 *   kind = 'companion' -> human <-> AI. The AI has no inbox, so only the human is a
 *                         participant and `participant_profile_id` names the companion.
 *   kind = 'direct'    -> human <-> human. Symmetric: BOTH sides are participants and
 *                         both read and write the same thread.
 *
 * Membership always comes from `social_conversation_participants`, never from
 * `owner_profile_id`, which is retained only as the thread's creator.
 */
export const socialConversations = pgTable('social_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind').notNull().default('companion'), // 'companion' | 'direct'
  ownerProfileId: uuid('owner_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  participantProfileId: uuid('participant_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  /** Canonical sorted pair key; makes a direct thread between two people unique. */
  directKey: text('direct_key').unique(),
  channel: text('channel').notNull().default('chat'), // 'chat' | 'voice' | 'video'
  status: text('status').notNull().default('live'), // 'live' | 'ended' | 'archived'
  topic: text('topic').notNull().default('New conversation'),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Per-participant state. Read position is per person, never shared. */
export const socialConversationParticipants = pgTable(
  'social_conversation_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => socialConversations.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }),
    /** Archiving is per participant; the other side keeps their thread. */
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    conversationParticipantUnique: unique('social_conversation_participants_conversation_profile_unique').on(
      table.conversationId,
      table.profileId,
    ),
  }),
);

/** Persisted text messages for social conversations. Real media/calls remain separate future work. */
export const socialConversationMessages = pgTable('social_conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => socialConversations.id, { onDelete: 'cascade' }),
  authorProfileId: uuid('author_profile_id').references(() => socialProfiles.id, { onDelete: 'set null' }),
  authorRole: text('author_role').notNull(), // 'owner' | 'participant' | 'system'
  body: text('body').notNull(),
  status: text('status').notNull().default('sent'), // 'sent' | 'failed'
  trace: jsonb('trace').notNull().default([]),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Companion spine.
 *
 * An AI companion is NOT a new identity table: it is an `agents` row (behaviour)
 * bound to a `social_profiles` row with entity_type = 'AI' (presence in the graph).
 * The tables below only add what neither of those already owns.
 */

/** Character definition for an agent. One row per agent. */
export const companionPersonas = pgTable('companion_personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id')
    .notNull()
    .unique()
    .references(() => agents.id, { onDelete: 'cascade' }),
  personality: jsonb('personality').notNull().default([]),
  traits: jsonb('traits').notNull().default([]),
  preferences: jsonb('preferences').notNull().default([]),
  boundaries: jsonb('boundaries').notNull().default([]),
  speakingExamples: jsonb('speaking_examples').notNull().default([]),
  backstory: text('backstory').notNull().default(''),
  languageMode: text('language_mode').notNull().default('english'),
  tone: text('tone').notNull().default('warm'),
  replyLength: text('reply_length').notNull().default('short'), // 'short' | 'medium' | 'long'
  relationshipStyle: text('relationship_style').notNull().default('friendly'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Per-viewer relationship state with a companion. Bounded, server-owned counters. */
export const companionRelationships = pgTable(
  'companion_relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    viewerProfileId: uuid('viewer_profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    companionProfileId: uuid('companion_profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    relationshipLevel: integer('relationship_level').notNull().default(1), // 1..10
    trust: integer('trust').notNull().default(50), // 0..100
    affection: integer('affection').notNull().default(45), // 0..100
    familiarity: integer('familiarity').notNull().default(40), // 0..100
    mood: text('mood').notNull().default('attentive'),
    interactionCount: integer('interaction_count').notNull().default(0),
    lastInteractionAt: timestamp('last_interaction_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companionRelationshipUnique: unique('companion_relationships_viewer_companion_unique').on(
      table.viewerProfileId,
      table.companionProfileId,
    ),
  }),
);

/** Durable memory written by the companion engine. Always scoped to (viewer, companion). */
export const companionMemories = pgTable('companion_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  viewerProfileId: uuid('viewer_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  companionProfileId: uuid('companion_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  layer: text('layer').notNull().default('short_term'), // 'short_term' | 'episodic' | 'relationship' | 'important'
  content: text('content').notNull(),
  importance: integer('importance').notNull().default(3), // 1..5
  status: text('status').notNull().default('active'), // 'active' | 'archived'
  /** Null means the layer never expires on age alone. */
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).defaultNow().notNull(),
  sourceConversationId: uuid('source_conversation_id').references(() => socialConversations.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * One row per generated companion turn. This is the observability record that makes
 * a provider swap auditable (provider/model/latency/cost stay out of the message body).
 */
export const companionTurns = pgTable('companion_turns', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => socialConversations.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => socialConversationMessages.id, { onDelete: 'set null' }),
  viewerProfileId: uuid('viewer_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  companionProfileId: uuid('companion_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  status: text('status').notNull().default('passed'), // 'passed' | 'failed' | 'blocked'
  latencyMs: integer('latency_ms').notNull().default(0),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  /** Integer micro-USD keeps budget arithmetic exact. */
  costMicroUsd: integer('cost_micro_usd').notNull().default(0),
  streamed: boolean('streamed').notNull().default(false),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  trace: jsonb('trace').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Consumer safety and account controls.
 *
 * Blocks are symmetric in effect (neither side sees the other) but stored directionally
 * so "who blocked whom" is never lost. Reports are an audit record, not a moderation
 * decision; acting on one is an admin workflow.
 */
export const socialBlocks = pgTable(
  'social_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockerProfileId: uuid('blocker_profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    blockedProfileId: uuid('blocked_profile_id')
      .notNull()
      .references(() => socialProfiles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    socialBlockUnique: unique('social_blocks_blocker_blocked_unique').on(
      table.blockerProfileId,
      table.blockedProfileId,
    ),
  }),
);

export const socialReports = pgTable('social_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterProfileId: uuid('reporter_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  subjectProfileId: uuid('subject_profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  subjectType: text('subject_type').notNull().default('profile'), // 'profile' | 'post' | 'story' | 'conversation'
  subjectId: uuid('subject_id'),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').notNull().default('open'), // 'open' | 'reviewing' | 'actioned' | 'dismissed'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** In-app notifications for the consumer surface. */
export const socialNotifications = pgTable('social_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .notNull()
    .references(() => socialProfiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'follow' | 'post' | 'message' | 'system'
  actorProfileId: uuid('actor_profile_id').references(() => socialProfiles.id, { onDelete: 'cascade' }),
  entityId: uuid('entity_id'),
  body: text('body').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SocialProfileRow = typeof socialProfiles.$inferSelect;
export type NewSocialProfileRow = typeof socialProfiles.$inferInsert;
export type SocialBlockRow = typeof socialBlocks.$inferSelect;
export type SocialReportRow = typeof socialReports.$inferSelect;
export type SocialNotificationRow = typeof socialNotifications.$inferSelect;
export type CompanionPersonaRow = typeof companionPersonas.$inferSelect;
export type NewCompanionPersonaRow = typeof companionPersonas.$inferInsert;
export type CompanionRelationshipRow = typeof companionRelationships.$inferSelect;
export type NewCompanionRelationshipRow = typeof companionRelationships.$inferInsert;
export type CompanionMemoryRow = typeof companionMemories.$inferSelect;
export type NewCompanionMemoryRow = typeof companionMemories.$inferInsert;
export type CompanionTurnRow = typeof companionTurns.$inferSelect;
export type NewCompanionTurnRow = typeof companionTurns.$inferInsert;

/**
 * Character benchmark.
 *
 * These rows are SYNTHETIC evaluation turns and are deliberately not stored in
 * `companion_turns`, which is the record of real user conversations. Mixing them would
 * corrupt live usage, budgets and audit. Nothing here references a real viewer, memory
 * or relationship row.
 */
export const benchmarkRuns = pgTable('benchmark_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  suiteId: text('suite_id').notNull(),
  suiteVersion: text('suite_version').notNull(),
  /** Candidate declaration this run measured. Never a secret, never a key. */
  candidateId: text('candidate_id').notNull().default('unknown'),
  candidateLabel: text('candidate_label').notNull().default('unknown'),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  moderation: text('moderation').notNull(),
  status: text('status').notNull().default('completed'), // 'completed' | 'failed'
  /** 0..10000 (basis points) so ranking never depends on float comparison. */
  overallScore: integer('overall_score').notNull().default(0),
  dimensionScores: jsonb('dimension_scores').notNull().default({}),
  categoryScores: jsonb('category_scores').notNull().default({}),
  weights: jsonb('weights').notNull().default({}),
  totalTurns: integer('total_turns').notNull().default(0),
  safetyFailures: integer('safety_failures').notNull().default(0),
  blockedTurns: integer('blocked_turns').notNull().default(0),
  failedTurns: integer('failed_turns').notNull().default(0),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  costMicroUsd: integer('cost_micro_usd').notNull().default(0),
  p50LatencyMs: integer('p50_latency_ms').notNull().default(0),
  p95LatencyMs: integer('p95_latency_ms').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const benchmarkTurnResults = pgTable('benchmark_turn_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => benchmarkRuns.id, { onDelete: 'cascade' }),
  caseId: text('case_id').notNull(),
  turnId: text('turn_id').notNull(),
  category: text('category').notNull(),
  sequence: integer('sequence').notNull(),
  userMessage: text('user_message').notNull(),
  responseText: text('response_text').notNull().default(''),
  status: text('status').notNull(),
  errorCode: text('error_code'),
  latencyMs: integer('latency_ms').notNull().default(0),
  promptTokens: integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  costMicroUsd: integer('cost_micro_usd').notNull().default(0),
  moderationFlags: jsonb('moderation_flags').notNull().default([]),
  safetyFailure: boolean('safety_failure').notNull().default(false),
  dimensionScores: jsonb('dimension_scores').notNull().default({}),
  trace: jsonb('trace').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type BenchmarkRunRow = typeof benchmarkRuns.$inferSelect;
export type NewBenchmarkRunRow = typeof benchmarkRuns.$inferInsert;
export type BenchmarkTurnResultRow = typeof benchmarkTurnResults.$inferSelect;
export type NewBenchmarkTurnResultRow = typeof benchmarkTurnResults.$inferInsert;

/**
 * Human evaluation. The automated rubric records what technically happened; a panel
 * records whether it actually felt good. One row per rater, per turn, per criterion.
 */
export const benchmarkHumanRatings = pgTable(
  'benchmark_human_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => benchmarkRuns.id, { onDelete: 'cascade' }),
    turnResultId: uuid('turn_result_id')
      .notNull()
      .references(() => benchmarkTurnResults.id, { onDelete: 'cascade' }),
    raterUserId: uuid('rater_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    criterion: text('criterion').notNull(),
    /** 1..5 as scored by the rater; normalized to 0..1 when aggregated. */
    score: integer('score').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    humanRatingUnique: unique('benchmark_human_ratings_turn_rater_criterion_unique').on(
      table.turnResultId,
      table.raterUserId,
      table.criterion,
    ),
  }),
);

export type BenchmarkHumanRatingRow = typeof benchmarkHumanRatings.$inferSelect;
export type NewBenchmarkHumanRatingRow = typeof benchmarkHumanRatings.$inferInsert;
export type SocialFollowRow = typeof socialFollows.$inferSelect;
export type SocialPostRow = typeof socialPosts.$inferSelect;
export type SocialStoryRow = typeof socialStories.$inferSelect;
export type SocialConversationRow = typeof socialConversations.$inferSelect;
export type NewSocialConversationRow = typeof socialConversations.$inferInsert;
export type SocialConversationParticipantRow = typeof socialConversationParticipants.$inferSelect;
export type SocialConversationMessageRow = typeof socialConversationMessages.$inferSelect;
export type NewSocialConversationMessageRow = typeof socialConversationMessages.$inferInsert;

