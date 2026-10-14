"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ARTICLES = [
  {
    id: "overview",
    title: "Platform overview",
    group: "Getting started",
    paragraphs: [
      "NULLXES CLOUD brings compute, storage, and networking into one platform experience for AI, robotics, and high-performance workloads.",
      "Explore the product categories to compare configurations, review pricing units, and discuss workload requirements with our team.",
    ],
  },
  {
    id: "compute",
    title: "Compute catalog",
    group: "Products",
    paragraphs: [
      "The compute catalog groups GPU, CPU, cluster, and dedicated configurations by workload type.",
      "Use Configure on a catalog item to prepare a configuration summary and request a quote.",
    ],
  },
  {
    id: "storage-network",
    title: "Storage and networking",
    group: "Products",
    paragraphs: [
      "Storage categories include block volumes, object storage, and shared storage. Networking categories cover private connectivity, public traffic, and high-speed fabric.",
      "For pricing and configuration details, contact the NULLXES CLOUD team.",
    ],
  },
  {
    id: "security",
    title: "Security practices",
    group: "Platform",
    paragraphs: [
      "Keep credentials and API keys in server-side secret stores. Never include secrets in browser code, public repositories, or support requests.",
      "Use least-privilege access and rotate credentials if they may have been exposed.",
    ],
  },
];

export function DocsWorkspace() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(ARTICLES[0].id);
  const visibleArticles = useMemo(
    () => ARTICLES.filter((article) => `${article.title} ${article.group}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const selectedArticle = ARTICLES.find((article) => article.id === selectedId) ?? ARTICLES[0];

  return (
    <div className="grid min-h-[520px] border border-line lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-white/[.015] p-4 lg:border-b-0 lg:border-r">
        <label className="relative block">
          <span className="sr-only">Search documentation</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search docs" className="h-9 pl-9" />
        </label>
        <nav aria-label="Documentation sections" className="mt-6 space-y-5">
          {["Getting started", "Products", "Platform"].map((group) => {
            const entries = visibleArticles.filter((article) => article.group === group);
            if (!entries.length) return null;
            return (
              <div key={group}>
                <h2 className="mb-2 px-2 text-[9px] uppercase tracking-[.18em] text-faint">{group}</h2>
                <ul className="space-y-1">
                  {entries.map((article) => (
                    <li key={article.id}>
                      <button type="button" onClick={() => setSelectedId(article.id)} aria-current={selectedId === article.id ? "page" : undefined} className={`w-full px-2 py-2 text-left text-xs transition-colors ${selectedId === article.id ? "bg-white/[.07] text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{article.title}</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {visibleArticles.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No sections match that search.</p>}
        </nav>
      </aside>

      <article className="min-w-0 p-5 sm:p-8 lg:p-10">
        <p className="text-[10px] uppercase tracking-[.18em] text-faint">{selectedArticle.group}</p>
        <h2 className="mt-3 font-display text-xl sm:text-2xl">{selectedArticle.title}</h2>
        <div className="mt-5 max-w-2xl space-y-4 text-xs leading-6 text-muted-foreground">
          {selectedArticle.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div id="access" className="mt-9 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-medium">Need account assistance?</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">Contact our team for help with your documentation access.</p>
          </div>
          <a href="mailto:ceo@nullxes.com?subject=NULLXES%20Cloud%20documentation%20access" className="inline-flex h-9 items-center justify-center border border-border px-4 text-xs transition-colors hover:bg-white/[.06]">Contact support</a>
        </div>
        <div className="mt-8">
          <p className="mb-2 text-[10px] uppercase tracking-[.16em] text-faint">Quick start</p>
          <pre className="overflow-x-auto border border-line bg-[#080809] p-4 text-[11px] leading-5 text-[#cfcfd2]"><code>{`npm install\nnpm run dev`}</code></pre>
        </div>
      </article>
    </div>
  );
}
