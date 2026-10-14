"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth/actions";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [state, formAction, isPending] = useActionState(
    isSignUp ? signUpWithEmail : signInWithEmail,
    {},
  );

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
          <h1 className="mt-3 font-display text-xl">
            {isSignUp ? "Create your account" : "Sign in"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {isSignUp
              ? "Create an account to access your compute workspace."
              : "Sign in to access your compute workspace."}
          </p>

          <form action={formAction} className="mt-8 space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs text-muted-foreground">Name</label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs text-muted-foreground">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs text-muted-foreground">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                minLength={isSignUp ? 8 : undefined}
                required
                className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {state.error && (
              <p role="alert" className="text-sm text-red-400">{state.error}</p>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="h-10 w-full border border-foreground bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {isPending
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New to NULLXES CLOUD?"}{" "}
            <Link
              href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
              className="text-foreground underline underline-offset-4"
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
