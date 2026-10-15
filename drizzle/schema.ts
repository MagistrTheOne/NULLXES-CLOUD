import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { LifecycleStatus } from "@/lib/infrastructure/contracts";
import type { ApplicationRole } from "@/lib/auth/roles";
import type { OrganizationRole } from "@/lib/auth/organization-policy";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: uuid("auth_user_id").notNull(),
    role: text("role").$type<ApplicationRole>().default("USER").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customer_profiles_auth_user_id_uidx").on(table.authUserId),
    check(
      "customer_profiles_role_chk",
      sql`${table.role} IN ('CEO', 'ADMIN', 'MANAGER', 'VIP', 'USER')`,
    ),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    personalOwnerProfileId: uuid("personal_owner_profile_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organizations_personal_owner_uidx").on(
      table.personalOwnerProfileId,
    ),
    check("organizations_name_nonempty_chk", sql`length(trim(${table.name})) > 0`),
    foreignKey({
      columns: [table.personalOwnerProfileId],
      foreignColumns: [customerProfiles.id],
      name: "organizations_personal_owner_profile_fk",
    }).onDelete("restrict"),
  ],
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    profileId: uuid("profile_id").notNull(),
    role: text("role").$type<OrganizationRole>().default("member").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organization_memberships_org_profile_uidx").on(
      table.organizationId,
      table.profileId,
    ),
    uniqueIndex("organization_memberships_single_owner_uidx")
      .on(table.organizationId)
      .where(sql`${table.role} = 'owner'`),
    index("organization_memberships_profile_idx").on(table.profileId),
    check(
      "organization_memberships_role_chk",
      sql`${table.role} IN ('owner', 'admin', 'operator', 'member', 'billing_viewer')`,
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "organization_memberships_organization_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [customerProfiles.id],
      name: "organization_memberships_profile_fk",
    }).onDelete("restrict"),
  ],
);

export const signupRateLimits = pgTable(
  "signup_rate_limits",
  {
    identifierHash: varchar("identifier_hash", { length: 64 }).primaryKey(),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    attemptCount: integer("attempt_count").default(1).notNull(),
  },
  (table) => [
    index("signup_rate_limits_window_started_idx").on(table.windowStartedAt),
    check("signup_rate_limits_attempt_count_positive_chk", sql`${table.attemptCount} > 0`),
  ],
);

export const computeResourceTypes = pgTable(
  "compute_resource_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    category: text("category").$type<"gpu" | "cpu">().notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    description: text("description"),
    published: boolean("published").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("compute_resource_types_slug_uidx").on(table.slug),
    check(
      "compute_resource_types_category_chk",
      sql`${table.category} IN ('gpu', 'cpu')`,
    ),
  ],
);

export const computeConfigurations = pgTable(
  "compute_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resourceTypeId: uuid("resource_type_id").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    specifications: jsonb("specifications")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    published: boolean("published").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("compute_configurations_slug_uidx").on(table.slug),
    index("compute_configurations_resource_type_idx").on(table.resourceTypeId),
    check(
      "compute_configurations_specifications_object_chk",
      sql`jsonb_typeof(${table.specifications}) = 'object'`,
    ),
    foreignKey({
      columns: [table.resourceTypeId],
      foreignColumns: [computeResourceTypes.id],
      name: "compute_configurations_resource_type_fk",
    }).onDelete("restrict"),
  ],
);

export const computeRegions = pgTable(
  "compute_regions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 80 }).notNull(),
    displayName: varchar("display_name", { length: 120 }).notNull(),
    published: boolean("published").default(false).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("compute_regions_code_uidx").on(table.code)],
);

export const catalogListings = pgTable(
  "catalog_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configurationId: uuid("configuration_id").notNull(),
    regionId: uuid("region_id").notNull(),
    published: boolean("published").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("catalog_listings_configuration_region_uidx").on(
      table.configurationId,
      table.regionId,
    ),
    index("catalog_listings_region_idx").on(table.regionId),
    index("catalog_listings_published_idx").on(table.published),
    foreignKey({
      columns: [table.configurationId],
      foreignColumns: [computeConfigurations.id],
      name: "catalog_listings_configuration_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.regionId],
      foreignColumns: [computeRegions.id],
      name: "catalog_listings_region_fk",
    }).onDelete("restrict"),
  ],
);

export const pricingVersions = pgTable(
  "pricing_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productCategory: varchar("product_category", { length: 40 }).notNull(),
    billingUnit: varchar("billing_unit", { length: 40 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    rate: numeric("rate", { precision: 24, scale: 8 }).notNull(),
    effectiveFrom: timestamp("effective_from", { withTimezone: true })
      .notNull(),
    effectiveUntil: timestamp("effective_until", { withTimezone: true }),
    version: integer("version").notNull(),
    publicationStatus: text("publication_status")
      .$type<"draft" | "published">()
      .default("draft")
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pricing_versions_category_unit_currency_version_uidx").on(
      table.productCategory,
      table.billingUnit,
      table.currency,
      table.version,
    ),
    index("pricing_versions_publication_effective_idx").on(
      table.publicationStatus,
      table.effectiveFrom,
    ),
    check("pricing_versions_category_chk", sql`${table.productCategory} IN ('compute', 'storage', 'network')`),
    check(
      "pricing_versions_billing_unit_chk",
      sql`length(trim(${table.billingUnit})) BETWEEN 1 AND 40`,
    ),
    check(
      "pricing_versions_currency_chk",
      sql`${table.currency} ~ '^[A-Z]{3}$'`,
    ),
    check("pricing_versions_rate_positive_chk", sql`${table.rate} > 0`),
    check("pricing_versions_version_positive_chk", sql`${table.version} > 0`),
    check(
      "pricing_versions_publication_status_chk",
      sql`${table.publicationStatus} IN ('draft', 'published')`,
    ),
    check(
      "pricing_versions_effective_range_chk",
      sql`${table.effectiveUntil} IS NULL OR ${table.effectiveUntil} > ${table.effectiveFrom}`,
    ),
  ],
);

export const computeInstances = pgTable(
  "compute_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    profileId: uuid("profile_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    configurationId: uuid("configuration_id").notNull(),
    provider: varchar("provider", { length: 80 }),
    providerResourceId: varchar("provider_resource_id", { length: 200 }),
    idempotencyKey: varchar("idempotency_key", { length: 200 }),
    lifecycleStatus: text("lifecycle_status")
      .$type<LifecycleStatus>()
      .default("requested")
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("compute_instances_profile_created_idx").on(
      table.profileId,
      table.createdAt,
    ),
    index("compute_instances_organization_created_idx").on(
      table.organizationId,
      table.createdAt,
    ),
    index("compute_instances_configuration_idx").on(table.configurationId),
    uniqueIndex("compute_instances_profile_idempotency_uidx")
      .on(table.profileId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} IS NOT NULL`),
    uniqueIndex("compute_instances_provider_resource_uidx")
      .on(table.provider, table.providerResourceId)
      .where(sql`${table.providerResourceId} IS NOT NULL`),
    check(
      "compute_instances_lifecycle_status_chk",
      sql`${table.lifecycleStatus} IN ('requested', 'provisioning', 'starting', 'running', 'stopping', 'stopped', 'restarting', 'terminating', 'terminated', 'failed', 'unknown', 'reconciliation_required')`,
    ),
    check(
      "compute_instances_provider_identity_chk",
      sql`${table.providerResourceId} IS NULL OR ${table.provider} IS NOT NULL`,
    ),
    foreignKey({
      columns: [table.profileId],
      foreignColumns: [customerProfiles.id],
      name: "compute_instances_profile_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
      name: "compute_instances_organization_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.configurationId],
      foreignColumns: [computeConfigurations.id],
      name: "compute_instances_configuration_fk",
    }).onDelete("restrict"),
  ],
);
