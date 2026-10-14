"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { isAuthApiError } from "@neondatabase/auth/next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { authClient } from "@/lib/auth/client";

type VerificationNotice = {
  kind: "error" | "success";
  text: string;
};

export function VerificationForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState<VerificationNotice | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setEmail(window.sessionStorage.getItem("nullxes-verification-email") ?? "");
  }, []);

  function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    startTransition(async () => {
      try {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: email.trim(),
          type: "email-verification",
        });
        if (error) {
          setNotice({
            kind: "error",
            text: "We couldn't send a code right now. Check the email and try again later.",
          });
          return;
        }
        setNotice({
          kind: "success",
          text: "If this address needs verification, a code has been sent.",
        });
      } catch {
        setNotice({
          kind: "error",
          text: "We couldn't send a code right now. Please try again later.",
        });
      }
    });
  }

  function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    startTransition(async () => {
      try {
        const { error } = await authClient.emailOtp.verifyEmail({
          email: email.trim(),
          otp: otp.trim(),
        });
        if (error) {
          setNotice({
            kind: "error",
            text: "That code is invalid or expired. Request a new code and try again.",
          });
          return;
        }

        window.sessionStorage.removeItem("nullxes-verification-email");
        const sessionResult = await authClient.getSession();
        if (sessionResult.data?.session) {
          router.replace("/dashboard");
          return;
        }
        setNotice({
          kind: "success",
          text: "Your email is verified. You can now sign in.",
        });
      } catch (error) {
        setNotice(
          isAuthApiError(error)
            ? {
                kind: "error",
                text:
                  error.status === 429
                    ? "Too many verification attempts. Wait a moment and try again."
                    : "That code is invalid or expired. Request a new code and try again.",
              }
            : {
                kind: "error",
                text: "We couldn't verify this email right now. Please try again.",
              },
        );
      }
    });
  }

  return (
    <AuthPageShell
      title="Verify your email"
      description="Enter the email address used for your account, then request or enter your verification code."
    >
      <div className="mt-8 space-y-6">
        <form onSubmit={requestCode} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="verification-email"
              className="text-xs text-muted-foreground"
            >
              Email
            </label>
            <input
              id="verification-email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              className="h-10 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className="h-10 w-full border border-line px-4 text-xs transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Sending..." : "Send verification code"}
          </button>
        </form>

        <form onSubmit={verifyEmail} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="verification-code"
              className="text-xs text-muted-foreground"
            >
              Verification code
            </label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(event) => setOtp(event.currentTarget.value)}
              className="h-10 w-full border border-input bg-background px-3 text-sm tracking-[.2em] outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !email.trim() || otp.length !== 6}
            className="h-10 w-full border border-foreground bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Verifying..." : "Verify email"}
          </button>
        </form>

        {notice && (
          <p
            role={notice.kind === "error" ? "alert" : "status"}
            aria-live={notice.kind === "error" ? "assertive" : "polite"}
            className={`text-sm leading-6 ${notice.kind === "error" ? "text-red-400" : "text-foreground"}`}
          >
            {notice.text}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link
            href="/auth/sign-in"
            className="text-foreground underline underline-offset-4"
          >
            Return to sign in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
