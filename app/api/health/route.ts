import { sql } from "drizzle-orm";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

type CheckStatus = "ok" | "error";

async function checkService(
  name: string,
  check: () => Promise<void>,
): Promise<CheckStatus> {
  try {
    await check();
    return "ok";
  } catch (error) {
    console.error(`Neon ${name} health check failed`, {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return "error";
  }
}

export async function GET(): Promise<Response> {
  const functionUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
  if (!functionUrl) {
    throw new Error("Missing required environment variable: NEON_FUNCTION_HELLO_BASE_URL");
  }

  const [postgres, functions] = await Promise.all([
    checkService("Postgres", async () => {
      await db.execute(sql`SELECT 1`);
    }),
    checkService("Functions", async () => {
      const response = await fetch(functionUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Function returned HTTP ${response.status}`);
      }
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object"
        || payload === null
        || !("status" in payload)
        || payload.status !== "ok"
        || !("service" in payload)
        || payload.service !== "hello"
      ) {
        throw new Error("Function returned an unexpected health response");
      }
    }),
  ]);

  const services = { postgres, functions };
  const healthy = Object.values(services).every((status) => status === "ok");

  return Response.json(
    { status: healthy ? "ok" : "error", services },
    { status: healthy ? 200 : 503 },
  );
}
