import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  unique,
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
