import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { LIFECYCLE_STATUSES } from "../lib/infrastructure/contracts.ts";
import { GET as getHealth } from "../app/api/health/route.ts";
import {
  ConfigurationValidationError,
  decimalGigabytesToGiB,
  validateResourceRequest,
} from "../lib/infrastructure/validation.ts";
import {
  canTransitionLifecycle,
  classifyProviderFailure,
  isRetryableFailure,
  requiresReconciliation,
  resolveIdempotencyReplay,
  retryDelayMs,
  safeFailureResponse,
} from "../lib/infrastructure/reliability.ts";

const product = {
  provider: "unselected-provider",
  providerProductId: "provider-private-sku",
  catalogEntryId: "catalog-gpu-1",
  displayName: "Test GPU configuration",
  published: true,
  availability: "available",
  availabilityObservedAt: "2026-10-14T10:00:00.000Z",
  computeType: "gpu",
  cpu: { modelIds: ["cpu-family-a"], vcpuCount: { min: 4, max: 16, increment: 4 } },
  memoryGiB: { min: 16, max: 128, increment: 16 },
  gpu: {
    modelIds: ["gpu-model-a"],
    count: { min: 1, max: 4, increment: 1 },
    vramGiBPerGpuByModel: { "gpu-model-a": 24 },
    architectureByModel: { "gpu-model-a": "arch-a" },
    capabilitiesByModel: { "gpu-model-a": ["fp16"] },
  },
  regions: ["region-a"],
  availabilityZones: ["zone-a"],
  imageIds: ["image-a"],
  storage: [
    {
      kind: "container_disk",
      sizeGiB: { min: 20, max: 200, increment: 10 },
      maxAttachments: 1,
      mountPathRequired: false,
      survivesStop: false,
      survivesTermination: false,
      resizeSupported: true,
      billingDimensions: ["allocated_gib_time"],
    },
    {
      kind: "network_volume",
      sizeGiB: { min: 10, max: 4000, increment: 10 },
      maxAttachments: 1,
      mountPathRequired: true,
      survivesStop: true,
      survivesTermination: true,
      resizeSupported: true,
      billingDimensions: ["allocated_gib_time"],
    },
  ],
};

const quota = {
  maxInstances: 5,
  usedInstances: 0,
  maxVcpu: 64,
  usedVcpu: 0,
  maxMemoryGiB: 512,
  usedMemoryGiB: 0,
  maxGpuCount: 8,
  usedGpuCount: 0,
  maxAllocatedStorageGiB: 8000,
  usedAllocatedStorageGiB: 0,
};

const request = {
  catalogEntryId: "catalog-gpu-1",
  computeType: "gpu",
  cpuModelId: "cpu-family-a",
  vcpuCount: 8,
  memoryGiB: 32,
  gpu: { modelId: "gpu-model-a", count: 2 },
  region: "region-a",
  availabilityZone: "zone-a",
  imageId: "image-a",
  storage: [
    { kind: "container_disk", sizeGiB: 40 },
    { kind: "network_volume", sizeGiB: 100, mountPath: "/workspace" },
  ],
};

const context = {
  now: new Date("2026-10-14T10:01:00.000Z"),
  availabilityMaxAgeMs: 5 * 60 * 1000,
};

test("Drizzle schema and forward migration share the canonical lifecycle states", () => {
  const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
  const migration = readFileSync(
    new URL("../drizzle/migrations/0001_align_compute_instance_lifecycle.sql", import.meta.url),
    "utf8",
  );
  const quotedStates = LIFECYCLE_STATUSES.map((status) => `'${status}'`).join(", ");

  assert.ok(schema.includes(`IN (${quotedStates})`));
  assert.ok(migration.includes(`IN (${quotedStates})`));
  assert.ok(migration.indexOf("DROP CONSTRAINT") < migration.indexOf("UPDATE \"compute_instances\""));
  assert.ok(migration.indexOf("UPDATE \"compute_instances\"") < migration.indexOf("ADD CONSTRAINT"));
  assert.match(migration, /WHEN 'deleting' THEN 'terminating'/);
  assert.match(migration, /WHEN 'deleted' THEN 'terminated'/);
  assert.doesNotMatch(migration, /\b(?:DROP TABLE|DELETE FROM)\b/i);
});

function expectValidationError(fn, code) {
  assert.throws(fn, (error) => {
    assert.ok(error instanceof ConfigurationValidationError);
    assert.equal(error.code, code);
    return true;
  });
}

test("public health endpoint reports only process liveness", async () => {
  const response = await getHealth();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("normalizes verified catalog request and preserves separate storage", () => {
  const normalized = validateResourceRequest(request, product, quota, context);
  assert.equal(normalized.gpu?.totalVramGiB, 48);
  assert.equal(normalized.storage[0].unit, "GiB");
  assert.equal(normalized.storage[0].survivesTermination, false);
  assert.equal(normalized.storage[1].survivesTermination, true);
  assert.equal(normalized.providerProductId, "provider-private-sku");
});

test("refuses an unpublished catalog item", () => {
  expectValidationError(
    () => validateResourceRequest(request, { ...product, published: false }, quota, context),
    "CATALOG_NOT_PUBLISHED",
  );
});

test("does not treat an unknown provider inventory as available", () => {
  expectValidationError(
    () => validateResourceRequest(request, { ...product, availability: "unknown" }, quota, context),
    "AVAILABILITY_UNKNOWN",
  );
});

test("rejects unavailable provider inventory", () => {
  expectValidationError(
    () => validateResourceRequest(request, { ...product, availability: "unavailable" }, quota, context),
    "CAPACITY_UNAVAILABLE",
  );
});

test("rejects stale availability observations", () => {
  expectValidationError(
    () => validateResourceRequest(request, { ...product, availabilityObservedAt: "2026-10-14T09:00:00.000Z" }, quota, context),
    "AVAILABILITY_STALE",
  );
});

test("rejects unsupported compute type and GPU combinations", () => {
  expectValidationError(
    () => validateResourceRequest({ ...request, computeType: "cpu" }, product, quota, context),
    "INVALID_REQUEST",
  );
  expectValidationError(
    () => validateResourceRequest({ ...request, gpu: { modelId: "other", count: 1 } }, product, quota, context),
    "UNSUPPORTED_CONFIGURATION",
  );
});

test("rejects invalid CPU, memory, GPU count, image, and region values", () => {
  for (const edited of [
    { vcpuCount: 3 },
    { memoryGiB: 24 },
    { gpu: { modelId: "gpu-model-a", count: 5 } },
    { imageId: "unlisted-image" },
    { region: "unlisted-region" },
  ]) {
    expectValidationError(
      () => validateResourceRequest({ ...request, ...edited }, product, quota, context),
      "UNSUPPORTED_CONFIGURATION",
    );
  }
});

test("rejects storage above bounds, invalid mount paths, and extra attachments", () => {
  expectValidationError(
    () => validateResourceRequest({ ...request, storage: [{ kind: "network_volume", sizeGiB: 5000, mountPath: "/workspace" }] }, product, quota, context),
    "UNSUPPORTED_CONFIGURATION",
  );
  expectValidationError(
    () => validateResourceRequest({ ...request, storage: [{ kind: "network_volume", sizeGiB: 100, mountPath: "/workspace/../root" }] }, product, quota, context),
    "INVALID_REQUEST",
  );
  expectValidationError(
    () => validateResourceRequest({ ...request, storage: [
      { kind: "network_volume", sizeGiB: 100, mountPath: "/workspace" },
      { kind: "network_volume", sizeGiB: 200, mountPath: "/workspace2" },
    ] }, product, quota, context),
    "UNSUPPORTED_CONFIGURATION",
  );
});

test("rejects each exhausted account quota", () => {
  for (const editedQuota of [
    { usedInstances: 5 },
    { usedVcpu: 60 },
    { usedMemoryGiB: 496 },
    { usedGpuCount: 7 },
    { usedAllocatedStorageGiB: 7900 },
  ]) {
    expectValidationError(
      () => validateResourceRequest(request, product, { ...quota, ...editedQuota }, context),
      "QUOTA_EXCEEDED",
    );
  }
});

test("converts decimal GB to binary GiB by rounding up", () => {
  assert.equal(decimalGigabytesToGiB(1), 1);
  assert.equal(decimalGigabytesToGiB(1000), 932);
  assert.throws(() => decimalGigabytesToGiB(Number.NaN), ConfigurationValidationError);
});

test("rejects direct lifecycle transitions that conflict", () => {
  assert.equal(canTransitionLifecycle("running", "stopping"), true);
  assert.equal(canTransitionLifecycle("running", "terminated"), false);
  assert.equal(canTransitionLifecycle("terminated", "running"), false);
  assert.equal(canTransitionLifecycle("unknown", "running"), false);
  assert.equal(canTransitionLifecycle("unknown", "running", "provider_reconciliation"), true);
});

test("finds stale transitional states for safe reconciliation", () => {
  const old = new Date("2026-10-14T09:00:00.000Z");
  const now = new Date("2026-10-14T10:00:00.000Z");
  assert.equal(requiresReconciliation("provisioning", old, now, 60_000), true);
  assert.equal(requiresReconciliation("running", old, now, 60_000), false);
  assert.equal(requiresReconciliation("provisioning", now, old, 60_000), false);
});

test("classifies provider authentication, capacity, quota, and outage errors", () => {
  assert.equal(classifyProviderFailure(403), "UNAUTHORIZED");
  assert.equal(classifyProviderFailure(409, "INSUFFICIENT_CAPACITY"), "INSUFFICIENT_CAPACITY");
  assert.equal(classifyProviderFailure(400, "QUOTA_EXCEEDED"), "QUOTA_EXCEEDED");
  assert.equal(classifyProviderFailure(503), "PROVIDER_UNAVAILABLE");
  assert.equal(classifyProviderFailure(504), "TIMEOUT_UNKNOWN_OUTCOME");
  assert.equal(classifyProviderFailure(undefined, undefined, true), "TIMEOUT_UNKNOWN_OUTCOME");
});

test("never retries an uncertain create, and only retries mutations with provider idempotency", () => {
  assert.equal(isRetryableFailure("TIMEOUT_UNKNOWN_OUTCOME", "create", true), false);
  assert.equal(isRetryableFailure("PROVIDER_UNAVAILABLE", "create"), false);
  assert.equal(isRetryableFailure("RATE_LIMITED", "read"), true);
  assert.equal(isRetryableFailure("RATE_LIMITED", "start", true), true);
  assert.equal(isRetryableFailure("RATE_LIMITED", "terminate"), false);
  assert.equal(isRetryableFailure("UNAUTHORIZED", "read"), false);
});

test("uses bounded exponential backoff, jitter, and Retry-After", () => {
  const options = { maxAttempts: 4, baseDelayMs: 100, maxDelayMs: 500 };
  assert.equal(retryDelayMs(1, options, () => 0.5), 50);
  assert.equal(retryDelayMs(2, { ...options, retryAfterMs: 180 }, () => 0.1), 180);
  assert.equal(retryDelayMs(2, { ...options, retryAfterMs: 600 }, () => 0.1), null);
  assert.equal(retryDelayMs(4, options, () => 0.5), null);
  assert.equal(retryDelayMs(1, options, () => 2), null);
});

test("replays a duplicate idempotency key only for the same request fingerprint", () => {
  assert.equal(resolveIdempotencyReplay("same", "same"), "replay");
  assert.equal(resolveIdempotencyReplay("existing", "different"), "conflict");
});

test("maps provider failures to safe structured responses", () => {
  const response = safeFailureResponse({
    code: "TIMEOUT_UNKNOWN_OUTCOME",
    safeMessage: "The provider did not confirm the operation. Check its outcome before retrying.",
    providerOperationId: "internal-operation",
  });
  assert.equal(response.status, 504);
  assert.deepEqual(response.body, {
    error: {
      code: "TIMEOUT_UNKNOWN_OUTCOME",
      message: "The provider did not confirm the operation. Check its outcome before retrying.",
    },
  });
  assert.equal(JSON.stringify(response).includes("internal-operation"), false);
});
