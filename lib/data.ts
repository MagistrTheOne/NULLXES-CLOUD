export type Tab = "gpu" | "cpu" | "cluster" | "dedicated";
export type Item = { id: string; name: string; arch: string; img: string; specs: [string, string, string, string]; counts: number[] };

export const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "gpu", label: "GPU", sub: "Choose the right hardware for your workload. From individual GPUs to large-scale clusters with redundancy." },
  { id: "cpu", label: "CPU", sub: "High-core-count processors for pipelines, services and orchestration." },
  { id: "cluster", label: "Cluster", sub: "Interconnected multi-node GPU clusters for large-scale training." },
  { id: "dedicated", label: "Dedicated", sub: "Single-tenant hardware with reserved capacity." },
];

export const ITEMS: Record<Tab, Item[]> = {
  gpu: [
    { id: "b300", name: "NVIDIA B300", arch: "Blackwell Ultra", img: "gpu-b300", specs: ["Up to 288 GB HBM3e", "Large-scale AI workloads", "Training and inference", "Configuration details on request"], counts: [1, 2, 4, 8] },
    { id: "b200", name: "NVIDIA B200", arch: "Blackwell", img: "gpu-b200", specs: ["Up to 192 GB HBM3e", "Large-model workloads", "Training and inference", "Configuration details on request"], counts: [1, 2, 4, 8] },
    { id: "h200", name: "NVIDIA H200", arch: "Hopper", img: "gpu-h200", specs: ["Up to 141 GB HBM3e", "Memory-intensive workloads", "Training and inference", "Configuration details on request"], counts: [1, 2, 4, 8] },
    { id: "h100", name: "NVIDIA H100", arch: "Hopper", img: "gpu-h100", specs: ["Up to 80 GB HBM3", "AI and accelerated computing", "Training and inference", "Configuration details on request"], counts: [1, 2, 4, 8] },
    { id: "a100", name: "NVIDIA A100", arch: "Ampere", img: "gpu-a100", specs: ["Up to 80 GB HBM3", "AI and accelerated computing", "Training and inference", "Configuration details on request"], counts: [1, 2, 4, 8] },
    { id: "rtx6000", name: "NVIDIA RTX PRO 6000", arch: "Blackwell", img: "gpu-rtx-pro-6000", specs: ["Up to 96 GB GDDR7", "Visualization and inference", "Professional workloads", "Configuration details on request"], counts: [1, 2, 4] },
  ],
  cpu: [
    { id: "epyc", name: "AMD EPYC 9005", arch: "Zen 5", img: "cpu", specs: ["Up to 192 cores", "Pipelines and preprocessing", "Compute-intensive services", "Configuration details on request"], counts: [1, 2] },
    { id: "xeon", name: "Intel Xeon 6", arch: "Granite Rapids", img: "cpu", specs: ["Up to 128 cores", "General compute and services", "Data processing workloads", "Configuration details on request"], counts: [1, 2] },
  ],
  cluster: [
    { id: "hgx-b300", name: "HGX B300 Cluster", arch: "Blackwell Ultra", img: "cluster", specs: ["8-GPU node configurations", "Distributed AI workloads", "Data and network requirements", "Configuration details on request"], counts: [8, 16, 32] },
    { id: "hgx-h200", name: "HGX H200 Cluster", arch: "Hopper", img: "cluster", specs: ["8-GPU node configurations", "Distributed AI workloads", "Data and network requirements", "Configuration details on request"], counts: [8, 16, 32] },
  ],
  dedicated: [
    { id: "ded-b200", name: "Dedicated B200", arch: "Blackwell", img: "gpu-b200", specs: ["Dedicated configuration", "Capacity scoped to workload", "Network requirements by request", "Service terms by request"], counts: [4, 8] },
    { id: "ded-h100", name: "Dedicated H100", arch: "Hopper", img: "gpu-h100", specs: ["Dedicated configuration", "Capacity scoped to workload", "Network requirements by request", "Service terms by request"], counts: [4, 8] },
  ],
};
