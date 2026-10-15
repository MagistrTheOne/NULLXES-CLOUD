# Instructions for coding agents

Before changing this repository, read [claude.md](claude.md), [README.md](README.md), and [docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md). For provider-specific boundaries, also read [docs/infrastructure-runtime.md](docs/infrastructure-runtime.md).

Treat the handoff as a dated snapshot, not proof of current deployment state. Inspect the actual source before making claims or edits. Preserve the existing NULLXES Cloud design and architecture unless the requested change requires otherwise.

## Project rules

- No invented functionality, provider capabilities, live inventory, prices, successful checks, or deployment status. Clearly label what is implemented, configured, and verified at runtime.
- Never expose `.env` values, provider credentials, session tokens, or customer secrets. Keep provider calls and credentials server-side.
- Do not connect Runpod provisioning or charge customers until each operation, account permission, commercial authorization, billing semantics, ownership checks, idempotency, and spending controls have been verified.
- Never silently substitute demo/static data when production data is unavailable. Show an explicit unavailable/error state.
- Preserve existing user changes. Do not rewrite applied migrations; add reviewed forward-only migrations that preserve existing data.
- Before adding a provider adapter, close the P0/P1 risks in the handoff and run the requested checks. Do not claim a check passed unless it was run and its output observed.
- Do not launch the application or contact external services unless the task explicitly requires it.
