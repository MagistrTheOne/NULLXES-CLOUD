import { auth } from "@/lib/auth/server";

export async function getAuthenticatedUser() {
  const { data, error } = await auth.getSession();
  if (error) {
    throw new Error("Unable to verify the current authentication session.");
  }

  return data?.user ?? null;
}
