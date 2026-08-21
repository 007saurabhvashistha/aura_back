CREATE TABLE IF NOT EXISTS "social_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_profile_id" uuid NOT NULL,
	"blocked_profile_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_blocks_blocker_blocked_unique" UNIQUE("blocker_profile_id","blocked_profile_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" text NOT NULL,
	"actor_profile_id" uuid,
	"entity_id" uuid,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_profile_id" uuid NOT NULL,
	"subject_profile_id" uuid NOT NULL,
	"subject_type" text DEFAULT 'profile' NOT NULL,
	"subject_id" uuid,
	"reason" text NOT NULL,
	"details" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_blocks" ADD CONSTRAINT "social_blocks_blocker_profile_id_social_profiles_id_fk" FOREIGN KEY ("blocker_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_blocks" ADD CONSTRAINT "social_blocks_blocked_profile_id_social_profiles_id_fk" FOREIGN KEY ("blocked_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_profile_id_social_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_notifications" ADD CONSTRAINT "social_notifications_actor_profile_id_social_profiles_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_reporter_profile_id_social_profiles_id_fk" FOREIGN KEY ("reporter_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_reports" ADD CONSTRAINT "social_reports_subject_profile_id_social_profiles_id_fk" FOREIGN KEY ("subject_profile_id") REFERENCES "public"."social_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
