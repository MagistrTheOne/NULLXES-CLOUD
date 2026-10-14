import { ChevronDown, Globe } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const LINKS = [
  { label: "Compute", href: "/#compute" },
  { label: "Instances", href: "/instances" },
  { label: "Storage", href: "/storage" },
  { label: "Network", href: "/network" },
  { label: "Pricing", href: "/pricing" },
  { label: "Documentation", href: "/docs" },
];

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-9 px-5 sm:px-10">
        <Link href="/" className="whitespace-nowrap font-display text-xl">
          NULLXES<sup className="ml-0.5 align-top text-[8px]">®</sup>
          <span className="ml-5 hidden border-l border-border pl-5 text-[15px] tracking-[.12em] text-muted-foreground sm:inline">CLOUD</span>
        </Link>
        <div className="ml-3 hidden min-w-0 flex-1 gap-5 overflow-x-auto text-[12px] text-muted-foreground lg:flex xl:gap-7">
          {LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="whitespace-nowrap border-b border-transparent py-[22px] transition-colors hover:border-foreground hover:text-foreground">{link.label}</Link>
          ))}
        </div>
        <div className="flex-1 lg:hidden" />
        <button className="hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:flex"><Globe className="size-3.5" />EN<ChevronDown className="size-3" /></button>
        <Link href="/auth/sign-in" className={buttonVariants({ variant: "outline", size: "sm", className: "px-7" })}>Sign In</Link>
      </div>
      <div className="border-t border-line lg:hidden">
        <div className="mx-auto flex max-w-[1280px] gap-6 overflow-x-auto px-5 py-3 text-[11px] text-muted-foreground sm:px-10">
          {LINKS.map((link) => <Link key={link.label} href={link.href} className="shrink-0 hover:text-foreground">{link.label}</Link>)}
        </div>
      </div>
    </nav>
  );
}
