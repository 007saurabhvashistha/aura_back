CREATE TABLE IF NOT EXISTS "social_conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"author_profile_id" uuid,
	"author_role" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"trace" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_profile_id" uuid NOT NULL,
	"participant_profile_id" uuid NOT NULL,
	"channel" text DEFAULT 'chat' NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"topic" text DEFAULT 'New conversation' NOT NULL,
	"last_read_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_conversation_messages" ADD CONSTRAINT "social_conversation_messages_conversation_id_social_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."social_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_conversation_messages" ADD CONSTRAINT "social_conversation_messages_author_profile_id_social_profiles_id_fk" FOREIGN KEY ("author_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_conversations" ADD CONSTRAINT "social_conversations_owner_profile_id_social_profiles_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_conversations" ADD CONSTRAINT "social_conversations_participant_profile_id_social_profiles_id_fk" FOREIGN KEY ("participant_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
