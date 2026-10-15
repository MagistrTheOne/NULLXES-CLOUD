import { randomUUID } from "node:crypto";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { ensurePersonalOrganizationForUser } from "@/lib/auth/organization-access";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const requestId = randomUUID();
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
        { status: 401, headers: { "Cache-Control": "private, no-store", "X-Request-ID": requestId } },
      );
    }

    const profile = await ensurePersonalOrganizationForUser(user.id, requestId);

    return Response.json(
      {
        data: {
          account: {
            id: profile.profileId,
            displayName: user.name,
            role: profile.accountRole,
            defaultOrganizationId: profile.defaultOrganizationId,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          },
        },
      },
      { headers: { "Cache-Control": "private, no-store", "X-Request-ID": requestId } },
    );
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
      { status: 500, headers: { "Cache-Control": "private, no-store", "X-Request-ID": requestId } },
    );
  }
}
