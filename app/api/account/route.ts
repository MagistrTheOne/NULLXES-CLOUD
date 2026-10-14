import { eq } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { customerProfiles } from "@/drizzle/schema";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication is required to access this account.",
          },
        },
        { status: 401 },
      );
    }

    const [created] = await db
      .insert(customerProfiles)
      .values({ authUserId: user.id })
      .onConflictDoNothing({ target: customerProfiles.authUserId })
      .returning({
        id: customerProfiles.id,
        createdAt: customerProfiles.createdAt,
        updatedAt: customerProfiles.updatedAt,
      });

    const profile =
      created ??
      (
        await db
          .select({
            id: customerProfiles.id,
            createdAt: customerProfiles.createdAt,
            updatedAt: customerProfiles.updatedAt,
          })
          .from(customerProfiles)
          .where(eq(customerProfiles.authUserId, user.id))
          .limit(1)
      )[0];

    if (!profile) {
      throw new Error("Profile upsert completed without a retrievable row.");
    }

    return Response.json({
      data: {
        account: {
          id: profile.id,
          displayName: user.name,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Account profile request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      {
        error: {
          code: "ACCOUNT_UNAVAILABLE",
          message: "Account information is temporarily unavailable.",
        },
      },
      { status: 500 },
    );
  }
}
