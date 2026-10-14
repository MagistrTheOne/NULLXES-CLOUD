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
    { id: "b300", name: "NVIDIA B300", arch: "Blackwell Ultra", img: "gpu-b300", specs: ["Up to 288 GB HBM3e", "Highest AI performance", "Cluster options available", "Redundant configurations"], counts: [1, 2, 4, 8] },
    { id: "b200", name: "NVIDIA B200", arch: "Blackwell", img: "gpu-b200", specs: ["Up to 192 GB HBM3e", "Optimized for large models", "Multi-GPU clusters", "High availability setup"], counts: [1, 2, 4, 8] },
    { id: "h200", name: "NVIDIA H200", arch: "Hopper", img: "gpu-h200", specs: ["Up to 141 GB HBM3e", "High memory for LLMs", "Flexible cluster scaling", "Redundancy options"], counts: [1, 2, 4, 8] },
    { id: "h100", name: "NVIDIA H100", arch: "Hopper", img: "gpu-h100", specs: ["Up to 80 GB HBM3", "Proven performance", "Cluster and dedicated", "High availability setup"], counts: [1, 2, 4, 8] },
    { id: "a100", name: "NVIDIA A100", arch: "Ampere", img: "gpu-a100", specs: ["Up to 80 GB HBM3", "Cost-efficient for training", "Scalable infrastructure", "Multi-zone deployment"], counts: [1, 2, 4, 8] },
    { id: "rtx6000", name: "NVIDIA RTX PRO 6000", arch: "Blackwell", img: "gpu-rtx-pro-6000", specs: ["Up to 96 GB GDDR7", "Workstations & inference", "High clock performance", "Single or multi-GPU setups"], counts: [1, 2, 4] },
  ],
  cpu: [
    { id: "epyc", name: "AMD EPYC 9005", arch: "Zen 5", img: "cpu", specs: ["Up to 192 cores", "Pipelines & preprocessing", "High memory bandwidth", "Multi-zone deployment"], counts: [1, 2] },
    { id: "xeon", name: "Intel Xeon 6", arch: "Granite Rapids", img: "cpu", specs: ["Up to 128 cores", "General compute & services", "AMX acceleration", "High availability setup"], counts: [1, 2] },
  ],
  cluster: [
    { id: "hgx-b300", name: "HGX B300 Cluster", arch: "Blackwell Ultra", img: "cluster", specs: ["8-GPU nodes", "InfiniBand fabric", "Shared high-speed storage", "Redundant configurations"], counts: [8, 16, 32] },
    { id: "hgx-h200", name: "HGX H200 Cluster", arch: "Hopper", img: "cluster", specs: ["8-GPU nodes", "InfiniBand fabric", "Flexible node scaling", "Multi-zone deployment"], counts: [8, 16, 32] },
  ],
  dedicated: [
    { id: "ded-b200", name: "Dedicated B200", arch: "Blackwell", img: "gpu-b200", specs: ["Single-tenant hardware", "Reserved capacity", "Private networking", "SLA-backed availability"], counts: [4, 8] },
    { id: "ded-h100", name: "Dedicated H100", arch: "Hopper", img: "gpu-h100", specs: ["Single-tenant hardware", "Reserved capacity", "Private networking", "SLA-backed availability"], counts: [4, 8] },
  ],
};
