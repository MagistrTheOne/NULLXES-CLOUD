# NULLXES CLOUD — project handoff

**Snapshot date:** 2026-10-15  
**Product stage:** Infrastructure Foundation  
**Purpose:** Give coding agents a factual project baseline and safe implementation order. This is a static source review, not runtime or deployment verification.

## Product and intended architecture

NULLXES CLOUD is an existing Next.js customer platform and future compute control plane for AI, robotics, research, and general compute. Preserve the current premium NULLXES visual identity and evolve the existing application incrementally.

Intended separation:

- Next.js frontend and customer console.
- Server-side authenticated API and control plane for ownership, catalog, lifecycle, pricing, and reconciliation.
- Neon PostgreSQL with Drizzle and versioned migrations.
- Neon Auth for identity and sessions.
- Runpod as a candidate first GPU provider, subject to account/API/commercial verification.
- Cluster orchestration is a future stage; do not imply it exists.

The repository's current auth implementation uses Neon Managed Auth (`@neondatabase/auth`), not the Better Auth + Drizzle arrangement mentioned in parts of `claude.md`. `claude.md` is partly a target architecture: it explicitly says its module list is not a claim of implementation. Inspect actual code and installed versions before following target-stack suggestions.

## Source-reviewed baseline

The review inspected the working tree on 2026-10-15 without starting the app, running checks, querying Neon, or calling Runpod. Findings below describe source files only.

- Next.js App Router, React, TypeScript, Tailwind, and the existing site/console UI are present. See `package.json` and `README.md` for declared versions and scripts.
- Neon Auth server/client integration and protected console layout exist. Account and instance API routes derive identity from the current session; instance reads scope records to that user.
- Drizzle schema and one checked-in migration exist for customer profiles, catalog, pricing versions, and compute lifecycle records.
- Public catalog and pricing read APIs exist. They return published/effective rows from the application database.
- No Runpod adapter, provider credential use, provider inventory endpoint, resource provisioning/lifecycle API, usage ingestion, wallet, or billing ledger was found in the reviewed source. Existing instance records/UI are not proof of provider resources.
- At the time of the original source review, no local or live runtime checks had been performed. The user later supplied a `next dev` log showing Next.js 16.4.0 reached Ready and `GET /` returned 200. This verifies only local server startup and the homepage response; Auth/browser flows, deployed DB schema, migrations applied in Neon, production build, and provider connectivity remain unverified.
- `.env` is ignored by Git. Never print or copy its values into docs, logs, or replies.

## P0/P1 risks to close before provider provisioning

### P0 — Lifecycle model and database constraint disagree

`lib/infrastructure/contracts.ts` and `lib/infrastructure/reliability.ts` define states including `starting`, `restarting`, `terminating`, `terminated`, `unknown`, and `reconciliation_required`. `drizzle/schema.ts` and the initial SQL migration constrain `compute_instances.lifecycle_status` to a different set, including `deleting` and `deleted`. A database write for a domain-valid but DB-disallowed state will fail.

**Required:** choose one canonical lifecycle vocabulary; align domain types, transition rules, Drizzle schema, migration, API/UI mappings, and persistence tests. Do not edit an already-applied migration. Add a reviewed forward-only migration that safely updates the constraint and maps any existing values without losing records. Check actual applied schema on an explicitly selected non-production branch before production rollout.

### P1 — Public health endpoint revealed component-level health (closed in source)

The original `app/api/health/route.ts` returned separate Postgres and Function statuses without authentication. It now reports process liveness only (`{ status: "ok" }`) and does not touch dependency configuration. Operator-run `npm run test:neon` performs separate Postgres and Function checks. This endpoint change is covered by a local test; the external services were not queried during this fix.

### P1 — Published pricing windows can overlap

`pricing_versions` enforces version uniqueness but does not prevent overlapping effective periods for the same pricing key. `app/api/pricing/route.ts` returns every current match, so the result can be ambiguous.

**Implemented in source, migration not applied:** the current complete key is `product_category + billing_unit + currency`; the schema has no configuration/product ID to narrow pricing further. `/api/pricing` has stable ordering by key, effective start, and version. Migration `0002_prevent_overlapping_published_prices.sql` adds a partial GiST exclusion constraint over published half-open intervals (`[from, until)`), with unbounded `NULL` ends. It checks existing published data first and aborts before schema changes if it finds an overlap. It does not rewrite prices. The published-price immutability trigger remains in place. The Neon branch's extension privileges, existing data, and applied constraint are unverified; apply only to an explicitly selected non-production branch first.

### P1 — Registration abuse controls were not established by the original source review

At the snapshot, signup delegated to Neon Auth with no app-level rate limit. The application now applies a database-backed limit of 3 attempts per normalized email per hour to both the signup Server Action and direct Neon Auth signup handler. It also supports 12 attempts per client IP per hour only when `SIGNUP_TRUSTED_PROXY_HEADER=true` and the ingress overwrites `x-nullxes-client-ip`. Migration `0003_signup_abuse_rate_limits.sql` is forward-only and has not been applied. Until that migration and a trusted proxy are configured, IP-based limiting is not active. Live Neon Auth signup/email limits and trusted domains remain unverified. Verify only with a dedicated test account and non-production setup; do not create users on a production branch as a test.

## Runpod integration sequence

Do not start this until the four risks above have concrete code/migration changes and appropriate checks.

1. Verify the official current API contract, actual account credentials/permissions, product discovery/inventory behavior, regions, rate limits, and error semantics. Verify commercial authorization for the intended resale/brokerage model. Record what was and was not verified.
2. Implement server-only connectivity and read-only discovery first. Return normalized real provider observations; label observation timestamps and distinguish unavailable, unknown, and available. Availability is not a reservation or a guarantee that creation will succeed.
3. Keep credentials server-side. Add bounded timeouts, safe error mapping, rate-limit handling, and no secret/raw response logging. A successful ping proves connectivity only.
4. Only later implement create/stop/restart/terminate after each capability is verified. Persist intent before mutation, use idempotency where actually guaranteed, reconcile uncertain outcomes before retry, scope every operation to authenticated ownership, and sync provider state into Neon using compare-and-set transitions.
5. Do not charge customers or claim accurate usage billing until metering semantics, price snapshots, exact arithmetic, limits, reconciliation, and commercial approval are in place.

## Definition of readiness

Report each item separately as **implemented**, **configured**, and **verified**. A code adapter does not mean a provider is connected.

- Auth/session and customer ownership boundaries verified.
- Neon schema matches Drizzle and reviewed migrations; lifecycle states are consistent.
- Catalog/pricing APIs expose only intended public records and pricing is unambiguous.
- Public health output is appropriately minimal; internal diagnostics are protected.
- Runpod server connectivity and live inventory have actual observed responses, if configured.
- Every unimplemented operation is explicitly unavailable in UI/API.
- Typecheck, lint (if configured), build, and critical tests pass with captured results. Use a non-production DB/provider setup for integration checks; do not create paid resources as an unapproved test side effect.
- Provisioning readiness is claimed only after a real, authorized end-to-end create and lifecycle verification with explicit spending controls. Ping or inventory alone is not provisioning readiness.

## Working rules for the next agent

- First inspect the relevant files and `git status`; preserve unrelated working-tree changes.
- Implement the P0/P1 fixes as small reviewable steps. Never run destructive DB operations or edit already-applied migration history.
- Keep project identity, current routes, and existing design; avoid unrelated rewrites and unnecessary dependency changes.
- Do not assume Runpod, Neon, deployment, or commercial authorization is configured merely because names appear in docs or `.env`.
- Do not launch the app or make external calls unless the user explicitly requests runtime/provider verification. If that verification is requested, use the safest non-production target available and report blockers honestly.
- In the final report, list changed files, migration impact, exact checks actually executed, unverified runtime/configuration, and remaining blockers.

## Implementation progress — 2026-10-15

- **P0 lifecycle consistency:** implemented in source. `LifecycleStatus` is the shared TypeScript union used by the Drizzle column type, and the Drizzle check now matches that vocabulary.
- Added `drizzle/migrations/0001_align_compute_instance_lifecycle.sql`; it preserves all rows, maps legacy `deleting` to `terminating` and `deleted` to `terminated`, then installs the canonical check. The original migration was not edited. This migration has **not** been applied to Neon; the actual applied schema and legacy row distribution remain unverified.
- Added a source contract test that checks lifecycle state agreement and migration ordering/non-destructive intent.
- Verified locally: infrastructure tests **18/18 passed**; TypeScript typecheck passed; `drizzle-kit check` passed.
- Build was not run because the user-provided log indicates the development server may be active and Next dev/build both use `.next`. No DB connection, migration application, Auth flow, or provider request was run.
- The user's log also showed Turbopack waiting for frequent filesystem changes in `node_modules`; homepage still returned 200. The log does not establish the cause of those file updates, so treat the warning as observed but undiagnosed.
- **P1 health endpoint is closed in source.** Pricing and signup controls are implemented in source but their migrations are unapplied and runtime integration is unverified. Runpod adapter and GPU provisioning remain unimplemented and unverified.

## Dashboard update — 2026-10-15

- Reworked the protected Overview composition to use the console width instead of centering all content inside a narrow `max-w-7xl` column.
- Overview now shows a short account-scoped instance summary and the latest five real instance records. Provider inventory, compute lifecycle operations, and billing are labeled unavailable/not connected; no GPU, region, usage, or price values are fabricated.
- Database query failures remain a visible unavailable state and emit a concise server warning with the error class; the original `{}`-style development console error is removed.
- Fixed Base UI `Button` link rendering warnings in the console mobile navigation, instance empty state, and quote link by marking those anchor render targets as non-native buttons.
- TypeScript typecheck passed; infrastructure tests **18/18 passed**. No browser visual inspection or production build was run. The database failure shown in the supplied screenshot was not independently diagnosed, so Overview data can still be unavailable until the runtime DB issue is resolved.

## P1 health endpoint — 2026-10-15

- Public `/api/health` now returns process liveness only with `Cache-Control: no-store` and no dependency details. Missing DB/function configuration no longer causes this route to throw because it no longer reads those variables.
- The Neon smoke script continues to check PostgreSQL and Neon Function directly, then separately asserts the minimal app liveness response.
- Infrastructure tests **19/19 passed**, typecheck passed, and `drizzle-kit check` passed. No live Neon/Function calls or production build were run. (Counts reflect the health-fix commit; see the pricing progress below for current checks.)

## P1 pricing integrity — 2026-10-15

- Pricing key is the existing `(product_category, billing_unit, currency)` tuple; current schema has no per-configuration price key. The API uses stable key/start/version ordering.
- Added forward-only migration `0002_prevent_overlapping_published_prices.sql`. It preflights all published windows and aborts before schema changes on existing conflicts, then installs a partial GiST exclusion constraint. Intervals are `[from, until)`, so adjacent windows work and `NULL` means open-ended. Published prices are not rewritten; the existing immutability trigger remains.
- Added DB integration cases for adjacent and overlapping windows and schema validation for the new constraint. These require a non-production Neon branch and were not run. Migration is not applied; current branch data and `btree_gist` privileges remain unverified.
- Local checks: infrastructure tests **20/20 passed**, TypeScript typecheck passed, and `drizzle-kit check` passed. Build and live DB checks were not run.
- P1 registration abuse source control is implemented; configuration and runtime checks remain open. Runpod adapter and GPU provisioning remain unimplemented and unverified.

## P1 registration abuse controls — 2026-10-15

- Added a durable database-backed signup counter. It uses HMAC-SHA256 identifiers derived from the existing auth cookie secret, stores no raw email/IP, enforces 3 attempts per normalized email per hour, and prunes up to 100 expired rows per signup attempt.
- Both the custom signup Server Action and direct Neon Auth `POST /api/auth/sign-up/email` route consume the limit. A database failure fails closed with a safe response.
- Optional IP limit is 12 attempts per hour, enabled only with `SIGNUP_TRUSTED_PROXY_HEADER=true`; the ingress must overwrite `x-nullxes-client-ip`. No deployment ingress was identified or configured, so IP limiting is not yet active.
- Forward-only migration `0003_signup_abuse_rate_limits.sql` adds the counter table and index. It has not been applied. Live Neon Auth provider limits and trusted-domain configuration were not inspected; shared SMTP's existing rate limit is not a substitute for signup abuse protection.
- Local checks: infrastructure tests **21/21 passed**, TypeScript typecheck passed, and `drizzle-kit check` passed. No build, DB integration, or external Auth/Neon request was run; no account was created.

## Console layout refinement — 2026-10-15

- The shadcn sidebar now spans the viewport height, stays in place while the main pane scrolls, and pins account controls/branding to the bottom. Its desktop width is 15rem to align the content edge with the supplied reference.
- Overview now uses the installed shadcn `Card`, `Button`, `Badge`, `Alert`, `Empty`, and `Avatar` components. The existing server room image is used as a decorative hero backdrop; no provider inventory, spend, credit, billing, or usage values were added.
- Desktop and mobile navigation share one route-aware shadcn navigation component, so the active page and button variants stay synchronized. Search and notifications were not added because no real actions/data for them are implemented.
- TypeScript typecheck passed. No tests, app launch, browser screenshot, or production build were run.

## Application roles and development notices — 2026-10-15

- Added `customer_profiles.role` with the constrained roles `CEO`, `ADMIN`, `MANAGER`, `VIP`, and `USER`. Existing rows receive `USER`; signup/profile creation cannot set a role. `GET /api/account` returns the server-stored role.
- Added server-only role lookup and helpers. Internal notices are allowed only for CEO, Admin, and Manager; missing profiles resolve to `USER`. Elevated roles require a trusted operator to update the application database directly after migration.
- Disabled the Next.js development indicator. It is framework-owned UI and cannot be gated by application roles. The app has no separate developer-notice feature to role-gate yet.
- Added forward-only migration `0004_add_customer_roles.sql`; it preserves profile IDs and assigns existing profiles the least privileged role. Migration is not applied to Neon and elevated users have not been assigned.
