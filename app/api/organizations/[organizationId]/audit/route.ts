import { desc, eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { authorizeOrganization } from "@/lib/auth/organization-access";
import { auditLogs } from "@/drizzle/schema";
import { db } from "@/lib/server/db";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_PAGE_SIZE = 100;

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
): Promise<Response> {
  const { organizationId } = await context.params;
  if (!UUID_PATTERN.test(organizationId)) {
    return Response.json(
      { error: { code: "ORGANIZATION_NOT_FOUND", message: "Organization not found." } },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const rawLimit = new URL(request.url).searchParams.get("limit");
  const limit = rawLimit === null ? 50 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
    return Response.json(
      { error: { code: "INVALID_LIMIT", message: "Limit must be an integer from 1 to 100." } },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication is required to access this audit log." } },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const membership = await authorizeOrganization(
      user.id,
      organizationId,
      "audit:read",
    );
    if (!membership) {
      return Response.json(
        { error: { code: "ORGANIZATION_NOT_FOUND", message: "Organization not found." } },
        { status: 404, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const events = await db
      .select({
        id: auditLogs.id,
        actorProfileId: auditLogs.actorProfileId,
        actorRole: auditLogs.actorRole,
        action: auditLogs.action,
        outcome: auditLogs.outcome,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        requestId: auditLogs.requestId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, membership.organizationId))
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit);

    return Response.json(
      { data: { events } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Organization audit request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: { code: "AUDIT_UNAVAILABLE", message: "The audit log is temporarily unavailable." } },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
