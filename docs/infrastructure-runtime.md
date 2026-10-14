# Infrastructure runtime boundary

**Reviewed: 2026-10-14**

This document records provider research and the boundary of the current infrastructure domain layer. It does not represent a provider integration, a live inventory feed, commercial approval, or a promise that compute can be provisioned.

## Current implementation status

The application has provider-neutral types and deterministic domain helpers in `lib/infrastructure/`:

- Typed requested, normalized, published, actual, and lifecycle data models, plus provider and durable-operation repository contracts.
- Catalog-based validation for compute, region, image, storage sizing, current availability, and account quotas. Capacity is rejected when unknown, unavailable, or stale. Storage capacity uses binary GiB; decimal GB values must be converted conservatively.
- Lifecycle-transition and reconciliation eligibility rules, provider-error classification, idempotency comparison, bounded retry policy, and a redacted error response shape.
- Unit tests for the domain rules in `scripts/infrastructure-domain.test.mjs`.

This layer is not wired to a provider, the database, or a mutation API. There is no provider adapter, live provider catalog, durable operation/reconciliation worker, create/start/stop/restart/terminate endpoint, or provider-backed customer instance data. The existing `compute_instances` database constraint accepts a smaller set of lifecycle states than the new domain model. Any persistence or operation-log work needs a reviewed additive migration before implementation. No database schema or production data was changed for this foundation.

**Provider status: none selected or connected.** Runpod access credentials and permissions were not available for verification. AWS is explicitly out of scope and remains unconnected. No resource was created or modified.

## Runpod assessment

Reviewed Runpod's official documentation on **2026-10-14**:

- [API v2 overview](https://docs.runpod.io/api-reference-v2/overview.md) and [migration from API v1](https://docs.runpod.io/api-reference-v2/migrate-from-v1.md)
- [Create a Pod](https://docs.runpod.io/api-reference-v2/pods/create-a-pod.md), [list Pods](https://docs.runpod.io/api-reference-v2/pods/list-pods.md), and [list CPU types](https://docs.runpod.io/api-reference-v2/catalog/list-cpu-types.md)
- [GPU types](https://docs.runpod.io/references/gpu-types.md), [CPU types](https://docs.runpod.io/references/cpu-types.md), and [Pod storage](https://docs.runpod.io/pods/storage/types.md)
- [Network volumes](https://docs.runpod.io/storage/network-volumes.md), [Pod pricing](https://docs.runpod.io/pods/pricing.md), and [exposing ports](https://docs.runpod.io/pods/configuration/expose-ports.md)
- [Runpod Terms of Service](https://www.runpod.io/legal/terms-of-service), last updated 2026-03-24

### What the sources establish

- The documented REST API v2 base is `https://api.runpod.io/v2`; API requests authenticate with a server-side API key using the HTTP Authorization header. Never expose that key to a browser or customer response. The v2 migration guide states that API v1 is planned for retirement on **2026-11-15**; any future implementation should target the currently documented API and recheck its version status at implementation time.
- Runpod documents CPU and GPU Pods, product/catalog discovery, Pod lifecycle operations, container and persistent/network storage options, and billing. Pod creation can return a provisioning state; that response is not proof that the instance is running or ready.
- Catalog entries and availability are not reservations. Availability, allowed products, regions/data centers, and account limits need fresh account-specific checks. A catalog listing or published NULLXES entry must never be presented as guaranteed capacity.
- The create-Pod documentation includes validation/capacity-related client errors and rate limiting with `Retry-After`. An HTTP timeout or lost response can leave a mutation's outcome uncertain. Do not blindly repeat a create request unless the provider documents a usable idempotency guarantee; persist the operation and reconcile it against provider state first.
- Storage types have different persistence and lifecycle semantics. Container storage is not interchangeable with persistent volumes. Volume survival, attachment rules, size limits, and termination behavior must be represented per actual product rather than inferred from a generic disk label.
- GPU/CPU prices and availability are account- and configuration-sensitive. Do not copy illustrative or momentary provider rates into NULLXES commercial pricing without a verified pricing model and approval.
- Runpod's documentation and reviewed Terms of Service do not establish permission for NULLXES to resell or broker provider compute. Obtain written provider approval and legal review before offering paid customer provisioning.

### Not verified

No Runpod credential, account permissions, live product catalog, live region availability, current account quotas, API behavior, support entitlement, or commercial resale authorization was verified. The sources reviewed do not prove an end-to-end operation in a NULLXES account.

## AWS EC2 assessment (research only)

AWS is **not connected** and remains out of scope. The following official references were reviewed on **2026-10-14**:

- [EC2 instance types](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html), [EBS volume types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html), and [EBS volume modification](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-modify-volume.html)
- [EC2 service quotas](https://docs.aws.amazon.com/general/latest/gr/ec2-service.html), [EC2 On-Demand pricing](https://aws.amazon.com/ec2/pricing/on-demand/), and [EBS pricing](https://aws.amazon.com/ebs/pricing/)
- API references for [RunInstances](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_RunInstances.html), [StartInstances](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_StartInstances.html), [StopInstances](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_StopInstances.html), and [TerminateInstances](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_TerminateInstances.html)
- [EC2 instance lifecycle and billing states](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html) and [EC2 API request authentication](https://docs.aws.amazon.com/ec2/latest/devguide/Query-Requests.html)

EC2 offers many instance families and EBS volume types; actual types, quotas, prices, and availability depend on account, region, and configuration. AWS API requests require AWS request signing (Signature Version 4), so credentials and signing must remain in a trusted server environment. A stopped instance retains its EBS volumes and can continue to incur storage charges; instance-store data does not persist through stop. Termination can delete attached EBS volumes according to each volume's `DeleteOnTermination` setting. A future customer-facing delete action therefore needs explicit, verified data-retention semantics and confirmation.

No AWS credentials, account, region, quotas, prices, resource access, or provider behavior were tested. No AWS SDK or integration was added.

## Requirements before provider integration

1. Select one provider only after reviewing account ownership, permissions, live products and regions, quotas, pricing, and written commercial authorization for the intended customer offering.
2. Define the public catalog independently from volatile capacity. Before create, resolve a server-trusted catalog record, verify current provider availability, validate account limits, and retain exactly what was requested, what was published, and what the provider actually created.
3. Implement durable operation records and idempotency fingerprints before exposing mutations. Persist the intent before sending a request; reconcile uncertain outcomes before retry; enforce owner scoping and lifecycle compare-and-set in the database. A `202` response is appropriate only if a durable asynchronous operation was actually accepted.
4. Add provider-specific lifecycle and storage mapping only after verifying the provider's current API contract. Never equate a submitted request or a `PROVISIONING` state with a running/ready instance.
5. Generate and review versioned Drizzle migrations before production changes. Align the database lifecycle constraint with the transitions actually supported; do not bypass the existing constraint.
6. Add provider-backed tests with a non-production account/branch and explicit spending limits. Do not create or delete real resources as an unapproved test side effect.
7. Keep API keys and provider identifiers private. Customer responses should expose only NULLXES-owned resource IDs and safe provider-independent status, not credentials or raw provider errors.

## Cost and commercial safety

Provider catalogue prices are not automatically NULLXES retail prices. A commercial price needs an approved margin, currency, billing unit, rounding/refund policy, and treatment of idle compute, persistent storage, network transfer, public IPs, taxes, and failed/partial operations. No price, markup, billing, or customer charge was implemented.

The existing public catalog is a product definition, not a live provider catalog; an empty customer instance list remains the truthful state until a verified provider integration exists.
