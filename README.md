# NULLXES Cloud

A dark-mode Next.js frontend for a GPU / CPU cloud platform focused on AI, robotics, and high-performance compute workloads.

## Current implementation

The project currently includes:
- Next.js App Router frontend
- React 19 + TypeScript
- Tailwind CSS v4 styling
- shadcn/ui Base UI component foundation
- Premium dark infrastructure marketing layout
- GPU / CPU / cluster / dedicated catalog UI
- Product pages for pricing, storage, networking, instances, and documentation
- A configuration flow that prepares an email quote request

## Routes

- `/` — Compute catalog and product landing page
- `/pricing` — pricing categories and billing units; contact for pricing
- `/storage` — block volumes, object storage, and shared storage
- `/network` — private connectivity, public traffic, and high-speed fabric
- `/instances` — instance workspace with search, filters, and an empty state
- `/docs` — public product and platform documentation

## Verified stack

- Next.js: 16.4.0
- React: 19.3.0
- Tailwind CSS: 4.3.3
- TypeScript: 7.0.2
- package manager: npm (package-lock.json present)

## Install and run

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Verification scripts

```bash
npm run build
```

There is no lint script configured in package.json at the moment, and no backend auth / billing / database layer is implemented in the codebase yet.

## What is not implemented yet

The following capabilities are described in the architecture notes but are not verified in the repo:
- Better Auth authentication
- Neon PostgreSQL / Drizzle integration
- provider API adapters for RunPod
- billing ledger and cost accounting
- RBAC / authorization layer
- instance orchestration and resource lifecycle
- production backend APIs and admin tooling

Pricing is available on request. Resource operations and account-specific instance data require backend integration.
