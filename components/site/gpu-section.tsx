"use client";
import { useState } from "react";
import { ArrowRight, Gauge, MemoryStick, Network, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ITEMS, TABS, type Item, type Tab } from "@/lib/data";
import { Configurator } from "./configurator";

const ICONS = [MemoryStick, Gauge, Network, ShieldCheck];

export function GpuSection() {
  const [tab, setTab] = useState<Tab>("gpu");
  const [cfg, setCfg] = useState<Item | null>(null);
  const cur = TABS.find((t) => t.id === tab)!;

  return (
    <section id="compute" className="mx-auto max-w-[1280px] px-5 pb-12 pt-9 sm:px-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 className="text-base font-medium">{tab === "gpu" ? "GPU INSTANCES" : `${cur.label.toUpperCase()} INSTANCES`}</h2>
          <p className="mt-1 max-w-[560px] text-xs text-muted-foreground">{cur.sub}</p>
          <p className="mt-2 max-w-[620px] text-[10px] leading-4 text-faint">Explore compute configurations for training, inference, and distributed workloads.</p>
        </div>
        <div className="flex w-full items-center justify-between gap-6 sm:w-auto">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>{TABS.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}</TabsList>
          </Tabs>
          <a href="#compute" className="flex items-center gap-1 text-xs hover:text-muted-foreground">Compare <ArrowRight className="size-3" /></a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[441px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {ITEMS[tab].map((g) => (
          <article key={g.id} className="flex flex-col rounded-md border border-line bg-gradient-to-b from-[#0e0e10] to-[#080809] px-[18px] pb-[18px] pt-5 transition-colors hover:border-border">
            <h3 className="text-[14.5px] font-semibold">{g.name}</h3>
            <p className="mb-2 text-[11.5px] text-muted-foreground">{g.arch}</p>
            <div className="-mx-2 mb-3 h-[110px] w-[calc(100%+16px)] overflow-hidden rounded-sm border border-line bg-[#08090b] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/cluster.png')", backgroundPosition: 'center' }}>
              <div className="flex h-full items-end justify-start bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/80">{g.arch}</span>
              </div>
            </div>
            <ul className="mb-5 grid gap-[11px] text-[11px] text-[#b4b4b8]">
              {g.specs.map((s, i) => { const I = ICONS[i]; return <li key={s} className={`flex items-center gap-2.5 ${i === 0 ? "text-foreground" : ""}`}><I className="size-3 flex-none text-faint" strokeWidth={1.5} />{s}</li>; })}
            </ul>
            <Button variant="outline" className="mt-auto h-10 w-full" onClick={() => setCfg(g)}>Configure <ArrowRight className="size-3" /></Button>
          </article>
        ))}
      </div>
      <Configurator item={cfg} onClose={() => setCfg(null)} />
    </section>
  );
}
