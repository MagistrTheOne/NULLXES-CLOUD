import type {
  AccountResourceQuota,
  NormalizedComputeConfiguration,
  ProviderCatalogProduct,
  RequestedComputeConfiguration,
} from "./contracts";

export type ConfigurationIssueCode =
  | "INVALID_REQUEST"
  | "CATALOG_NOT_PUBLISHED"
  | "AVAILABILITY_UNKNOWN"
  | "CAPACITY_UNAVAILABLE"
  | "AVAILABILITY_STALE"
  | "UNSUPPORTED_CONFIGURATION"
  | "QUOTA_EXCEEDED";

export class ConfigurationValidationError extends Error {
  readonly code: ConfigurationIssueCode;

  constructor(
    code: ConfigurationIssueCode,
    message: string,
  ) {
    super(message);
    this.name = "ConfigurationValidationError";
    this.code = code;
  }
}

export interface ValidationContext {
  now: Date;
  availabilityMaxAgeMs: number;
}

function fail(code: ConfigurationIssueCode, message: string): never {
  throw new ConfigurationValidationError(code, message);
}

function isValidRange(range: { min: number; max: number; increment: number }): boolean {
  return (
    Number.isSafeInteger(range.min) &&
    Number.isSafeInteger(range.max) &&
    Number.isSafeInteger(range.increment) &&
    range.min > 0 &&
    range.max >= range.min &&
    range.increment > 0
  );
}

function validateQuantity(
  value: number,
  range: { min: number; max: number; increment: number },
  label: string,
): void {
  if (!isValidRange(range) || !Number.isSafeInteger(value)) {
    fail("INVALID_REQUEST", `${label} must be a whole-number quantity.`);
  }
  if (value < range.min || value > range.max) {
    fail(
      "UNSUPPORTED_CONFIGURATION",
      `${label} must be between ${range.min} and ${range.max}.`,
    );
  }
  if ((value - range.min) % range.increment !== 0) {
    fail(
      "UNSUPPORTED_CONFIGURATION",
      `${label} does not match the catalog sizing increment.`,
    );
  }
}

function validateQuota(
  quota: AccountResourceQuota,
  requested: {
    vcpuCount: number;
    memoryGiB: number;
    gpuCount: number;
    storageGiB: number;
  },
): void {
  const quotaValues = Object.values(quota);
  if (
    quotaValues.some((value) => !Number.isSafeInteger(value) || value < 0) ||
    quota.maxInstances < 1 ||
    quota.maxVcpu < 1 ||
    quota.maxMemoryGiB < 1
  ) {
    fail("INVALID_REQUEST", "Account resource limits are unavailable or invalid.");
  }

  if (quota.usedInstances + 1 > quota.maxInstances) {
    fail("QUOTA_EXCEEDED", "Your account has reached its instance limit.");
  }
  if (quota.usedVcpu + requested.vcpuCount > quota.maxVcpu) {
    fail("QUOTA_EXCEEDED", "This configuration exceeds your account CPU quota.");
  }
  if (quota.usedMemoryGiB + requested.memoryGiB > quota.maxMemoryGiB) {
    fail("QUOTA_EXCEEDED", "This configuration exceeds your account memory quota.");
  }
  if (quota.usedGpuCount + requested.gpuCount > quota.maxGpuCount) {
    fail("QUOTA_EXCEEDED", "This configuration exceeds your account GPU quota.");
  }
  if (
    quota.usedAllocatedStorageGiB + requested.storageGiB >
    quota.maxAllocatedStorageGiB
  ) {
    fail("QUOTA_EXCEEDED", "This configuration exceeds your account storage quota.");
  }
}

export function validateResourceRequest(
  request: RequestedComputeConfiguration,
  product: ProviderCatalogProduct,
  quota: AccountResourceQuota,
  context: ValidationContext,
): NormalizedComputeConfiguration {
  if (!product.published || product.catalogEntryId !== request.catalogEntryId) {
    fail("CATALOG_NOT_PUBLISHED", "This configuration is not published.");
  }

  if (product.availability === "unknown" || !product.availabilityObservedAt) {
    fail("AVAILABILITY_UNKNOWN", "Current provider availability has not been verified.");
  }
  if (product.availability === "unavailable") {
    fail("CAPACITY_UNAVAILABLE", "This configuration is currently unavailable.");
  }

  const observedAt = Date.parse(product.availabilityObservedAt);
  if (
    !Number.isFinite(observedAt) ||
    !Number.isFinite(context.now.getTime()) ||
    !Number.isSafeInteger(context.availabilityMaxAgeMs) ||
    context.availabilityMaxAgeMs < 0 ||
    observedAt > context.now.getTime() ||
    context.now.getTime() - observedAt > context.availabilityMaxAgeMs
  ) {
    fail("AVAILABILITY_STALE", "Provider availability needs to be checked again.");
  }

  if (
    !request.catalogEntryId ||
    !request.region ||
    !request.imageId ||
    !Array.isArray(request.storage) ||
    !["cpu", "gpu"].includes(request.computeType) ||
    product.computeType !== request.computeType
  ) {
    fail("INVALID_REQUEST", "The requested compute configuration is invalid.");
  }

  if (!product.regions.includes(request.region)) {
    fail("UNSUPPORTED_CONFIGURATION", "This region is not offered for the selected configuration.");
  }
  if (
    request.availabilityZone &&
    !product.availabilityZones.includes(request.availabilityZone)
  ) {
    fail(
      "UNSUPPORTED_CONFIGURATION",
      "This availability zone is not offered for the selected configuration.",
    );
  }
  if (!product.imageIds.includes(request.imageId)) {
    fail("UNSUPPORTED_CONFIGURATION", "This operating system or image is not supported.");
  }

  validateQuantity(request.memoryGiB, product.memoryGiB, "Memory");

  const cpuModelId =
    request.cpuModelId ??
    (product.cpu.modelIds.length === 1 ? product.cpu.modelIds[0] : undefined);
  if (!cpuModelId || !product.cpu.modelIds.includes(cpuModelId)) {
    fail("UNSUPPORTED_CONFIGURATION", "Select a CPU model supported by this configuration.");
  }

  const vcpuCount =
    request.vcpuCount ??
    (product.cpu.vcpuCount.min === product.cpu.vcpuCount.max
      ? product.cpu.vcpuCount.min
      : undefined);
  if (vcpuCount === undefined) {
    fail("INVALID_REQUEST", "Select a CPU allocation supported by this configuration.");
  }
  validateQuantity(vcpuCount, product.cpu.vcpuCount, "CPU allocation");

  let gpu: NormalizedComputeConfiguration["gpu"];
  if (request.computeType === "gpu") {
    if (!product.gpu || !request.gpu) {
      fail("UNSUPPORTED_CONFIGURATION", "The selected catalog item does not support this GPU request.");
    }
    if (!product.gpu.modelIds.includes(request.gpu.modelId)) {
      fail("UNSUPPORTED_CONFIGURATION", "The selected GPU model is not supported.");
    }
    validateQuantity(request.gpu.count, product.gpu.count, "GPU count");

    const vramGiBPerGpu =
      product.gpu.vramGiBPerGpuByModel?.[request.gpu.modelId];
    gpu = {
      modelId: request.gpu.modelId,
      count: request.gpu.count,
      ...(vramGiBPerGpu === undefined
        ? {}
        : {
            vramGiBPerGpu,
            totalVramGiB: vramGiBPerGpu * request.gpu.count,
          }),
      ...(product.gpu.architectureByModel?.[request.gpu.modelId]
        ? { architecture: product.gpu.architectureByModel[request.gpu.modelId] }
        : {}),
      ...(product.gpu.capabilitiesByModel?.[request.gpu.modelId]
        ? { capabilities: product.gpu.capabilitiesByModel[request.gpu.modelId] }
        : {}),
    };
  } else if (request.gpu || product.gpu) {
    fail("UNSUPPORTED_CONFIGURATION", "CPU configurations cannot include GPU allocations.");
  }

  const storageCounts = new Map<string, number>();
  const normalizedStorage: NormalizedComputeConfiguration["storage"][number][] = [];
  let allocatedStorageGiB = 0;

  for (const requestedStorage of request.storage) {
    const offering = product.storage.find(
      (item) => item.kind === requestedStorage.kind,
    );
    if (!offering) {
      fail(
        "UNSUPPORTED_CONFIGURATION",
        `The selected configuration does not support ${requestedStorage.kind}.`,
      );
    }
    if (!Number.isSafeInteger(offering.maxAttachments) || offering.maxAttachments < 1) {
      fail("INVALID_REQUEST", "Catalog storage attachment limits are invalid.");
    }
    const count = (storageCounts.get(offering.kind) ?? 0) + 1;
    if (count > offering.maxAttachments) {
      fail("UNSUPPORTED_CONFIGURATION", `Too many ${offering.kind} attachments were requested.`);
    }
    storageCounts.set(offering.kind, count);
    validateQuantity(
      requestedStorage.sizeGiB,
      offering.sizeGiB,
      `${offering.kind} capacity`,
    );

    if (
      offering.mountPathRequired &&
      (!requestedStorage.mountPath ||
        !requestedStorage.mountPath.startsWith("/") ||
        requestedStorage.mountPath.split("/").includes("..") ||
        requestedStorage.mountPath.includes("\0"))
    ) {
      fail("INVALID_REQUEST", `A safe absolute mount path is required for ${offering.kind}.`);
    }

    allocatedStorageGiB += requestedStorage.sizeGiB;
    normalizedStorage.push({
      kind: offering.kind,
      requestedGiB: requestedStorage.sizeGiB,
      unit: "GiB",
      ...(requestedStorage.mountPath ? { mountPath: requestedStorage.mountPath } : {}),
      survivesStop: offering.survivesStop,
      survivesTermination: offering.survivesTermination,
      resizeSupported: offering.resizeSupported,
    });
  }

  validateQuota(quota, {
    vcpuCount,
    memoryGiB: request.memoryGiB,
    gpuCount: gpu?.count ?? 0,
    storageGiB: allocatedStorageGiB,
  });

  return {
    provider: product.provider,
    providerProductId: product.providerProductId,
    catalogEntryId: product.catalogEntryId,
    computeType: product.computeType,
    cpu: { modelId: cpuModelId, vcpuCount },
    memoryGiB: request.memoryGiB,
    ...(gpu ? { gpu } : {}),
    region: request.region,
    ...(request.availabilityZone
      ? { availabilityZone: request.availabilityZone }
      : {}),
    imageId: request.imageId,
    storage: normalizedStorage,
  };
}

export function decimalGigabytesToGiB(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    fail("INVALID_REQUEST", "Provider storage capacity must be a non-negative GB value.");
  }
  return Math.ceil((value * 1_000_000_000) / 1_073_741_824);
}
