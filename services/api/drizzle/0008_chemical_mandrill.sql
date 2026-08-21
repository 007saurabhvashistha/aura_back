ALTER TABLE "companion_memories" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "companion_memories" ADD COLUMN "last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "companion_turns" ADD COLUMN "prompt_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "companion_turns" ADD COLUMN "completion_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "companion_turns" ADD COLUMN "cost_micro_usd" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "companion_turns" ADD COLUMN "streamed" boolean DEFAULT false NOT NULL;