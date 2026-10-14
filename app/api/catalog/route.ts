import { and, eq } from "drizzle-orm";
import {
  catalogListings,
  computeConfigurations,
  computeRegions,
  computeResourceTypes,
} from "@/drizzle/schema";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const catalog = await db
      .select({
        id: catalogListings.id,
        resourceType: computeResourceTypes.category,
        resourceTypeName: computeResourceTypes.displayName,
        configuration: computeConfigurations.displayName,
        specifications: computeConfigurations.specifications,
        region: computeRegions.code,
        regionName: computeRegions.displayName,
      })
      .from(catalogListings)
      .innerJoin(
        computeConfigurations,
        eq(catalogListings.configurationId, computeConfigurations.id),
      )
      .innerJoin(
        computeResourceTypes,
        eq(computeConfigurations.resourceTypeId, computeResourceTypes.id),
      )
      .innerJoin(
        computeRegions,
        eq(catalogListings.regionId, computeRegions.id),
      )
      .where(
        and(
          eq(catalogListings.published, true),
          eq(computeConfigurations.published, true),
          eq(computeResourceTypes.published, true),
          eq(computeRegions.published, true),
        ),
      );

    return Response.json({ data: { catalog } });
  } catch (error) {
    console.error("Published catalog request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      {
        error: {
          code: "CATALOG_UNAVAILABLE",
          message: "The catalog is temporarily unavailable.",
        },
      },
      { status: 500 },
    );
  }
}
