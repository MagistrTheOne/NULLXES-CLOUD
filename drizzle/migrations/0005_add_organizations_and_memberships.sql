CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"personal_owner_profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_name_nonempty_chk" CHECK (length(trim("name")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_personal_owner_uidx" ON "organizations" USING btree ("personal_owner_profile_id");
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_memberships_role_chk" CHECK ("role" IN ('owner', 'admin', 'operator', 'member', 'billing_viewer'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_org_profile_uidx" ON "organization_memberships" USING btree ("organization_id", "profile_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_memberships_single_owner_uidx" ON "organization_memberships" USING btree ("organization_id") WHERE "organization_memberships"."role" = 'owner';
--> statement-breakpoint
ALTER TABLE "compute_instances" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
INSERT INTO "organizations" ("name", "personal_owner_profile_id")
SELECT 'Personal workspace', "id"
FROM "customer_profiles"
ON CONFLICT ("personal_owner_profile_id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "organization_memberships" ("organization_id", "profile_id", "role")
SELECT "id", "personal_owner_profile_id", 'owner'
FROM "organizations"
WHERE "personal_owner_profile_id" IS NOT NULL
ON CONFLICT ("organization_id", "profile_id") DO NOTHING;
--> statement-breakpoint
UPDATE "compute_instances" AS instance
SET "organization_id" = organization."id"
FROM "organizations" AS organization
WHERE organization."personal_owner_profile_id" = instance."profile_id"
  AND instance."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "compute_instances" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_personal_owner_profile_fk"
FOREIGN KEY ("personal_owner_profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_fk"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_profile_fk"
FOREIGN KEY ("profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "compute_instances" ADD CONSTRAINT "compute_instances_organization_fk"
FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "organization_memberships_profile_idx" ON "organization_memberships" USING btree ("profile_id");
--> statement-breakpoint
CREATE INDEX "compute_instances_organization_created_idx" ON "compute_instances" USING btree ("organization_id", "created_at");
