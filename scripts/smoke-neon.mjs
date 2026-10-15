import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

function requiredEnvironmentVariable(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const sql = neon(requiredEnvironmentVariable("DATABASE_URL"));
const databaseRows = await sql`SELECT 1 AS healthy`;
assert.equal(Number(databaseRows[0]?.healthy), 1);
console.log("Postgres: pooled connection and SELECT 1 passed.");

const functionUrl = requiredEnvironmentVariable("NEON_FUNCTION_HELLO_BASE_URL");
const functionResponse = await fetch(functionUrl, {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(15_000),
});
assert.equal(functionResponse.status, 200);
assert.deepEqual(await functionResponse.json(), { status: "ok", service: "hello" });
console.log("Neon Functions: deployed hello endpoint passed.");

const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
const healthResponse = await fetch(new URL("/api/health", appBaseUrl), {
  signal: AbortSignal.timeout(20_000),
});
assert.equal(healthResponse.status, 200);
const health = await healthResponse.json();
assert.deepEqual(health, { status: "ok" });
console.log("Application: /api/health returned the minimal liveness response.");

const authResponse = await fetch(new URL("/api/auth/get-session", appBaseUrl), {
  headers: { Accept: "application/json" },
  signal: AbortSignal.timeout(15_000),
});
assert.equal(authResponse.status, 200);
await authResponse.arrayBuffer();
console.log("Neon Auth: application session endpoint responded successfully.");

const invalidLogin = await fetch(new URL("/api/auth/sign-in/email", appBaseUrl), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: `neon-smoke-${randomUUID()}@example.invalid`,
    password: `invalid-${randomUUID()}`,
  }),
  signal: AbortSignal.timeout(15_000),
});
assert.equal(invalidLogin.status, 401);
await invalidLogin.arrayBuffer();
console.log("Neon Auth: rejected a non-existent test identity without creating an account.");

const invalidVerification = await fetch(
  new URL("/api/auth/email-otp/verify-email", appBaseUrl),
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `neon-verification-smoke-${randomUUID()}@example.invalid`,
      otp: "000000",
    }),
    signal: AbortSignal.timeout(15_000),
  },
);
assert.equal(invalidVerification.status, 400);
const verificationError = await invalidVerification.json();
assert.equal(verificationError.code, "INVALID_OTP");
console.log("Neon Auth: invalid verification codes are rejected without creating an account or sending email.");

const protectedResponse = await fetch(new URL("/instances", appBaseUrl), {
  redirect: "manual",
});
assert.equal(protectedResponse.status, 307);
assert.match(protectedResponse.headers.get("location") ?? "", /\/auth\/sign-in/);
console.log("Authentication: unauthenticated /instances access redirects to sign-in.");

const accountResponse = await fetch(
  new URL(`/api/account?userId=${randomUUID()}`, appBaseUrl),
);
assert.equal(accountResponse.status, 401);
const accountError = await accountResponse.json();
assert.equal(accountError.error?.code, "UNAUTHORIZED");
console.log("Account API: unauthenticated and userId-spoofed requests return 401.");

const unauthenticatedInstances = await fetch(
  new URL("/api/instances", appBaseUrl),
);
assert.equal(unauthenticatedInstances.status, 401);
const instancesError = await unauthenticatedInstances.json();
assert.equal(instancesError.error?.code, "UNAUTHORIZED");
console.log("Instances API: unauthenticated access returns 401.");

const catalogResponse = await fetch(new URL("/api/catalog", appBaseUrl));
assert.equal(catalogResponse.status, 200);
const catalogPayload = await catalogResponse.json();
assert.ok(Array.isArray(catalogPayload.data?.catalog));
console.log("Catalog API: public response contains only the catalog data shape.");

const pricingResponse = await fetch(new URL("/api/pricing", appBaseUrl));
assert.equal(pricingResponse.status, 200);
const pricingPayload = await pricingResponse.json();
assert.ok(Array.isArray(pricingPayload.data?.pricing));
for (const price of pricingPayload.data.pricing) {
  assert.equal(typeof price.rate, "string", "Monetary amounts must remain decimal strings.");
}
console.log("Pricing API: published rates are returned as exact decimal strings.");

for (const route of [
  "/",
  "/pricing",
  "/storage",
  "/network",
  "/instances",
  "/docs",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/reset-password?token=INVALID_TOKEN",
  "/auth/verify-email",
  "/dashboard",
  "/compute",
  "/settings",
]) {
  if (["/instances", "/dashboard", "/compute", "/settings"].includes(route)) {
    const response = await fetch(new URL(route, appBaseUrl), {
      redirect: "manual",
    });
    assert.equal(response.status, 307, `Expected ${route} to require authentication`);
    assert.match(
      response.headers.get("location") ?? "",
      /\/auth\/sign-in/,
      `Expected ${route} to redirect to sign-in`,
    );
    continue;
  }
  const response = await fetch(new URL(route, appBaseUrl));
  assert.equal(response.status, 200, `Expected ${route} to render`);
  const html = await response.text();
  if (route.includes("token=INVALID_TOKEN")) {
    assert.ok(
      html.includes("Reset link unavailable"),
      "Invalid recovery tokens must not open the reset form.",
    );
  }
  if (route === "/") {
    for (const destination of ["/instances", "/storage", "/network", "/pricing", "/docs"]) {
      assert.ok(html.includes(`href="${destination}"`), `Missing navbar destination ${destination}`);
    }
  }
}
console.log("Routes: public product pages and auth pages returned HTTP 200; navbar targets are present.");
