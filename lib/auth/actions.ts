"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
  email?: string;
  verificationRequired?: boolean;
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function readString(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signInWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = readString(formData, "email")?.trim();
  const password = readString(formData, "password");

  if (!email || email.length > 320 || !isValidEmail(email) || !password) {
    return { error: "Enter a valid email address and password." };
  }

  try {
    const { error } = await auth.signIn.email({ email, password });
    if (error) {
      return { error: "We couldn't sign you in with those credentials." };
    }
  } catch (error) {
    console.error("Neon Auth sign-in request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { error: "Sign-in is temporarily unavailable. Please try again." };
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = readString(formData, "name")?.trim();
  const email = readString(formData, "email")?.trim();
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  if (
    !name ||
    name.length > 100 ||
    !email ||
    email.length > 320 ||
    !isValidEmail(email) ||
    !password ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH ||
    password !== confirmPassword
  ) {
    return { error: "Check your details and make sure both passwords match." };
  }

  try {
    const { data, error } = await auth.signUp.email({ name, email, password });
    if (error || !data?.user) {
      return {
        error:
          "We couldn't create your account. Check your details and try again.",
      };
    }

    if (!data.user.emailVerified) {
      return { email, verificationRequired: true };
    }
  } catch (error) {
    console.error("Neon Auth sign-up request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      error: "Account creation is temporarily unavailable. Please try again.",
    };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  try {
    const { error } = await auth.signOut();
    if (error) {
      throw new Error("Neon Auth rejected the sign-out request.");
    }
  } catch (error) {
    console.error("Neon Auth sign-out request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error("Unable to sign out. Please try again.");
  }

  redirect("/");
}
