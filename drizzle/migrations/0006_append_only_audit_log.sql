CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_profile_id" uuid,
	"actor_role" varchar(32) NOT NULL,
	"action" varchar(120) NOT NULL,
	"outcome" text NOT NULL,
	"resource_type" varchar(80) NOT NULL,
	"resource_id" varchar(200) NOT NULL,
	"request_id" uuid NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_outcome_chk" CHECK ("audit_logs"."outcome" IN ('success', 'denied', 'failure')),
	CONSTRAINT "audit_logs_actor_role_chk" CHECK ("audit_logs"."actor_role" IN ('owner', 'admin', 'operator', 'member', 'billing_viewer', 'system')),
	CONSTRAINT "audit_logs_metadata_object_chk" CHECK (jsonb_typeof("audit_logs"."metadata") = 'object'),
	CONSTRAINT "audit_logs_action_chk" CHECK ("audit_logs"."action" ~ '^[a-z][a-z0-9_.:-]{1,119}$')
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_profile_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_organization_created_idx" ON "audit_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs" USING btree ("request_id");--> statement-breakpoint
CREATE FUNCTION public.reject_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'Audit log entries are append-only.' USING ERRCODE = '55000';
END;
$$;--> statement-breakpoint
CREATE TRIGGER audit_logs_reject_row_mutation
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.reject_audit_log_mutation();--> statement-breakpoint
CREATE TRIGGER audit_logs_reject_truncate
BEFORE TRUNCATE ON public.audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION public.reject_audit_log_mutation();
