import type { ReactNode } from "react";
import { Footer } from "@/components/site/footer";
import { Navbar } from "@/components/site/navbar";

export function ProductPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[calc(100vh-128px)] max-w-[1280px] px-5 pb-16 pt-12 sm:px-10 sm:pt-16">
        <header className="mb-10 max-w-3xl border-b border-line pb-8 sm:mb-12">
          <p className="text-[10px] uppercase tracking-[.28em] text-faint">{eyebrow}</p>
          <h1 className="mt-4 font-display text-[clamp(30px,5vw,52px)] leading-tight text-foreground">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </header>
        {children}
      </main>
      <Footer />
    </>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-medium uppercase tracking-[.12em]">{title}</h2>
      {description && <p className="mt-2 max-w-3xl text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
  );
}
