CREATE TABLE IF NOT EXISTS "benchmark_human_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"turn_result_id" uuid NOT NULL,
	"rater_user_id" uuid NOT NULL,
	"criterion" text NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "benchmark_human_ratings_turn_rater_criterion_unique" UNIQUE("turn_result_id","rater_user_id","criterion")
);
--> statement-breakpoint
ALTER TABLE "benchmark_runs" ADD COLUMN "candidate_id" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "benchmark_runs" ADD COLUMN "candidate_label" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benchmark_human_ratings" ADD CONSTRAINT "benchmark_human_ratings_run_id_benchmark_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."benchmark_runs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benchmark_human_ratings" ADD CONSTRAINT "benchmark_human_ratings_turn_result_id_benchmark_turn_results_id_fk" FOREIGN KEY ("turn_result_id") REFERENCES "public"."benchmark_turn_results"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "benchmark_human_ratings" ADD CONSTRAINT "benchmark_human_ratings_rater_user_id_users_id_fk" FOREIGN KEY ("rater_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
