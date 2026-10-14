import Link from "next/link";
import { ArrowRight, HardDrive, Layers3, Server } from "lucide-react";
import { ProductPage, SectionHeading } from "@/components/site/product-page";

const STORAGE_CONCEPTS = [
  { icon: HardDrive, name: "Block volumes", description: "Persistent block storage for data used by compute workloads.", attributes: ["Capacity-based options", "Performance-focused configurations", "Per-volume pricing"] },
  { icon: Layers3, name: "Object storage", description: "Flexible storage for datasets, model artifacts, and backups.", attributes: ["Object-based organization", "Designed for large datasets", "Usage-based pricing"] },
  { icon: Server, name: "Shared storage", description: "Shared data access for multi-node and collaborative workloads.", attributes: ["Shared workload data", "Cluster-oriented configurations", "Capacity-based pricing"] },
];

export default function StoragePage() {
  return (
    <ProductPage
      eyebrow="Infrastructure"
      title="Storage for every layer."
      description="Keep datasets, model artifacts, and workload data organized alongside your compute."
    >
      <div className="space-y-10">
        <section>
          <SectionHeading title="Storage categories" description="Choose the storage model that best fits your data and workload." />
          <div className="grid gap-3 md:grid-cols-3">
            {STORAGE_CONCEPTS.map(({ icon: Icon, name, description, attributes }) => (
              <article key={name} className="border border-line bg-white/[.015] p-5">
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="mt-6 text-sm font-medium">{name}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{description}</p>
                <ul className="mt-5 space-y-2 border-t border-line pt-4 text-[11px] text-faint">
                  {attributes.map((attribute) => <li key={attribute}>{attribute}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Find the right storage setup.</h2>
            <p className="mt-2 text-xs text-muted-foreground">Discuss capacity and workload requirements with our team.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs">
            <Link href="/pricing" className="inline-flex items-center gap-1 text-foreground underline underline-offset-4">Pricing <ArrowRight className="size-3" /></Link>
            <a href="mailto:ceo@nullxes.com?subject=NULLXES%20Cloud%20storage" className="text-foreground underline underline-offset-4">Contact us</a>
          </div>
        </section>
      </div>
    </ProductPage>
  );
}
