"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

type AuthUIMode = "forgot-password" | "reset-password";

type AuthUIProviderProps = {
  children: ReactNode;
  mode: AuthUIMode;
};

export function AuthUIProvider({ children, mode }: AuthUIProviderProps) {
  const router = useRouter();
  const [resetRequested, setResetRequested] = useState(false);
  const [baseURL, setBaseURL] = useState("");

  useEffect(() => {
    setBaseURL(window.location.origin);
  }, []);

  const safeNavigate = useCallback(
    (href: string) => {
      const target = new URL(href, window.location.origin);
      if (target.origin !== window.location.origin) {
        router.push("/auth/sign-in");
        return;
      }

      if (mode === "forgot-password" && target.pathname === "/auth/sign-in") {
        setResetRequested(true);
        return;
      }

      const recoveryQuery =
        target.pathname === "/auth/reset-password" ? target.search : "";
      router.push(`${target.pathname}${recoveryQuery}`);
    },
    [mode, router],
  );

  const safeReplace = useCallback(
    (href: string) => {
      const target = new URL(href, window.location.origin);
      if (target.origin !== window.location.origin) {
        router.replace("/auth/sign-in");
        return;
      }

      const recoveryQuery =
        target.pathname === "/auth/reset-password" ? target.search : "";
      router.replace(`${target.pathname}${recoveryQuery}`);
    },
    [router],
  );

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      basePath="/auth"
      baseURL={baseURL}
      credentials={{
        confirmPassword: true,
        forgotPassword: true,
        passwordValidation: { minLength: 8, maxLength: 128 },
      }}
      localization={{
        FORGOT_PASSWORD_EMAIL:
          "If an account exists for this address, a password reset link will be sent.",
        RESET_PASSWORD_SUCCESS:
          "Your password has been updated. You can sign in now.",
        INVALID_TOKEN:
          "This reset link is invalid or has expired. Request a new one to continue.",
      }}
      navigate={safeNavigate}
      replace={safeReplace}
      Link={Link}
    >
      {mode === "forgot-password" && resetRequested ? (
        <div role="status" aria-live="polite">
          <p className="mt-6 border border-line bg-white/[.025] p-4 text-sm leading-6">
            If an account exists for this address, a password reset link will be
            sent.
          </p>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link
              href="/auth/sign-in"
              className="text-foreground underline underline-offset-4"
            >
              Return to sign in
            </Link>
          </p>
        </div>
      ) : (
        children
      )}
    </NeonAuthUIProvider>
  );
}
