export const dynamic = "force-dynamic";

/**
 * Public liveness endpoint. Dependency diagnostics belong in operator-run
 * checks and must not disclose internal service status to anonymous callers.
 */
export async function GET(): Promise<Response> {
  return Response.json(
    { status: "ok" },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
