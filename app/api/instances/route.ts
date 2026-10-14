import { desc, eq } from "drizzle-orm";
import {
  computeConfigurations,
  computeInstances,
  computeResourceTypes,
  customerProfiles,
} from "@/drizzle/schema";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
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
        customerProfiles,
        eq(computeInstances.profileId, customerProfiles.id),
      )
      .innerJoin(
        computeConfigurations,
        eq(computeInstances.configurationId, computeConfigurations.id),
      )
      .innerJoin(
        computeResourceTypes,
        eq(computeConfigurations.resourceTypeId, computeResourceTypes.id),
      )
      .where(eq(customerProfiles.authUserId, user.id))
      .orderBy(desc(computeInstances.createdAt));

    return Response.json({ data: { instances } });
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
