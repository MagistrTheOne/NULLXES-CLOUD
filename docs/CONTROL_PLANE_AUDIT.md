# NULLXES CLOUD — Control Plane audit

**Audit date:** 2026-10-15  
**Scope:** local source tree on `feat/control-plane-foundation`; static inspection only. No app launch, Neon query, provider call, paid resource, or production operation was performed.

## Status model

`Implemented` means source code exists. `Configured` means the required environment/provider/database setup is present. `Verified` means the behavior was exercised against the named environment and evidence was recorded. These are separate states; source presence alone does not establish configuration or runtime behavior.

| Module | Source of truth | Owner | Implemented | Configured | Verified | Evidence / gap |
|---|---|---|---|---|---|---|
| Identity | Neon Managed Auth | NULLXES / Neon | Yes | Unknown | No | `lib/auth/server.ts`, `lib/auth/session.ts`; local source has session lookup, but browser flow and provider settings were not checked. |
| Organizations / RBAC | Neon PostgreSQL | NULLXES | Partial | Migration pending | Source checks only | Organization and membership schema, personal-org backfill, role policy, and server membership lookup are in the current isolated change. No invite/member-management API or runtime Neon verification exists. |
| Tenant isolation | Control Plane API / PostgreSQL | NULLXES | Partial | Migration pending | Source checks only | Dashboard and `GET /api/instances` scope reads to the authenticated user's personal organization; the API can select another organization only after membership authorization. No cross-tenant database integration test has run. |
| Lifecycle | Drizzle / PostgreSQL | NULLXES | Yes in source | Migration pending | No | Canonical source vocabulary and forward migration `0001`; actual Neon schema and row mapping remain unchecked. |
| Pricing | PostgreSQL / pricing API | NULLXES | Yes in source | Migration pending | No | Published interval exclusion migration `0002`; Neon extension privileges, existing data, and DB integration cases remain unchecked. |
| Public health | Next.js liveness route | NULLXES | Yes | N/A | Source only | `/api/health` returns minimal liveness; no public dependency detail. |
| Signup abuse controls | Auth route / PostgreSQL | NULLXES / Neon | Yes in source | Partial / unknown | No | Email limiter implemented; IP limiter requires verified trusted proxy. Migration `0003` and live Neon Auth limits/trusted domains remain unchecked. |
| Audit log | PostgreSQL | NULLXES | No | No | No | No append-only security event table or audited critical action path found. |
| API keys | Auth / Control Plane | NULLXES | No | No | No | No tenant API-key issuance, hashing, scopes, rotation, or revocation path found. |
| Encryption / KMS | KMS / provider | NULLXES / provider | No | No | No | No customer key management, envelope encryption, data-at-rest policy, or attestation-gated key release found. |
| GPU inventory | Runpod API | Runpod / NULLXES | No | No | No | No provider adapter or live inventory endpoint. |
| Provisioning | Provider + PostgreSQL | NULLXES / provider | No | No | No | No durable operation workflow or provider lifecycle API. |
| Usage / billing | Metering + ledger | NULLXES | No | No | No | No usage ingestion, immutable charge ledger, or customer balance system. |
| Compliance | Verifiable documents and operating evidence | Shared | No | No | No | Provider and facility claims require scope, region, contract, and current document review; no NULLXES control evidence package exists. |

## Gate A — existing foundation

The lifecycle, pricing, public health, and signup abuse changes are present in source. Migrations `0001` through `0004` have not been applied to Neon according to the current handoff. Therefore Gate A is **implemented in code but not configured or verified end to end**. Do not proceed to provider provisioning on the strength of source checks alone.

## Gate B/C — organization boundary and authorization

Current instance reads are scoped to a Neon Auth user through `customer_profiles`; that is per-user isolation, not multi-tenant organization isolation. The global `customer_profiles.role` is a display/account attribute for now and is not used to authorize resource access. It must not become a CEO bypass. Organization membership must be checked server-side for every tenant-scoped read or mutation, and missing membership must deny access.

The current isolated change is an additive organization/membership schema with a data-preserving personal-organization backfill, followed by organization-scoped instance reads and negative authorization tests. No organization-invite or role-management UI is in scope for this first change.

## Gate D — audit foundation

No audit log exists in the inspected source. After membership enforcement, add append-only events for authentication-sensitive and resource/security mutations. Each event should use server-derived actor and tenant IDs, a stable action and target, timestamp, outcome, and redacted metadata; credentials, session values, and customer payloads must not be stored. Protect read access and document retention. Database append-only controls are not by themselves proof against a privileged database operator; describe the threat boundary honestly.

## Evidence required before calling Sprint 01 complete

- Apply reviewed migrations only to an explicitly selected non-production Neon branch, then compare deployed schema to Drizzle.
- Exercise authentication and organization membership in a non-production environment.
- Prove same-tenant access succeeds and cross-tenant read/mutation attempts are denied.
- Exercise deny-by-default and role boundaries, including the absence of a universal CEO bypass.
- Verify audit events on allowed and denied critical operations, including redaction and retention behavior.
- Capture typecheck, lint if configured, tests, and production build results. Do not run a production build while the local dev server shares `.next`.
- Keep Runpod discovery and paid resource operations out of this sprint.

## Isolated change in progress

- Working branch: `feat/control-plane-foundation`, based on the local reviewed source tree. The connected GitHub `main` does not contain local commits `bb0e94e` or `09a4a1e`; a local Git HTTPS push previously failed because credentials were unavailable. Do not publish this branch until the repository heads are reconciled.
- Migration `0005_add_organizations_and_memberships.sql` creates one personal organization and owner membership per existing profile, adds `organization_id` to instances, backfills from the existing `profile_id`, then makes the field required. No existing instance or profile is deleted or rewritten beyond adding its tenant association.
- Instance list and Overview reads use the personal organization. The instance API accepts `organization_id` only after server-side membership and permission checks; unauthorized and unknown IDs share a 404 response.
- Organization membership roles are `owner`, `admin`, `operator`, `member`, and `billing_viewer`. The policy denies unknown roles, denies `CEO`/`VIP` as organization roles, and does not provide a CEO bypass.
- Source checks: TypeScript passed; infrastructure/policy tests **24/24 passed**; Drizzle migration journal check passed; `git diff --check` passed. No Neon migration, DB integration, app launch, browser test, or build was run. The migration remains unapplied; membership behavior is not runtime-verified.
