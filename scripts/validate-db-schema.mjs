import "dotenv/config";
import assert from "node:assert/strict";
import { Pool } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DB_MIGRATION_URL || process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) {
  throw new Error(
    "Set DB_MIGRATION_URL or DATABASE_URL_UNPOOLED before validating the database schema.",
  );
}

const databaseHost = new URL(databaseUrl).hostname;
if (databaseHost.includes("-pooler")) {
  throw new Error("Schema validation requires a direct, non-pooled Neon connection.");
}

const pool = new Pool({ connectionString: databaseUrl });
const expectedTables = [
  "catalog_listings",
  "compute_configurations",
  "compute_instances",
  "compute_regions",
  "compute_resource_types",
  "customer_profiles",
  "organizations",
  "organization_memberships",
  "pricing_versions",
  "signup_rate_limits",
];
const tables = await pool.query(
  `SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
);
const tableNames = new Set(tables.rows.map((row) => row.table_name));
for (const tableName of expectedTables) {
  assert.ok(tableNames.has(tableName), `Missing public.${tableName}`);
}
console.log("Schema validation: all ten application tables exist.");

const authUserId = await pool.query(
  `SELECT data_type
   FROM information_schema.columns
   WHERE table_schema = 'neon_auth' AND table_name = 'user' AND column_name = 'id'`,
);
assert.equal(authUserId.rows[0]?.data_type, "uuid");
console.log("Auth integration: Neon Auth user ID remains UUID; auth schema was not migrated.");

const constraints = await pool.query(
  `SELECT count(*)::int AS count
   FROM information_schema.table_constraints
   WHERE table_schema = 'public'
     AND constraint_type = 'FOREIGN KEY'
     AND table_name IN (
       'compute_configurations',
       'catalog_listings',
       'compute_instances',
       'organizations',
       'organization_memberships'
     )`,
);
assert.equal(constraints.rows[0]?.count, 9);
console.log("Integrity validation: all nine ownership/catalog foreign keys exist.");

const roleSchema = await pool.query(
  `SELECT count(*)::int AS count
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'customer_profiles'
     AND column_name = 'role'
     AND column_default = '''USER''::text'
     AND is_nullable = 'NO'`,
);
assert.equal(roleSchema.rows[0]?.count, 1);
const roleConstraint = await pool.query(
  `SELECT count(*)::int AS count
   FROM information_schema.check_constraints
   WHERE constraint_schema = 'public'
     AND constraint_name = 'customer_profiles_role_chk'
     AND check_clause LIKE '%CEO%ADMIN%MANAGER%VIP%USER%'`,
);
assert.equal(roleConstraint.rows[0]?.count, 1);
console.log("Authorization validation: customer profiles have a constrained role with USER default.");

const immutabilityTrigger = await pool.query(
  `SELECT count(DISTINCT trigger_name)::int AS count
   FROM information_schema.triggers
   WHERE event_object_schema = 'public'
     AND event_object_table = 'pricing_versions'
     AND trigger_name = 'pricing_versions_immutable_published'`,
);
assert.equal(immutabilityTrigger.rows[0]?.count, 1);
console.log("Pricing validation: published price versions have an immutability trigger.");

const pricingWindowConstraint = await pool.query(
  `SELECT count(*)::int AS count
   FROM pg_catalog.pg_constraint AS constraint_row
   JOIN pg_catalog.pg_class AS relation
     ON relation.oid = constraint_row.conrelid
   JOIN pg_catalog.pg_namespace AS namespace
     ON namespace.oid = relation.relnamespace
   WHERE namespace.nspname = 'public'
     AND relation.relname = 'pricing_versions'
     AND constraint_row.conname = 'pricing_versions_published_window_excl'
     AND constraint_row.contype = 'x'`,
);
assert.equal(pricingWindowConstraint.rows[0]?.count, 1);
console.log("Pricing validation: published effective windows cannot overlap for the same price key.");

const migrationLog = await pool.query(
  `SELECT count(*)::int AS count
   FROM information_schema.tables
   WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'`,
);
assert.equal(migrationLog.rows[0]?.count, 1);
console.log("Migration validation: Drizzle migration journal exists.");

await pool.end();
