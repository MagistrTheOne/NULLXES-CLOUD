import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthPageShell({
  children,
  description,
  title,
}: AuthPageShellProps) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-sm tracking-[.08em]">
          NULLXES<span className="ml-3 text-muted-foreground">CLOUD</span>
        </Link>
        <section className="mt-10 border border-line bg-white/[.015] p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[.18em] text-muted-foreground">
            Account
          </p>
          <h1 className="mt-3 font-display text-xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {children}
        </section>
      </div>
    </main>
  );
}
