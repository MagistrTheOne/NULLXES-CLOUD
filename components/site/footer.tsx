import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex min-h-16 max-w-[1280px] flex-wrap items-center justify-between gap-6 px-5 py-4 text-[11px] text-muted-foreground sm:px-10">
        <div className="font-display text-xs tracking-[.04em] text-foreground">NULLXES ROBOTICS<span className="ml-[18px] border-l border-border pl-[18px] font-sans text-[11px] text-faint">2026</span></div>
        <div className="flex flex-wrap items-center gap-[22px]">
          <Link href="/#compute" className="hover:text-foreground">Compute</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/docs" className="hover:text-foreground">Documentation</Link>
          <a href="mailto:ceo@nullxes.com" className="border-l border-border pl-[22px] hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
