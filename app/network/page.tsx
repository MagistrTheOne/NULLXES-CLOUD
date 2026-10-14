import Link from "next/link";
import { ArrowRight, Cable, Globe2, Network as NetworkIcon } from "lucide-react";
import { ProductPage, SectionHeading } from "@/components/site/product-page";

const NETWORK_CONCEPTS = [
  { icon: NetworkIcon, name: "Private connectivity", description: "Private communication paths for compute resources and workloads.", unit: "Private networking" },
  { icon: Globe2, name: "Public traffic", description: "Inbound and outbound traffic for services and data workflows.", unit: "Traffic-based pricing" },
  { icon: Cable, name: "High-speed fabric", description: "Inter-node networking for distributed compute workloads.", unit: "Configuration-based pricing" },
];

export default function NetworkPage() {
  return (
    <ProductPage
      eyebrow="Infrastructure"
      title="Networking for connected compute."
      description="Plan the connectivity model around your compute resources, workloads, and data flows."
    >
      <div className="space-y-10">
        <section>
          <SectionHeading title="Connectivity categories" description="Explore networking options for private workloads, public traffic, and distributed compute." />
          <div className="grid gap-3 md:grid-cols-3">
            {NETWORK_CONCEPTS.map(({ icon: Icon, name, description, unit }) => (
              <article key={name} className="border border-line bg-white/[.015] p-5">
                <Icon className="size-5 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="mt-6 text-sm font-medium">{name}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{description}</p>
                <p className="mt-5 border-t border-line pt-4 text-[11px] text-faint">{unit}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="grid gap-6 border-t border-line pt-7 md:grid-cols-2">
          <div><h2 className="text-xs font-medium uppercase tracking-[.12em]">Traffic and bandwidth</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Traffic requirements vary by workload. Share your expected data flows to discuss a suitable configuration.</p></div>
          <div><h2 className="text-xs font-medium uppercase tracking-[.12em]">Pricing</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Network pricing depends on the selected configuration and usage.</p><Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-xs text-foreground underline underline-offset-4">Explore pricing <ArrowRight className="size-3" /></Link></div>
        </section>
      </div>
    </ProductPage>
  );
}
