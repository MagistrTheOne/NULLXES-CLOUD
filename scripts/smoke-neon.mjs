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

const appBaseUrl = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const healthResponse = await fetch(new URL("/api/health", appBaseUrl), {
  signal: AbortSignal.timeout(20_000),
});
assert.equal(healthResponse.status, 200);
const health = await healthResponse.json();
assert.deepEqual(health, {
  status: "ok",
  services: { postgres: "ok", functions: "ok" },
});
console.log("Application: /api/health passed all connected service checks.");

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

const protectedResponse = await fetch(new URL("/instances", appBaseUrl), {
  redirect: "manual",
});
assert.equal(protectedResponse.status, 307);
assert.match(protectedResponse.headers.get("location") ?? "", /\/auth\/sign-in/);
console.log("Authentication: unauthenticated /instances access redirects to sign-in.");

for (const route of [
  "/",
  "/pricing",
  "/storage",
  "/network",
  "/instances",
  "/docs",
  "/auth/sign-in",
  "/auth/sign-up",
]) {
  if (route === "/instances") continue;
  const response = await fetch(new URL(route, appBaseUrl));
  assert.equal(response.status, 200, `Expected ${route} to render`);
  const html = await response.text();
  if (route === "/") {
    for (const destination of ["/instances", "/storage", "/network", "/pricing", "/docs"]) {
      assert.ok(html.includes(`href="${destination}"`), `Missing navbar destination ${destination}`);
    }
  }
}
console.log("Routes: public product pages and auth pages returned HTTP 200; navbar targets are present.");
