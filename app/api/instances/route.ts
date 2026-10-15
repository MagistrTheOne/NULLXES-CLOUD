import { desc, eq } from "drizzle-orm";
import {
  computeConfigurations,
  computeInstances,
  computeResourceTypes,
} from "@/drizzle/schema";
import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  authorizeOrganization,
  ensurePersonalOrganizationForUser,
} from "@/lib/auth/organization-access";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required to access these instances.",
          },
        },
        { status: 401 },
      );
    }

    const requestedOrganizationId = new URL(request.url).searchParams.get(
      "organization_id",
    );
    if (
      requestedOrganizationId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestedOrganizationId,
      )
    ) {
      return Response.json(
        { error: { code: "ORGANIZATION_NOT_FOUND", message: "Organization not found." } },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const personal = await ensurePersonalOrganizationForUser(user.id);
    const organizationId = requestedOrganizationId ?? personal.defaultOrganizationId;
    const membership = await authorizeOrganization(
      user.id,
      organizationId,
      "instances:read",
    );
    if (!membership) {
      // Return the same response for unknown organizations and non-members.
      return Response.json(
        { error: { code: "ORGANIZATION_NOT_FOUND", message: "Organization not found." } },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const instances = await db
      .select({
        id: computeInstances.id,
        status: computeInstances.lifecycleStatus,
        configuration: computeConfigurations.displayName,
        resourceType: computeResourceTypes.displayName,
        createdAt: computeInstances.createdAt,
      })
      .from(computeInstances)
      .innerJoin(
        computeConfigurations,
        eq(computeInstances.configurationId, computeConfigurations.id),
      )
      .innerJoin(
        computeResourceTypes,
        eq(computeConfigurations.resourceTypeId, computeResourceTypes.id),
      )
      .where(eq(computeInstances.organizationId, membership.organizationId))
      .orderBy(desc(computeInstances.createdAt));

    return Response.json(
      { data: { instances } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("User instance request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      {
        error: {
          code: "INSTANCES_UNAVAILABLE",
          message: "Instances are temporarily unavailable.",
        },
      },
      { status: 500 },
    );
  }
}
