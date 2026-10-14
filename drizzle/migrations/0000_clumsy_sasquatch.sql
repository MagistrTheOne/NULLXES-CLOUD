CREATE TABLE "catalog_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"configuration_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compute_configurations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"display_name" varchar(160) NOT NULL,
	"specifications" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compute_configurations_specifications_object_chk" CHECK (jsonb_typeof("compute_configurations"."specifications") = 'object')
);
--> statement-breakpoint
CREATE TABLE "compute_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"configuration_id" uuid NOT NULL,
	"provider" varchar(80),
	"provider_resource_id" varchar(200),
	"idempotency_key" varchar(200),
	"lifecycle_status" text DEFAULT 'requested' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compute_instances_lifecycle_status_chk" CHECK ("compute_instances"."lifecycle_status" IN ('requested', 'provisioning', 'running', 'stopping', 'stopped', 'failed', 'deleting', 'deleted')),
	CONSTRAINT "compute_instances_provider_identity_chk" CHECK ("compute_instances"."provider_resource_id" IS NULL OR "compute_instances"."provider" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "compute_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(80) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compute_resource_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"category" text NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"description" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compute_resource_types_category_chk" CHECK ("compute_resource_types"."category" IN ('gpu', 'cpu'))
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_category" varchar(40) NOT NULL,
	"billing_unit" varchar(40) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"rate" numeric(24, 8) NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_until" timestamp with time zone,
	"version" integer NOT NULL,
	"publication_status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_versions_category_chk" CHECK ("pricing_versions"."product_category" IN ('compute', 'storage', 'network')),
	CONSTRAINT "pricing_versions_billing_unit_chk" CHECK (length(trim("pricing_versions"."billing_unit")) BETWEEN 1 AND 40),
	CONSTRAINT "pricing_versions_currency_chk" CHECK ("pricing_versions"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pricing_versions_rate_positive_chk" CHECK ("pricing_versions"."rate" > 0),
	CONSTRAINT "pricing_versions_version_positive_chk" CHECK ("pricing_versions"."version" > 0),
	CONSTRAINT "pricing_versions_publication_status_chk" CHECK ("pricing_versions"."publication_status" IN ('draft', 'published')),
	CONSTRAINT "pricing_versions_effective_range_chk" CHECK ("pricing_versions"."effective_until" IS NULL OR "pricing_versions"."effective_until" > "pricing_versions"."effective_from")
);
--> statement-breakpoint
ALTER TABLE "catalog_listings" ADD CONSTRAINT "catalog_listings_configuration_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."compute_configurations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_listings" ADD CONSTRAINT "catalog_listings_region_fk" FOREIGN KEY ("region_id") REFERENCES "public"."compute_regions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compute_configurations" ADD CONSTRAINT "compute_configurations_resource_type_fk" FOREIGN KEY ("resource_type_id") REFERENCES "public"."compute_resource_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compute_instances" ADD CONSTRAINT "compute_instances_profile_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."customer_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compute_instances" ADD CONSTRAINT "compute_instances_configuration_fk" FOREIGN KEY ("configuration_id") REFERENCES "public"."compute_configurations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_listings_configuration_region_uidx" ON "catalog_listings" USING btree ("configuration_id","region_id");--> statement-breakpoint
CREATE INDEX "catalog_listings_region_idx" ON "catalog_listings" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "catalog_listings_published_idx" ON "catalog_listings" USING btree ("published");--> statement-breakpoint
CREATE UNIQUE INDEX "compute_configurations_slug_uidx" ON "compute_configurations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "compute_configurations_resource_type_idx" ON "compute_configurations" USING btree ("resource_type_id");--> statement-breakpoint
CREATE INDEX "compute_instances_profile_created_idx" ON "compute_instances" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "compute_instances_configuration_idx" ON "compute_instances" USING btree ("configuration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "compute_instances_profile_idempotency_uidx" ON "compute_instances" USING btree ("profile_id","idempotency_key") WHERE "compute_instances"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "compute_instances_provider_resource_uidx" ON "compute_instances" USING btree ("provider","provider_resource_id") WHERE "compute_instances"."provider_resource_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "compute_regions_code_uidx" ON "compute_regions" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "compute_resource_types_slug_uidx" ON "compute_resource_types" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_profiles_auth_user_id_uidx" ON "customer_profiles" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pricing_versions_category_unit_currency_version_uidx" ON "pricing_versions" USING btree ("product_category","billing_unit","currency","version");--> statement-breakpoint
CREATE INDEX "pricing_versions_publication_effective_idx" ON "pricing_versions" USING btree ("publication_status","effective_from");--> statement-breakpoint
CREATE FUNCTION "public"."prevent_published_pricing_versions_mutation"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	IF OLD."publication_status" = 'published' THEN
		RAISE EXCEPTION 'Published pricing versions are immutable; create a new version instead.'
			USING ERRCODE = '55000';
	END IF;
	IF TG_OP = 'DELETE' THEN
		RETURN OLD;
	END IF;
	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "pricing_versions_immutable_published"
	BEFORE UPDATE OR DELETE ON "public"."pricing_versions"
	FOR EACH ROW
	EXECUTE FUNCTION "public"."prevent_published_pricing_versions_mutation"();--> statement-breakpoint
COMMENT ON TABLE "public"."customer_profiles" IS 'Application profile keyed by Neon Auth user UUID; intentionally has no foreign key into Neon-managed tables.';--> statement-breakpoint
COMMENT ON TABLE "public"."catalog_listings" IS 'A published catalog definition is not evidence of live provider inventory or provisionability.';--> statement-breakpoint
COMMENT ON TABLE "public"."compute_instances" IS 'A row records application lifecycle intent and does not alone prove that a provider resource exists.';--> statement-breakpoint
COMMENT ON TABLE "public"."pricing_versions" IS 'Published pricing versions are immutable; create a new version for rate changes.';