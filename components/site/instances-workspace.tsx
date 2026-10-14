"use client";

import { useState } from "react";
import { Search, Server } from "lucide-react";
import { Input } from "@/components/ui/input";

export function InstancesWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const hasFilters = query.trim().length > 0 || status !== "all";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border border-line bg-white/[.015] p-4 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search instances</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or instance ID" className="h-9 pl-9" />
        </label>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 min-w-32 border border-input bg-background px-2.5 text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="all">All statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden border border-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead className="bg-white/[.035] text-[10px] uppercase tracking-[.15em] text-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Instance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Configuration</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <td colSpan={6} className="px-4 py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <span className="grid size-10 place-items-center border border-line bg-white/[.025] text-muted-foreground"><Server className="size-4" /></span>
                    <h2 className="mt-4 text-sm font-medium">{hasFilters ? "No matching instances" : "No instances yet"}</h2>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{hasFilters ? "Try adjusting your search or status filter." : "Your compute instances will appear here when available."}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
