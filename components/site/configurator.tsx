"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import type { Item } from "@/lib/data";

const TOPO = ["Single node", "Cluster", "Redundant"];
const REG = ["EU", "US", "Asia"];

function Form({ item, onClose }: { item: Item; onClose: () => void }) {
  const [n, setN] = useState(String(item.counts[0]));
  const [topo, setTopo] = useState(TOPO[0]);
  const [reg, setReg] = useState(REG[0]);
  const summary = `${n}× ${item.name} · ${topo} · ${reg}`;
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mt-4"><p className="mb-2 text-[11px] text-muted-foreground">{label}</p>{children}</div>
  );
  return (
    <>
      <DialogTitle>{item.name}</DialogTitle>
      <DialogDescription>{item.arch} · {item.specs[0]}</DialogDescription>
      <Field label="Units per node"><ToggleGroup type="single" value={n} onValueChange={(v) => v && setN(v)}>{item.counts.map((c) => <ToggleGroupItem key={c} value={String(c)}>{c}</ToggleGroupItem>)}</ToggleGroup></Field>
      <Field label="Topology"><ToggleGroup type="single" value={topo} onValueChange={(v) => v && setTopo(v)}>{TOPO.map((c) => <ToggleGroupItem key={c} value={c}>{c}</ToggleGroupItem>)}</ToggleGroup></Field>
      <Field label="Region"><ToggleGroup type="single" value={reg} onValueChange={(v) => v && setReg(v)}>{REG.map((c) => <ToggleGroupItem key={c} value={c}>{c}</ToggleGroupItem>)}</ToggleGroup></Field>
      <p className="my-6 rounded border border-line p-3.5 text-[12.5px] text-[#cfcfd2]">{summary}</p>
      <div className="flex gap-2.5">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" asChild><a href={`mailto:ceo@nullxes.com?subject=${encodeURIComponent("NULLXES Cloud quote")}&body=${encodeURIComponent(summary)}`}>Request quote</a></Button>
      </div>
    </>
  );
}

export function Configurator({ item, onClose }: { item: Item | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>{item && <Form key={item.id} item={item} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}
