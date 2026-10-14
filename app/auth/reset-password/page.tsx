import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@neondatabase/auth-ui";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthUIProvider } from "@/components/auth/auth-ui-provider";

export const metadata: Metadata = {
  title: "Choose a new password — NULLXES Cloud",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const hasToken =
    typeof params.token === "string" &&
    params.token.length > 0 &&
    params.token !== "INVALID_TOKEN";

  return (
    <AuthPageShell
      title={hasToken ? "Choose a new password" : "Reset link unavailable"}
      description={
        hasToken
          ? "Choose a new password for your account. Reset links expire after 15 minutes."
          : "This reset link is invalid or missing its recovery token. Request a new password reset link to continue."
      }
    >
      {hasToken ? (
        <>
          <div className="mt-8">
            <AuthUIProvider mode="reset-password">
              <ResetPasswordForm localization={{}} />
            </AuthUIProvider>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            If this link is invalid or expired,{" "}
            <Link
              href="/auth/forgot-password"
              className="text-foreground underline underline-offset-4"
            >
              request a new one
            </Link>
            .
          </p>
        </>
      ) : (
        <Link
          href="/auth/forgot-password"
          className="mt-6 flex h-10 w-full items-center justify-center border border-foreground bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-80"
        >
          Request a new reset link
        </Link>
      )}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link
          href="/auth/sign-in"
          className="text-foreground underline underline-offset-4"
        >
          Return to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
