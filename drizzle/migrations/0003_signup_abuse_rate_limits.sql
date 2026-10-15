CREATE TABLE "signup_rate_limits" (
	"identifier_hash" varchar(64) PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "signup_rate_limits_attempt_count_positive_chk" CHECK ("signup_rate_limits"."attempt_count" > 0)
);
--> statement-breakpoint
CREATE INDEX "signup_rate_limits_window_started_idx" ON "signup_rate_limits" USING btree ("window_started_at");