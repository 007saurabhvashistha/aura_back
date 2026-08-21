CREATE TABLE IF NOT EXISTS "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"logged_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"logged_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_profile_id" uuid NOT NULL,
	"following_profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_follows_follower_following_unique" UNIQUE("follower_profile_id","following_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"caption" text NOT NULL,
	"media_label" text NOT NULL,
	"media_url" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"agent_id" uuid,
	"entity_type" text DEFAULT 'REAL_PERSON' NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"headline" text,
	"bio" text,
	"avatar_url" text,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"presence" text DEFAULT 'offline' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"discoverable" boolean DEFAULT true NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"following_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "social_profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"caption" text NOT NULL,
	"media_label" text NOT NULL,
	"media_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_follower_profile_id_social_profiles_id_fk" FOREIGN KEY ("follower_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_follows" ADD CONSTRAINT "social_follows_following_profile_id_social_profiles_id_fk" FOREIGN KEY ("following_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_profile_id_social_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_profiles" ADD CONSTRAINT "social_profiles_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_stories" ADD CONSTRAINT "social_stories_profile_id_social_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
