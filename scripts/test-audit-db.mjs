import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";

const testUrl = process.env.DB_TEST_URL;
if (!testUrl) {
  throw new Error("Set DB_TEST_URL to a temporary Neon branch before running this test.");
}

const testHost = new URL(testUrl).hostname;
const productionHost = process.env.DATABASE_URL_UNPOOLED
  ? new URL(process.env.DATABASE_URL_UNPOOLED).hostname
  : null;
if (
  testHost.includes("-pooler") ||
  (productionHost !== null && testHost === productionHost)
) {
  throw new Error("Audit integration fixtures require a direct, non-production Neon branch.");
}

const pool = new Pool({ connectionString: testUrl });
const client = await pool.connect();
const db = drizzle(pool);
const profileA = randomUUID();
const profileB = randomUUID();
const organizationA = randomUUID();
const organizationB = randomUUID();
const eventA = randomUUID();
const eventB = randomUUID();

async function expectBlocked(label, query) {
  await client.query("SAVEPOINT audit_mutation_check");
  let error;
  try {
    await query();
  } catch (caught) {
    error = caught;
  }
  await client.query("ROLLBACK TO SAVEPOINT audit_mutation_check");
  await client.query("RELEASE SAVEPOINT audit_mutation_check");
  assert.equal(error?.code, "55000", `${label} must be rejected by the append-only trigger.`);
}

try {
  const rollbackProfile = randomUUID();
  const rollbackAuthUser = randomUUID();
  const rollbackRequest = randomUUID();
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO public.customer_profiles (id, auth_user_id, role)
        VALUES (${rollbackProfile}, ${rollbackAuthUser}, 'USER')
      `);
      await tx.execute(sql`
        INSERT INTO public.organizations (name, personal_owner_profile_id)
        VALUES ('Audit transaction rollback probe', ${rollbackProfile})
      `);
      await tx.execute(sql`
        INSERT INTO public.audit_logs
          (organization_id, actor_profile_id, actor_role, action, outcome,
           resource_type, resource_id, request_id, metadata)
        SELECT id, ${rollbackProfile}, 'owner', 'test.transaction.created', 'success',
               'organization', id::text, ${rollbackRequest}, '{}'::jsonb
        FROM public.organizations
        WHERE personal_owner_profile_id = ${rollbackProfile}
      `);
      throw new Error("AUDIT_TEST_ROLLBACK");
    }),
    /AUDIT_TEST_ROLLBACK/,
  );
  const rollbackRows = await client.query(
    `SELECT
       (SELECT count(*)::int FROM public.customer_profiles WHERE id = $1) AS profiles,
       (SELECT count(*)::int FROM public.organizations WHERE personal_owner_profile_id = $1) AS organizations,
       (SELECT count(*)::int FROM public.audit_logs WHERE request_id = $2) AS events`,
    [rollbackProfile, rollbackRequest],
  );
  assert.deepEqual(rollbackRows.rows[0], { profiles: 0, organizations: 0, events: 0 });
  console.log("Audit integrity: profile, workspace, and event writes roll back atomically.");

  await client.query("BEGIN");
  await client.query(
    `INSERT INTO public.customer_profiles (id, auth_user_id, role)
     VALUES ($1, $2, 'USER'), ($3, $4, 'USER')`,
    [profileA, randomUUID(), profileB, randomUUID()],
  );
  await client.query(
    `INSERT INTO public.organizations (id, name, personal_owner_profile_id)
     VALUES ($1, 'Audit test A', $2), ($3, 'Audit test B', $4)`,
    [organizationA, profileA, organizationB, profileB],
  );
  await client.query(
    `INSERT INTO public.organization_memberships (organization_id, profile_id, role)
     VALUES ($1, $2, 'owner'), ($3, $4, 'owner')`,
    [organizationA, profileA, organizationB, profileB],
  );
  await client.query(
    `INSERT INTO public.audit_logs
       (id, organization_id, actor_profile_id, actor_role, action, outcome,
        resource_type, resource_id, request_id, metadata)
     VALUES
       ($1, $2, $3, 'owner', 'test.audit_event.created', 'success', 'test', $4, $5, '{}'::jsonb),
       ($6, $7, $8, 'owner', 'test.audit_event.created', 'success', 'test', $9, $10, '{}'::jsonb)`,
    [eventA, organizationA, profileA, eventA, randomUUID(), eventB, organizationB, profileB, eventB, randomUUID()],
  );

  const organizationAEvents = await client.query(
    `SELECT id
     FROM public.audit_logs
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [organizationA],
  );
  assert.deepEqual(organizationAEvents.rows.map((row) => row.id), [eventA]);
  console.log("Audit integration: events are queryable by organization scope.");

  await expectBlocked("UPDATE", () =>
    client.query("UPDATE public.audit_logs SET outcome = 'failure' WHERE id = $1", [eventA]),
  );
  await expectBlocked("DELETE", () =>
    client.query("DELETE FROM public.audit_logs WHERE id = $1", [eventA]),
  );
  await expectBlocked("TRUNCATE", () =>
    client.query("TRUNCATE public.audit_logs"),
  );
  console.log("Audit integrity: UPDATE, DELETE, and TRUNCATE are rejected.");
} finally {
  await client.query("ROLLBACK");
  client.release();
  await pool.end();
}
