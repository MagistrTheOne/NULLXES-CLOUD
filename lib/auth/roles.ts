import "server-only";

import { eq } from "drizzle-orm";
import { customerProfiles } from "@/drizzle/schema";
import { db } from "@/lib/server/db";

export const APPLICATION_ROLES = [
  "CEO",
  "ADMIN",
  "MANAGER",
  "VIP",
  "USER",
] as const;

export type ApplicationRole = (typeof APPLICATION_ROLES)[number];

export const INTERNAL_NOTICE_ROLES: readonly ApplicationRole[] = [
  "CEO",
  "ADMIN",
  "MANAGER",
];

export async function getApplicationRole(
  authUserId: string,
): Promise<ApplicationRole> {
  try {
    const [profile] = await db
      .select({ role: customerProfiles.role })
      .from(customerProfiles)
      .where(eq(customerProfiles.authUserId, authUserId))
      .limit(1);

    // Missing profiles fail closed to the least privileged role.
    return profile?.role ?? "USER";
  } catch {
    // A missing/unavailable role column must not grant elevated access or
    // prevent the authenticated customer from opening the console.
    return "USER";
  }
}

export function canSeeInternalNotices(role: ApplicationRole): boolean {
  return INTERNAL_NOTICE_ROLES.includes(role);
}

export function hasAnyRole(
  role: ApplicationRole,
  allowedRoles: readonly ApplicationRole[],
): boolean {
  return allowedRoles.includes(role);
}
