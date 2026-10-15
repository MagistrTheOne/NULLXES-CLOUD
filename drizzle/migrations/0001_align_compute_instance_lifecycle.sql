ALTER TABLE "compute_instances" DROP CONSTRAINT "compute_instances_lifecycle_status_chk";--> statement-breakpoint
-- Preserve every row while mapping the two legacy terminal/deletion states to the canonical lifecycle vocabulary.
UPDATE "compute_instances"
SET "lifecycle_status" = CASE "lifecycle_status"
	WHEN 'deleting' THEN 'terminating'
	WHEN 'deleted' THEN 'terminated'
	ELSE "lifecycle_status"
END
WHERE "lifecycle_status" IN ('deleting', 'deleted');--> statement-breakpoint
ALTER TABLE "compute_instances" ADD CONSTRAINT "compute_instances_lifecycle_status_chk" CHECK ("compute_instances"."lifecycle_status" IN ('requested', 'provisioning', 'starting', 'running', 'stopping', 'stopped', 'restarting', 'terminating', 'terminated', 'failed', 'unknown', 'reconciliation_required'));
