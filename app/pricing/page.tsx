import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductPage, SectionHeading } from "@/components/site/product-page";

const PRICING = [
  { category: "GPU", unit: "per GPU-hour", href: "/#compute" },
  { category: "CPU", unit: "per vCPU-hour", href: "/#compute" },
  { category: "Cluster", unit: "per node-hour", href: "/#compute" },
  { category: "Dedicated", unit: "per reserved capacity period", href: "/#compute" },
  { category: "Storage", unit: "capacity-based", href: "/storage" },
  { category: "Network", unit: "traffic-based", href: "/network" },
];

export default function PricingPage() {
  return (
    <ProductPage
      eyebrow="Commercial overview"
      title="Pricing built around your workload."
      description="Explore the resources and billing units that shape your quote. Contact our team to discuss a configuration."
    >
      <div className="space-y-12">
        <section aria-labelledby="pricing-units">
          <SectionHeading title="Resource categories" description="Pricing is provided on request and depends on the selected configuration." />
          <div className="overflow-hidden border border-line">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                <thead className="bg-white/[.035] text-[10px] uppercase tracking-[.16em] text-faint">
                  <tr><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 font-medium">Billing unit</th><th className="px-4 py-3 font-medium">Pricing</th><th className="px-4 py-3" /></tr>
                </thead>
                <tbody>
                  {PRICING.map((item) => (
                    <tr key={item.category} className="border-t border-line">
                      <th scope="row" className="px-4 py-4 font-medium">{item.category}</th>
                      <td className="px-4 py-4 text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-4 text-foreground/80">Contact for pricing</td>
                      <td className="px-4 py-4 text-right"><Link href={item.href} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">Explore <ArrowUpRight className="size-3" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium">Let’s scope your requirements.</h2>
            <p className="mt-2 text-xs text-muted-foreground">Share your workload and preferred configuration with our team.</p>
          </div>
          <a href="mailto:ceo@nullxes.com?subject=NULLXES%20Cloud%20pricing" className="inline-flex h-10 items-center justify-center border border-border px-5 text-xs font-medium transition-colors hover:bg-white/[.06]">Contact for pricing</a>
        </section>
      </div>
    </ProductPage>
  );
}
