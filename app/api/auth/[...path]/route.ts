import { auth } from "@/lib/auth/server";
import { consumeSignupRateLimit } from "@/lib/auth/signup-rate-limit";

const handlers = auth.handler();
type AuthRouteContext = { params: Promise<{ path: string[] }> };

export const { GET, PUT, DELETE, PATCH } = handlers;

export async function POST(
  request: Request,
  context: AuthRouteContext,
): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname.endsWith("/sign-up/email")) {
    let email: string | null = null;
    try {
      const body: unknown = await request.clone().json();
      if (
        typeof body === "object" &&
        body !== null &&
        "email" in body &&
        typeof body.email === "string"
      ) {
        email = body.email;
      }
    } catch {
      // Let Neon Auth return its normal validation response for malformed JSON.
    }

    try {
      if (!(await consumeSignupRateLimit(email, request.headers))) {
        return Response.json(
          {
            code: "SIGNUP_RATE_LIMITED",
            message: "Too many account creation attempts. Please try again later.",
          },
          { status: 429, headers: { "Cache-Control": "no-store" } },
        );
      }
    } catch (error) {
      console.error("Signup rate limit check failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return Response.json(
        {
          code: "SIGNUP_TEMPORARILY_UNAVAILABLE",
          message: "Account creation is temporarily unavailable.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  return handlers.POST(request, context);
}
