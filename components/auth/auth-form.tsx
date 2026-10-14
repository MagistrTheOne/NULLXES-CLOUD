"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth/actions";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  );
  const [state, formAction, isPending] = useActionState(
    isSignUp ? signUpWithEmail : signInWithEmail,
    {},
  );
  const verificationEmail = state.email;

  if (state.verificationRequired && verificationEmail) {
    return (
      <AuthPageShell
        title="Check your email"
        description="A verification code has been requested for this address. Verify it before signing in."
      >
        <div className="mt-6 border border-line bg-white/[.025] p-4 text-sm">
          <p className="font-medium">{verificationEmail}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Check your inbox and spam folder. You can request another code if
            needed.
          </p>
        </div>
        <Link
          href="/auth/verify-email"
          onClick={() =>
            window.sessionStorage.setItem(
              "nullxes-verification-email",
              verificationEmail,
            )
          }
          className="mt-5 flex h-10 w-full items-center justify-center border border-foreground bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-80"
        >
          Enter verification code
        </Link>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already verified?{" "}
          <Link
            href="/auth/sign-in"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title={isSignUp ? "Create your account" : "Sign in"}
      description={
        isSignUp
          ? "Create an account to access your compute workspace."
          : "Sign in to access your compute workspace."
      }
    >
      <form
        action={formAction}
        onSubmit={(event) => {
          setConfirmationError(null);
          if (!isSignUp) return;
          const formData = new FormData(event.currentTarget);
          if (formData.get("password") !== formData.get("confirmPassword")) {
            event.preventDefault();
            setConfirmationError("Passwords do not match.");
          }
        }}
        className="mt-8 space-y-5"
      >
        {isSignUp && (
          <div className="space-y-2">
            <label htmlFor="name" className="text-xs text-muted-foreground">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs text-muted-foreground">
            Email
          </label>
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
          <label htmlFor="password" className="text-xs text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={isSignUp ? 8 : undefined}
              maxLength={128}
              required
              className="h-10 w-full border border-input bg-background px-3 pr-11 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {isSignUp && (
            <p className="text-[11px] text-muted-foreground">
              Use 8-128 characters.
            </p>
          )}
        </div>
        {isSignUp && (
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-xs text-muted-foreground"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                className="h-10 w-full border border-input bg-background px-3 pr-11 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="button"
                aria-label={
                  showConfirmation
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                aria-pressed={showConfirmation}
                onClick={() => setShowConfirmation((shown) => !shown)}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {showConfirmation ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
        )}
        {!isSignUp && (
          <div className="-mt-2 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
        )}
        {(state.error || confirmationError) && (
          <p role="alert" className="text-sm text-red-400">
            {state.error ?? confirmationError}
          </p>
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
    </AuthPageShell>
  );
}
