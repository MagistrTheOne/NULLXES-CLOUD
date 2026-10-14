# NULLXES Cloud

A dark-mode Next.js landing page prototype for a GPU / CPU cloud platform focused on AI, robotics, and high-performance compute workloads.

## Current implementation

The project currently includes:
- Next.js App Router frontend
- React 19 + TypeScript
- Tailwind CSS v4 styling
- shadcn/ui-inspired primitives for cards, tabs, dialogs, buttons, and toggle groups
- Premium dark infrastructure marketing layout
- GPU / CPU / cluster / dedicated catalog UI
- Sample configurator flow for quoting resources

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

This project is currently a frontend prototype and a product demo shell, not a complete cloud platform backend.
