export type ComputeType = "cpu" | "gpu";

export type BlockStorageKind =
  | "boot_disk"
  | "container_disk"
  | "persistent_instance_volume"
  | "network_volume";

export type LifecycleStatus =
  | "requested"
  | "provisioning"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "restarting"
  | "terminating"
  | "terminated"
  | "failed"
  | "unknown"
  | "reconciliation_required";

export type Availability = "available" | "unavailable" | "unknown";

export type ProviderFailureCode =
  | "INVALID_CONFIGURATION"
  | "UNAUTHORIZED"
  | "QUOTA_EXCEEDED"
  | "INSUFFICIENT_CAPACITY"
  | "UNSUPPORTED_CONFIGURATION"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT_UNKNOWN_OUTCOME"
  | "NOT_FOUND"
  | "PROVISIONING_FAILED"
  | "PERMANENT_PROVIDER_ERROR"
  | "DATABASE_UNAVAILABLE"
  | "IDEMPOTENCY_CONFLICT"
  | "LIFECYCLE_CONFLICT"
  | "UNSUPPORTED_CAPABILITY"
  | "PROVIDER_NOT_CONFIGURED";

export interface QuantityRange {
  min: number;
  max: number;
  increment: number;
}

export interface RequestedBlockStorage {
  kind: BlockStorageKind;
  sizeGiB: number;
  mountPath?: string;
}

export interface RequestedComputeConfiguration {
  catalogEntryId: string;
  computeType: ComputeType;
  cpuModelId?: string;
  vcpuCount?: number;
  memoryGiB: number;
  gpu?: {
    modelId: string;
    count: number;
  };
  region: string;
  availabilityZone?: string;
  imageId: string;
  storage: RequestedBlockStorage[];
}

export interface StorageOffering {
  kind: BlockStorageKind;
  sizeGiB: QuantityRange;
  maxAttachments: number;
  mountPathRequired: boolean;
  survivesStop: boolean;
  survivesTermination: boolean;
  resizeSupported: boolean;
  billingDimensions: readonly (
    | "allocated_gib_time"
    | "compute_time"
    | "provisioned_iops"
    | "throughput"
  )[];
}

export interface ProviderCatalogProduct {
  provider: string;
  providerProductId: string;
  catalogEntryId: string;
  displayName: string;
  published: boolean;
  availability: Availability;
  availabilityObservedAt: string | null;
  computeType: ComputeType;
  cpu: {
    modelIds: readonly string[];
    vcpuCount: QuantityRange;
  };
  memoryGiB: QuantityRange;
  gpu?: {
    modelIds: readonly string[];
    count: QuantityRange;
    vramGiBPerGpuByModel?: Readonly<Record<string, number>>;
    architectureByModel?: Readonly<Record<string, string>>;
    capabilitiesByModel?: Readonly<Record<string, readonly string[]>>;
  };
  regions: readonly string[];
  availabilityZones: readonly string[];
  imageIds: readonly string[];
  storage: readonly StorageOffering[];
}

export interface PublishedCatalogEntry {
  id: string;
  displayName: string;
  computeType: ComputeType;
  publishedAt: string;
  publicSpecifications: Readonly<Record<string, string | number | boolean>>;
  availability: Availability;
  availabilityObservedAt: string | null;
}

export interface NormalizedComputeConfiguration {
  provider: string;
  providerProductId: string;
  catalogEntryId: string;
  computeType: ComputeType;
  cpu: {
    modelId: string;
    vcpuCount: number;
  };
  memoryGiB: number;
  gpu?: {
    modelId: string;
    count: number;
    vramGiBPerGpu?: number;
    totalVramGiB?: number;
    architecture?: string;
    capabilities?: readonly string[];
  };
  region: string;
  availabilityZone?: string;
  imageId: string;
  storage: readonly {
    kind: BlockStorageKind;
    requestedGiB: number;
    unit: "GiB";
    mountPath?: string;
    survivesStop: boolean;
    survivesTermination: boolean;
    resizeSupported: boolean;
  }[];
}

export interface ActualComputeConfiguration {
  provider: string;
  providerProductId?: string;
  computeType: ComputeType;
  cpu?: {
    model?: string;
    vcpuCount?: number;
  };
  memoryGiB?: number;
  gpu?: {
    model: string;
    count: number;
    vramGiBPerGpu?: number;
    totalVramGiB?: number;
    architecture?: string;
    capabilities?: readonly string[];
  };
  region?: string;
  availabilityZone?: string;
  imageId?: string;
  providerReportedAt: string;
}

export interface ActualBlockStorage {
  kind: BlockStorageKind;
  providerStorageId?: string;
  requestedGiB: number;
  actualGiB?: number;
  unit: "GiB";
  mountPath?: string;
  status: "creating" | "available" | "attached" | "detaching" | "deleting" | "failed" | "unknown";
  usedBytes?: number;
  usageObservedAt?: string;
  survivesStop: boolean;
  survivesTermination: boolean;
  resizeSupported: boolean;
}

export interface ObjectStorageResource {
  product: "object_storage";
  provider: string;
  providerResourceId?: string;
  region?: string;
  usedBytes?: number;
  usageObservedAt?: string;
}

export interface ComputeInstanceSnapshot {
  id: string;
  ownerId: string;
  requested: RequestedComputeConfiguration;
  normalized: NormalizedComputeConfiguration;
  publishedCatalog: PublishedCatalogEntry;
  actual: ActualComputeConfiguration | null;
  actualStorage: readonly ActualBlockStorage[];
  lifecycle: LifecycleStatus;
  providerStatus: string | null;
  providerOperationId: string | null;
  providerResourceId: string | null;
  lastSyncedAt: string | null;
}

export interface ProviderCapabilities {
  discoverProducts: boolean;
  create: boolean;
  inspect: boolean;
  start: boolean;
  stop: boolean;
  restart: boolean;
  terminate: boolean;
  createIdempotency: "provider-guaranteed" | "reconcile-before-retry" | "unsupported";
  storageKinds: readonly BlockStorageKind[];
}

export interface ProviderOperationContext {
  requestId: string;
  idempotencyKey: string;
}

export interface ProviderOperationReceipt {
  providerOperationId: string | null;
  providerResourceId: string | null;
  providerStatus: string;
  submittedAt: string;
}

export interface ProviderObservation {
  providerResourceId: string;
  providerStatus: string;
  lifecycle: LifecycleStatus;
  configuration: ActualComputeConfiguration | null;
  storage: readonly ActualBlockStorage[];
  observedAt: string;
}

export type CapabilityResult<T> =
  | { supported: true; value: T }
  | {
      supported: false;
      code: "UNSUPPORTED_CAPABILITY" | "PROVIDER_NOT_CONFIGURED";
      capability: string;
      message: string;
    };

export interface ProviderAdapter {
  readonly provider: string;
  readonly capabilities: ProviderCapabilities;
  discoverProducts(): Promise<CapabilityResult<readonly ProviderCatalogProduct[]>>;
  validateConfiguration(
    product: ProviderCatalogProduct,
    configuration: NormalizedComputeConfiguration,
  ): Promise<CapabilityResult<void>>;
  createInstance(
    configuration: NormalizedComputeConfiguration,
    context: ProviderOperationContext,
  ): Promise<CapabilityResult<ProviderOperationReceipt>>;
  inspectInstance(
    providerResourceId: string,
  ): Promise<CapabilityResult<ProviderObservation>>;
  startInstance(
    providerResourceId: string,
    context: ProviderOperationContext,
  ): Promise<CapabilityResult<ProviderOperationReceipt>>;
  stopInstance(
    providerResourceId: string,
    context: ProviderOperationContext,
  ): Promise<CapabilityResult<ProviderOperationReceipt>>;
  restartInstance(
    providerResourceId: string,
    context: ProviderOperationContext,
  ): Promise<CapabilityResult<ProviderOperationReceipt>>;
  terminateInstance(
    providerResourceId: string,
    context: ProviderOperationContext,
  ): Promise<CapabilityResult<ProviderOperationReceipt>>;
}

export interface AccountResourceQuota {
  maxInstances: number;
  usedInstances: number;
  maxVcpu: number;
  usedVcpu: number;
  maxMemoryGiB: number;
  usedMemoryGiB: number;
  maxGpuCount: number;
  usedGpuCount: number;
  maxAllocatedStorageGiB: number;
  usedAllocatedStorageGiB: number;
}

export interface ProviderFailure {
  code: ProviderFailureCode;
  safeMessage: string;
  retryAfterMs?: number;
  providerOperationId?: string;
}

export interface OperationRepository {
  reserveCreate(input: {
    ownerId: string;
    idempotencyKey: string;
    requestFingerprint: string;
    configuration: NormalizedComputeConfiguration;
  }): Promise<
    | { kind: "created"; instanceId: string }
    | {
        kind: "replay";
        instanceId: string;
        requestFingerprint: string;
        lifecycle: LifecycleStatus;
      }
    | { kind: "conflict"; instanceId: string }
  >;
  compareAndSetLifecycle(input: {
    instanceId: string;
    expected: LifecycleStatus;
    next: LifecycleStatus;
    providerOperationId?: string;
    providerResourceId?: string;
  }): Promise<boolean>;
  markReconciliationRequired(input: {
    instanceId: string;
    providerOperationId?: string;
    safeReason: string;
  }): Promise<void>;
}
