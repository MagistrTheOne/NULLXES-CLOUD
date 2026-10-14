import type {
  LifecycleStatus,
  ProviderFailure,
  ProviderFailureCode,
} from "./contracts";

const transitions: Readonly<Record<LifecycleStatus, readonly LifecycleStatus[]>> = {
  requested: ["provisioning", "failed", "reconciliation_required"],
  provisioning: [
    "starting",
    "running",
    "stopping",
    "stopped",
    "terminating",
    "failed",
    "unknown",
    "reconciliation_required",
  ],
  starting: [
    "running",
    "stopping",
    "terminating",
    "failed",
    "unknown",
    "reconciliation_required",
  ],
  running: [
    "stopping",
    "restarting",
    "terminating",
    "failed",
    "unknown",
    "reconciliation_required",
  ],
  stopping: [
    "running",
    "stopped",
    "terminating",
    "failed",
    "unknown",
    "reconciliation_required",
  ],
  stopped: ["starting", "terminating", "unknown", "reconciliation_required"],
  restarting: [
    "running",
    "stopping",
    "terminating",
    "failed",
    "unknown",
    "reconciliation_required",
  ],
  terminating: [
    "terminated",
    "failed",
    "unknown",
    "reconciliation_required",
  ],
  terminated: ["terminated"],
  failed: ["reconciliation_required", "terminating"],
  unknown: ["reconciliation_required"],
  reconciliation_required: ["reconciliation_required"],
};

export function canTransitionLifecycle(
  current: LifecycleStatus,
  next: LifecycleStatus,
  source: "request" | "provider_reconciliation" = "request",
): boolean {
  if (source === "provider_reconciliation" && current !== "terminated") {
    return next !== "requested";
  }
  return transitions[current].includes(next);
}

export function requiresReconciliation(
  lifecycle: LifecycleStatus,
  updatedAt: Date,
  now: Date,
  staleAfterMs: number,
): boolean {
  const transitional =
    lifecycle === "requested" ||
    lifecycle === "provisioning" ||
    lifecycle === "starting" ||
    lifecycle === "stopping" ||
    lifecycle === "restarting" ||
    lifecycle === "terminating" ||
    lifecycle === "unknown" ||
    lifecycle === "reconciliation_required";
  return (
    transitional &&
    Number.isFinite(updatedAt.getTime()) &&
    Number.isFinite(now.getTime()) &&
    Number.isSafeInteger(staleAfterMs) &&
    staleAfterMs >= 0 &&
    now.getTime() - updatedAt.getTime() >= staleAfterMs
  );
}

export function classifyProviderFailure(
  status: number | undefined,
  providerCode?: string,
  outcomeUnknown = false,
): ProviderFailureCode {
  if (outcomeUnknown) return "TIMEOUT_UNKNOWN_OUTCOME";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 408 || status === 504) return "TIMEOUT_UNKNOWN_OUTCOME";
  if (status === 429) return "RATE_LIMITED";
  if (status !== undefined && status >= 500) return "PROVIDER_UNAVAILABLE";
  if (
    providerCode &&
    /capacity|no[_ -]?gpu|insufficient/i.test(providerCode)
  ) {
    return "INSUFFICIENT_CAPACITY";
  }
  if (
    providerCode &&
    /quota|limit[_ -]?exceeded/i.test(providerCode)
  ) {
    return "QUOTA_EXCEEDED";
  }
  if (
    status === 400 ||
    status === 409 ||
    (providerCode && /invalid|unsupported/i.test(providerCode))
  ) {
    return "UNSUPPORTED_CONFIGURATION";
  }
  return "PERMANENT_PROVIDER_ERROR";
}

export function isRetryableFailure(
  code: ProviderFailureCode,
  operation: "read" | "create" | "start" | "stop" | "restart" | "terminate",
  providerGuaranteesIdempotency = false,
): boolean {
  if (code === "TIMEOUT_UNKNOWN_OUTCOME") return false;
  const retryableCode = code === "RATE_LIMITED" || code === "PROVIDER_UNAVAILABLE";
  if (!retryableCode) return false;
  return operation === "read" || providerGuaranteesIdempotency;
}

export function retryDelayMs(
  attempt: number,
  options: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    retryAfterMs?: number;
  },
  random: () => number = Math.random,
): number | null {
  if (
    !Number.isSafeInteger(attempt) ||
    !Number.isSafeInteger(options.maxAttempts) ||
    !Number.isSafeInteger(options.baseDelayMs) ||
    !Number.isSafeInteger(options.maxDelayMs) ||
    options.maxAttempts < 1 ||
    options.baseDelayMs < 0 ||
    options.maxDelayMs < options.baseDelayMs ||
    attempt < 1 ||
    attempt >= options.maxAttempts
  ) {
    return null;
  }
  if (
    options.retryAfterMs !== undefined &&
    (!Number.isSafeInteger(options.retryAfterMs) || options.retryAfterMs < 0)
  ) {
    return null;
  }

  const randomValue = random();
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue > 1) {
    return null;
  }
  const exponential = Math.min(
    options.maxDelayMs,
    options.baseDelayMs * 2 ** (attempt - 1),
  );
  const jittered = Math.floor(randomValue * exponential);
  const serverDelay = options.retryAfterMs ?? 0;
  if (serverDelay > options.maxDelayMs) return null;
  return Math.max(jittered, serverDelay);
}

export function resolveIdempotencyReplay(
  existingFingerprint: string,
  requestedFingerprint: string,
): "replay" | "conflict" {
  return existingFingerprint === requestedFingerprint ? "replay" : "conflict";
}

export function safeFailureResponse(failure: ProviderFailure): {
  status: number;
  body: { error: { code: ProviderFailureCode; message: string } };
} {
  const statusByCode: Record<ProviderFailureCode, number> = {
    INVALID_CONFIGURATION: 400,
    UNAUTHORIZED: 401,
    QUOTA_EXCEEDED: 409,
    INSUFFICIENT_CAPACITY: 409,
    UNSUPPORTED_CONFIGURATION: 422,
    RATE_LIMITED: 429,
    PROVIDER_UNAVAILABLE: 503,
    TIMEOUT_UNKNOWN_OUTCOME: 504,
    NOT_FOUND: 404,
    PROVISIONING_FAILED: 502,
    PERMANENT_PROVIDER_ERROR: 502,
    DATABASE_UNAVAILABLE: 503,
    IDEMPOTENCY_CONFLICT: 409,
    LIFECYCLE_CONFLICT: 409,
    UNSUPPORTED_CAPABILITY: 501,
    PROVIDER_NOT_CONFIGURED: 503,
  };
  return {
    status: statusByCode[failure.code],
    body: {
      error: {
        code: failure.code,
        message: failure.safeMessage,
      },
    },
  };
}
