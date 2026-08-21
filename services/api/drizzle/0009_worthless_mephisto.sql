CREATE TABLE IF NOT EXISTS "benchmark_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"suite_id" text NOT NULL,
	"suite_version" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"moderation" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"dimension_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_turns" integer DEFAULT 0 NOT NULL,
	"safety_failures" integer DEFAULT 0 NOT NULL,
	"blocked_turns" integer DEFAULT 0 NOT NULL,
	"failed_turns" integer DEFAULT 0 NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micro_usd" integer DEFAULT 0 NOT NULL,
	"p50_latency_ms" integer DEFAULT 0 NOT NULL,
	"p95_latency_ms" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "benchmark_turn_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"case_id" text NOT NULL,
	"turn_id" text NOT NULL,
	"category" text NOT NULL,
	"sequence" integer NOT NULL,
	"user_message" text NOT NULL,
	"response_text" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"error_code" text,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"cost_micro_usd" integer DEFAULT 0 NOT NULL,
	"moderation_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"safety_failure" boolean DEFAULT false NOT NULL,
	"dimension_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"trace" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benchmark_turn_results" ADD CONSTRAINT "benchmark_turn_results_run_id_benchmark_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."benchmark_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
