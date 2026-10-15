import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "@neondatabase/serverless";

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
  throw new Error("Integration fixtures require a direct connection to a non-production Neon branch.");
}

const appBaseUrl = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const pool = new Pool({ connectionString: testUrl });
const client = await pool.connect();
const fixtureId = randomUUID();
const resourceTypeId = randomUUID();
const hiddenResourceTypeId = randomUUID();
const publishedConfigurationId = randomUUID();
const hiddenConfigurationId = randomUUID();
const hiddenTypeConfigurationId = randomUUID();
const hiddenListingConfigurationId = randomUUID();
const publishedRegionId = randomUUID();
const hiddenRegionId = randomUUID();
const listingIds = [
  randomUUID(),
  randomUUID(),
  randomUUID(),
  randomUUID(),
  randomUUID(),
];
const pricingIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const billingUnit = `test-${fixtureId.slice(0, 12)}`;
let fixturesCommitted = false;

try {
  await client.query("BEGIN");
  await client.query(
    `INSERT INTO public.compute_resource_types
       (id, slug, category, display_name, published)
     VALUES ($1, $2, 'gpu', 'Integration fixture', true),
            ($3, $4, 'cpu', 'Hidden integration fixture', false)`,
    [
      resourceTypeId,
      `test-${fixtureId}`,
      hiddenResourceTypeId,
      `hidden-${fixtureId}`,
    ],
  );
  await client.query(
    `INSERT INTO public.compute_configurations
       (id, resource_type_id, slug, display_name, published)
     VALUES ($1, $2, $3, 'Published fixture', true),
            ($4, $2, $5, 'Hidden configuration fixture', false),
            ($6, $7, $8, 'Hidden type fixture', true),
            ($9, $2, $10, 'Hidden listing fixture', true)`,
    [
      publishedConfigurationId,
      resourceTypeId,
      `published-${fixtureId}`,
      hiddenConfigurationId,
      `hidden-config-${fixtureId}`,
      hiddenTypeConfigurationId,
      hiddenResourceTypeId,
      `hidden-type-${fixtureId}`,
      hiddenListingConfigurationId,
      `hidden-listing-${fixtureId}`,
    ],
  );
  await client.query(
    `INSERT INTO public.compute_regions (id, code, display_name, published)
     VALUES ($1, $2, 'Published region fixture', true),
            ($3, $4, 'Hidden region fixture', false)`,
    [
      publishedRegionId,
      `test-${fixtureId}`,
      hiddenRegionId,
      `hidden-${fixtureId}`,
    ],
  );
  await client.query(
    `INSERT INTO public.catalog_listings (id, configuration_id, region_id, published)
     VALUES ($1, $2, $3, true),
            ($4, $5, $3, true),
            ($6, $7, $3, true),
            ($8, $9, $3, false),
            ($10, $2, $11, true)`,
    [
      ...listingIds.slice(0, 1),
      publishedConfigurationId,
      publishedRegionId,
      listingIds[1],
      hiddenConfigurationId,
      listingIds[2],
      hiddenTypeConfigurationId,
      listingIds[3],
      hiddenListingConfigurationId,
      listingIds[4],
      hiddenRegionId,
    ],
  );

  const priceRows = [
    [
      pricingIds[0],
      "published",
      new Date("2020-01-01T00:00:00Z"),
      new Date("2099-01-01T00:00:00Z"),
    ],
    [pricingIds[1], "published", new Date("2099-01-01T00:00:00Z"), null],
    [pricingIds[2], "published", new Date("2020-01-01T00:00:00Z"), new Date("2021-01-01T00:00:00Z")],
    [pricingIds[3], "draft", new Date("2020-01-01T00:00:00Z"), null],
  ];
  for (const [index, [id, status, effectiveFrom, effectiveUntil]] of priceRows.entries()) {
    await client.query(
      `INSERT INTO public.pricing_versions
         (id, product_category, billing_unit, currency, rate, effective_from,
          effective_until, version, publication_status)
       VALUES ($1, 'compute', $2, 'ZZZ', '999.12345678', $3, $4, $5, $6)`,
      [
        id,
        index === 2 ? `${billingUnit}-expired` : billingUnit,
        effectiveFrom,
        effectiveUntil,
        index + 1,
        status,
      ],
    );
  }
  await client.query("COMMIT");
  fixturesCommitted = true;

  const catalogResponse = await fetch(new URL("/api/catalog", appBaseUrl));
  assert.equal(catalogResponse.status, 200);
  const catalog = (await catalogResponse.json()).data?.catalog;
  assert.ok(Array.isArray(catalog));
  assert.deepEqual(
    catalog.filter((entry) => listingIds.includes(entry.id)).map((entry) => entry.id),
    [listingIds[0]],
    "Only listings whose listing, configuration, resource type, and region are all published should be visible.",
  );
  console.log("Catalog integration: unpublished listing/configuration/type/region entries are hidden.");

  const pricingResponse = await fetch(new URL("/api/pricing", appBaseUrl));
  assert.equal(pricingResponse.status, 200);
  const pricing = (await pricingResponse.json()).data?.pricing;
  assert.ok(Array.isArray(pricing));
  const testPrices = pricing.filter((price) => pricingIds.includes(price.id));
  assert.deepEqual(testPrices.map((price) => price.id), [pricingIds[0]]);
  assert.equal(testPrices[0].rate, "999.12345678");
  console.log("Pricing integration: drafts and out-of-window versions are hidden; exact decimals are preserved.");

  await client.query("BEGIN");
  await client.query("SAVEPOINT published_price_immutability");
  let mutationError;
  try {
    await client.query(
      "UPDATE public.pricing_versions SET rate = '1.00000000' WHERE id = $1",
      [pricingIds[0]],
    );
  } catch (error) {
    mutationError = error;
  }
  await client.query("ROLLBACK TO SAVEPOINT published_price_immutability");
  await client.query("RELEASE SAVEPOINT published_price_immutability");
  await client.query("COMMIT");
  assert.equal(mutationError?.code, "55000");
  console.log("Pricing integrity: database rejects mutation of a published version.");

  await client.query("BEGIN");
  await client.query("SAVEPOINT overlapping_price_window");
  let overlapError;
  try {
    await client.query(
      `INSERT INTO public.pricing_versions
         (id, product_category, billing_unit, currency, rate, effective_from,
          effective_until, version, publication_status)
       VALUES ($1, 'compute', $2, 'ZZZ', '1.00000000', '2098-01-01T00:00:00Z',
          '2100-01-01T00:00:00Z', 100, 'published')`,
      [randomUUID(), billingUnit],
    );
  } catch (error) {
    overlapError = error;
  }
  await client.query("ROLLBACK TO SAVEPOINT overlapping_price_window");
  await client.query("RELEASE SAVEPOINT overlapping_price_window");
  await client.query("COMMIT");
  assert.equal(overlapError?.code, "23P01");
  console.log("Pricing integrity: overlapping published windows are rejected; adjacent windows are accepted.");

  const spoofedAccountResponse = await fetch(
    new URL(`/api/account?userId=${randomUUID()}`, appBaseUrl),
  );
  assert.equal(spoofedAccountResponse.status, 401);
  console.log("Account security: caller-supplied user IDs do not bypass session authentication.");
} finally {
  try {
    if (fixturesCommitted) {
      await client.query("BEGIN");
      await client.query(
        "ALTER TABLE public.pricing_versions DISABLE TRIGGER pricing_versions_immutable_published",
      );
      await client.query("DELETE FROM public.pricing_versions WHERE id = ANY($1::uuid[])", [
        pricingIds,
      ]);
      await client.query("DELETE FROM public.catalog_listings WHERE id = ANY($1::uuid[])", [
        listingIds,
      ]);
      await client.query(
        "DELETE FROM public.compute_configurations WHERE id = ANY($1::uuid[])",
        [
          [
            publishedConfigurationId,
            hiddenConfigurationId,
            hiddenTypeConfigurationId,
            hiddenListingConfigurationId,
          ],
        ],
      );
      await client.query("DELETE FROM public.compute_regions WHERE id = ANY($1::uuid[])", [
        [publishedRegionId, hiddenRegionId],
      ]);
      await client.query(
        "DELETE FROM public.compute_resource_types WHERE id = ANY($1::uuid[])",
        [[resourceTypeId, hiddenResourceTypeId]],
      );
      await client.query(
        "ALTER TABLE public.pricing_versions ENABLE TRIGGER pricing_versions_immutable_published",
      );
      await client.query("COMMIT");
      console.log("Integration fixtures: removed from the temporary branch.");
    } else {
      await client.query("ROLLBACK");
    }
  } finally {
    client.release();
    await pool.end();
  }
}
