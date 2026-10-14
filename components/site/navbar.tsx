import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = ["Compute", "Instances", "Storage", "Network", "Pricing", "Documentation"];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-9 px-5 sm:px-10">
        <a href="#" className="whitespace-nowrap font-display text-xl">
          NULLXES<sup className="ml-0.5 align-top text-[8px]">®</sup>
          <span className="ml-5 hidden border-l border-border pl-5 text-[15px] tracking-[.12em] text-muted-foreground sm:inline">CLOUD</span>
        </a>
        <div className="ml-3 hidden gap-8 text-[12.5px] text-muted-foreground lg:flex">
          {LINKS.map((l, i) => (
            <a key={l} href="#compute" className={cn("border-b border-transparent py-[22px] transition-colors hover:text-foreground", i === 0 && "border-foreground text-foreground")}>{l}</a>
          ))}
        </div>
        <div className="flex-1" />
        <button className="hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:flex"><Globe className="size-3.5" />EN<ChevronDown className="size-3" /></button>
        <Button variant="outline" size="sm" className="px-7">Sign In</Button>
      </div>
    </nav>
  );
}
