CREATE TABLE IF NOT EXISTS "companion_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewer_profile_id" uuid NOT NULL,
	"companion_profile_id" uuid NOT NULL,
	"layer" text DEFAULT 'short_term' NOT NULL,
	"content" text NOT NULL,
	"importance" integer DEFAULT 3 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"source_conversation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companion_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"personality" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"traits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferences" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"boundaries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"speaking_examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"backstory" text DEFAULT '' NOT NULL,
	"language_mode" text DEFAULT 'english' NOT NULL,
	"tone" text DEFAULT 'warm' NOT NULL,
	"reply_length" text DEFAULT 'short' NOT NULL,
	"relationship_style" text DEFAULT 'friendly' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_personas_agent_id_unique" UNIQUE("agent_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companion_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"viewer_profile_id" uuid NOT NULL,
	"companion_profile_id" uuid NOT NULL,
	"relationship_level" integer DEFAULT 1 NOT NULL,
	"trust" integer DEFAULT 50 NOT NULL,
	"affection" integer DEFAULT 45 NOT NULL,
	"familiarity" integer DEFAULT 40 NOT NULL,
	"mood" text DEFAULT 'attentive' NOT NULL,
	"interaction_count" integer DEFAULT 0 NOT NULL,
	"last_interaction_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_relationships_viewer_companion_unique" UNIQUE("viewer_profile_id","companion_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companion_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"viewer_profile_id" uuid NOT NULL,
	"companion_profile_id" uuid NOT NULL,
	"agent_id" uuid,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text DEFAULT 'passed' NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"error_message" text,
	"trace" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_memories" ADD CONSTRAINT "companion_memories_viewer_profile_id_social_profiles_id_fk" FOREIGN KEY ("viewer_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_memories" ADD CONSTRAINT "companion_memories_companion_profile_id_social_profiles_id_fk" FOREIGN KEY ("companion_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_memories" ADD CONSTRAINT "companion_memories_source_conversation_id_social_conversations_id_fk" FOREIGN KEY ("source_conversation_id") REFERENCES "public"."social_conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_personas" ADD CONSTRAINT "companion_personas_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_relationships" ADD CONSTRAINT "companion_relationships_viewer_profile_id_social_profiles_id_fk" FOREIGN KEY ("viewer_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_relationships" ADD CONSTRAINT "companion_relationships_companion_profile_id_social_profiles_id_fk" FOREIGN KEY ("companion_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_turns" ADD CONSTRAINT "companion_turns_conversation_id_social_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."social_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_turns" ADD CONSTRAINT "companion_turns_message_id_social_conversation_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."social_conversation_messages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_turns" ADD CONSTRAINT "companion_turns_viewer_profile_id_social_profiles_id_fk" FOREIGN KEY ("viewer_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_turns" ADD CONSTRAINT "companion_turns_companion_profile_id_social_profiles_id_fk" FOREIGN KEY ("companion_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companion_turns" ADD CONSTRAINT "companion_turns_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
