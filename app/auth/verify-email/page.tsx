import type { Metadata } from "next";
import { VerificationForm } from "@/components/auth/verification-form";

export const metadata: Metadata = {
  title: "Verify your email — NULLXES Cloud",
};

export default function VerifyEmailPage() {
  return <VerificationForm />;
}
