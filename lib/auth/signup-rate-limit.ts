import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { sql } from "drizzle-orm";
import { db } from "@/lib/server/db";
import { signupRateLimits } from "@/drizzle/schema";

const EMAIL_LIMIT_PER_HOUR = 3;
const IP_LIMIT_PER_HOUR = 12;

function hashIdentifier(scope: "email" | "ip", value: string): string {
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!secret) throw new Error("Signup rate limit secret is unavailable.");

  return createHmac("sha256", secret)
    .update(`${scope}:${value}`)
    .digest("hex");
}

function trustedClientIp(requestHeaders: Headers): string | null {
  if (process.env.SIGNUP_TRUSTED_PROXY_HEADER !== "true") return null;

  // The ingress must overwrite this dedicated header with the connecting client IP.
  const candidate = requestHeaders.get("x-nullxes-client-ip")?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

export async function consumeSignupRateLimit(
  email: string | null,
  requestHeaders: Headers,
): Promise<boolean> {
  const identifiers = new Map<string, number>();
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    identifiers.set(hashIdentifier("email", normalizedEmail), EMAIL_LIMIT_PER_HOUR);
  }

  const ip = trustedClientIp(requestHeaders);
  if (ip) identifiers.set(hashIdentifier("ip", ip), IP_LIMIT_PER_HOUR);
  if (identifiers.size === 0) return true;

  // Keep the table bounded without deleting active windows. The indexed cleanup is capped.
  await db.execute(sql`
    DELETE FROM signup_rate_limits
    WHERE identifier_hash IN (
      SELECT identifier_hash
      FROM signup_rate_limits
      WHERE window_started_at < now() - interval '24 hours'
      ORDER BY window_started_at
      LIMIT 100
    )
  `);

  const now = new Date();
  const rows = await db
    .insert(signupRateLimits)
    .values(
      [...identifiers].map(([identifierHash]) => ({
        identifierHash,
        windowStartedAt: now,
        attemptCount: 1,
      })),
    )
    .onConflictDoUpdate({
      target: signupRateLimits.identifierHash,
      set: {
        attemptCount: sql`CASE
          WHEN ${signupRateLimits.windowStartedAt} <= now() - interval '1 hour' THEN 1
          ELSE ${signupRateLimits.attemptCount} + 1
        END`,
        windowStartedAt: sql`CASE
          WHEN ${signupRateLimits.windowStartedAt} <= now() - interval '1 hour' THEN now()
          ELSE ${signupRateLimits.windowStartedAt}
        END`,
      },
    })
    .returning({
      identifierHash: signupRateLimits.identifierHash,
      attemptCount: signupRateLimits.attemptCount,
    });

  return rows.every(
    (row) => row.attemptCount <= (identifiers.get(row.identifierHash) ?? 0),
  );
}

