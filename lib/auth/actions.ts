"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export type AuthActionState = {
  error?: string;
};

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

  if (!email || !isValidEmail(email) || !password) {
    return { error: "Enter a valid email address and password." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: "We couldn't sign you in with those credentials." };
  }

  redirect("/instances");
}

export async function signUpWithEmail(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = readString(formData, "name")?.trim();
  const email = readString(formData, "email")?.trim();
  const password = readString(formData, "password");

  if (!name || !email || !isValidEmail(email) || !password || password.length < 8) {
    return {
      error: "Enter your name, a valid email, and a password of at least 8 characters.",
    };
  }

  const { error } = await auth.signUp.email({ name, email, password });
  if (error) {
    return { error: "We couldn't create your account. Check your details and try again." };
  }

  redirect("/instances");
}

export async function signOut(): Promise<void> {
  const { error } = await auth.signOut();
  if (error) {
    throw new Error("Unable to sign out. Please try again.");
  }

  redirect("/");
}
