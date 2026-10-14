import { and, eq, gt, lte, or, isNull } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { pricingVersions } from "@/drizzle/schema";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const now = new Date();
    const pricing = await db
      .select({
        id: pricingVersions.id,
        productCategory: pricingVersions.productCategory,
        billingUnit: pricingVersions.billingUnit,
        currency: pricingVersions.currency,
        rate: pricingVersions.rate,
        effectiveFrom: pricingVersions.effectiveFrom,
        effectiveUntil: pricingVersions.effectiveUntil,
        version: pricingVersions.version,
      })
      .from(pricingVersions)
      .where(
        and(
          eq(pricingVersions.publicationStatus, "published"),
          lte(pricingVersions.effectiveFrom, now),
          or(
            isNull(pricingVersions.effectiveUntil),
            gt(pricingVersions.effectiveUntil, now),
          ),
        ),
      )
      .orderBy(
        pricingVersions.productCategory,
        pricingVersions.billingUnit,
        pricingVersions.currency,
      );

    return Response.json({ data: { pricing } });
  } catch (error) {
    console.error("Published pricing request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      {
        error: {
          code: "PRICING_UNAVAILABLE",
          message: "Pricing information is temporarily unavailable.",
        },
      },
      { status: 500 },
    );
  }
}
