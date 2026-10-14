import type { Metadata } from "next";
import { ForgotPasswordForm } from "@neondatabase/auth-ui";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthUIProvider } from "@/components/auth/auth-ui-provider";

export const metadata: Metadata = {
  title: "Reset password — NULLXES Cloud",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Forgot password"
      description="Enter the email address associated with your account to request a reset link."
    >
      <div className="mt-8">
        <AuthUIProvider mode="forgot-password">
          <ForgotPasswordForm localization={{}} />
        </AuthUIProvider>
      </div>
    </AuthPageShell>
  );
}
