CREATE TABLE IF NOT EXISTS "social_conversation_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_conversation_participants_conversation_profile_unique" UNIQUE("conversation_id","profile_id")
);
--> statement-breakpoint
ALTER TABLE "social_conversations" ADD COLUMN "kind" text DEFAULT 'companion' NOT NULL;--> statement-breakpoint
ALTER TABLE "social_conversations" ADD COLUMN "direct_key" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_conversation_participants" ADD CONSTRAINT "social_conversation_participants_conversation_id_social_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."social_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_conversation_participants" ADD CONSTRAINT "social_conversation_participants_profile_id_social_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Backfill: classify existing threads by who the counterpart actually is.
UPDATE "social_conversations" c
SET "kind" = CASE WHEN p."entity_type" = 'AI' THEN 'companion' ELSE 'direct' END
FROM "social_profiles" p
WHERE p."id" = c."participant_profile_id";
--> statement-breakpoint

-- Backfill: a direct thread was previously one row PER SIDE, and a pair could accumulate
-- several. Collapse each pair onto its earliest row so both people share one history.
CREATE TEMPORARY TABLE "tmp_direct_merge" AS
SELECT
  c."id" AS conversation_id,
  least(c."owner_profile_id", c."participant_profile_id")::text
    || ':' || greatest(c."owner_profile_id", c."participant_profile_id")::text AS pair_key,
  first_value(c."id") OVER (
    PARTITION BY least(c."owner_profile_id", c."participant_profile_id"),
                 greatest(c."owner_profile_id", c."participant_profile_id")
    ORDER BY c."created_at", c."id"
  ) AS keeper_id
FROM "social_conversations" c
WHERE c."kind" = 'direct';
--> statement-breakpoint

UPDATE "social_conversation_messages" m
SET "conversation_id" = t."keeper_id"
FROM "tmp_direct_merge" t
WHERE m."conversation_id" = t."conversation_id"
  AND t."conversation_id" <> t."keeper_id";
--> statement-breakpoint

DELETE FROM "social_conversations"
WHERE "id" IN (SELECT conversation_id FROM "tmp_direct_merge" WHERE conversation_id <> keeper_id);
--> statement-breakpoint

UPDATE "social_conversations" c
SET "direct_key" = t.pair_key
FROM "tmp_direct_merge" t
WHERE c."id" = t.keeper_id;
--> statement-breakpoint

DROP TABLE "tmp_direct_merge";
--> statement-breakpoint

-- Backfill membership: the creator always, plus the other side for direct threads.
INSERT INTO "social_conversation_participants" ("conversation_id", "profile_id", "last_read_at")
SELECT c."id", c."owner_profile_id", c."last_read_at" FROM "social_conversations" c
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "social_conversation_participants" ("conversation_id", "profile_id")
SELECT c."id", c."participant_profile_id" FROM "social_conversations" c WHERE c."kind" = 'direct'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

ALTER TABLE "social_conversations" ADD CONSTRAINT "social_conversations_direct_key_unique" UNIQUE("direct_key");