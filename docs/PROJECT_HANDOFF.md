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

### P1 — Public health endpoint reveals component-level health

`app/api/health/route.ts` returns separate Postgres and Function statuses without authentication. Keep a minimal public health response if needed; put detailed dependency diagnostics behind internal monitoring/authentication. Ensure missing configuration produces a safe structured response rather than an uncaught exception. Do not leak dependency URLs, credentials, or raw errors.

### P1 — Published pricing windows can overlap

`pricing_versions` enforces version uniqueness but does not prevent overlapping effective periods for the same pricing key. `app/api/pricing/route.ts` returns every current match, so the result can be ambiguous.

**Required:** define the complete price key and deterministic selection policy. Prevent overlapping published ranges at the database level where practical (for example, a PostgreSQL exclusion constraint over a normalized key and time range), with a forward-only migration. Preserve published-price immutability and existing rows. Add tests for adjacent, overlapping, open-ended, and future windows.

### P1 — Registration abuse controls are not established by source review

Signup delegates to Neon Auth; the application source does not establish an app-level rate limit. `README.md` notes shared SMTP is rate-limited and delivery has not been verified end to end. Inspect the current Neon Auth project's signup/email limits and trusted-domain configuration without exposing secrets. Add appropriate rate limiting/abuse controls at the supported provider or deployment boundary. Verify with a dedicated test account and non-production setup; do not create users on a production branch as a test.

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
- **P1 health, pricing, and registration-abuse controls remain open.** Runpod adapter and GPU provisioning remain unimplemented and unverified.

## Dashboard update — 2026-10-15

- Reworked the protected Overview composition to use the console width instead of centering all content inside a narrow `max-w-7xl` column.
- Overview now shows a short account-scoped instance summary and the latest five real instance records. Provider inventory, compute lifecycle operations, and billing are labeled unavailable/not connected; no GPU, region, usage, or price values are fabricated.
- Database query failures remain a visible unavailable state and emit a concise server warning with the error class; the original `{}`-style development console error is removed.
- Fixed Base UI `Button` link rendering warnings in the console mobile navigation, instance empty state, and quote link by marking those anchor render targets as non-native buttons.
- TypeScript typecheck passed; infrastructure tests **18/18 passed**. No browser visual inspection or production build was run. The database failure shown in the supplied screenshot was not independently diagnosed, so Overview data can still be unavailable until the runtime DB issue is resolved.
