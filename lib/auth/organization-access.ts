import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  auditLogs,
  customerProfiles,
  organizationMemberships,
  organizations,
} from "@/drizzle/schema";
import type {
  OrganizationPermission,
  OrganizationRole,
} from "@/lib/auth/organization-policy";
import { canAccessOrganizationResource } from "@/lib/auth/organization-policy";
import { db } from "@/lib/server/db";

export async function ensurePersonalOrganizationForUser(
  authUserId: string,
  requestId: string = randomUUID(),
): Promise<{
  profileId: string;
  defaultOrganizationId: string;
  accountRole: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  return db.transaction(async (tx) => {
    await tx
      .insert(customerProfiles)
      .values({ authUserId })
      .onConflictDoNothing({ target: customerProfiles.authUserId });

    const [profile] = await tx
      .select({
        id: customerProfiles.id,
        role: customerProfiles.role,
        createdAt: customerProfiles.createdAt,
        updatedAt: customerProfiles.updatedAt,
      })
      .from(customerProfiles)
      .where(eq(customerProfiles.authUserId, authUserId))
      .limit(1);

    if (!profile) throw new Error("Authenticated profile could not be retrieved.");

    const [createdOrganization] = await tx
      .insert(organizations)
      .values({
        name: "Personal workspace",
        personalOwnerProfileId: profile.id,
      })
      .onConflictDoNothing({ target: organizations.personalOwnerProfileId })
      .returning({ id: organizations.id });

    const [organization] = createdOrganization
      ? [createdOrganization]
      : await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.personalOwnerProfileId, profile.id))
          .limit(1);

    if (!organization) {
      throw new Error("Personal organization could not be retrieved.");
    }

    if (createdOrganization) {
      await tx.insert(auditLogs).values({
        organizationId: organization.id,
        actorProfileId: profile.id,
        actorRole: "owner",
        action: "organization.personal_workspace.created",
        outcome: "success",
        resourceType: "organization",
        resourceId: organization.id,
        requestId,
        metadata: { source: "personal_workspace_bootstrap" },
      });
    }

    const [createdMembership] = await tx
      .insert(organizationMemberships)
      .values({
        organizationId: organization.id,
        profileId: profile.id,
        role: "owner",
      })
      .onConflictDoNothing({
        target: [
          organizationMemberships.organizationId,
          organizationMemberships.profileId,
        ],
      })
      .returning({ id: organizationMemberships.id });

    if (createdMembership) {
      await tx.insert(auditLogs).values({
        organizationId: organization.id,
        actorProfileId: profile.id,
        actorRole: "owner",
        action: "organization.personal_owner_membership.created",
        outcome: "success",
        resourceType: "organization_membership",
        resourceId: createdMembership.id,
        requestId,
        metadata: { role: "owner", source: "personal_workspace_bootstrap" },
      });
    }

    return {
      profileId: profile.id,
      defaultOrganizationId: organization.id,
      accountRole: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  });
}

export async function getOrganizationMembership(
  authUserId: string,
  organizationId: string,
): Promise<{ organizationId: string; profileId: string; role: OrganizationRole } | null> {
  const [membership] = await db
    .select({
      organizationId: organizationMemberships.organizationId,
      profileId: organizationMemberships.profileId,
      role: organizationMemberships.role,
    })
    .from(organizationMemberships)
    .innerJoin(
      customerProfiles,
      eq(organizationMemberships.profileId, customerProfiles.id),
    )
    .where(
      and(
        eq(customerProfiles.authUserId, authUserId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);

  return membership ?? null;
}

export async function authorizeOrganization(
  authUserId: string,
  organizationId: string,
  permission: OrganizationPermission,
): Promise<{ organizationId: string; profileId: string; role: OrganizationRole } | null> {
  const membership = await getOrganizationMembership(authUserId, organizationId);
  if (
    !membership ||
    !canAccessOrganizationResource(
      membership.organizationId,
      organizationId,
      membership.role,
      permission,
    )
  ) {
    return null;
  }
  return membership;
}
