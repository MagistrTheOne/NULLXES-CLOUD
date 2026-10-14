import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { ArrowRight, Cpu, Server } from "lucide-react";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { computeInstances, customerProfiles } from "@/drizzle/schema";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  let instanceCount: number | null = null;

  try {
    const [{ value }] = await db
      .select({ value: count() })
      .from(computeInstances)
      .innerJoin(
        customerProfiles,
        eq(computeInstances.profileId, customerProfiles.id),
      )
      .where(eq(customerProfiles.authUserId, user.id));
    instanceCount = value;
  } catch (error) {
    console.error("Console overview request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          Console / Overview
        </p>
        <h1 className="text-3xl font-medium tracking-tight">Your workspace</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the resources and published configurations associated with your account.
        </p>
      </div>

      {instanceCount === null && (
        <Alert variant="destructive">
          <AlertTitle>Overview unavailable</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load your instance records. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Instance records</CardTitle>
            <Server aria-hidden="true" className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-medium tabular-nums">
              {instanceCount === null ? "Unavailable" : instanceCount}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Records tracked for your account
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Usage &amp; billing</CardTitle>
            <Badge variant="outline">Not available</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Usage and billing details are not available in the console.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Explore your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open your instance records or review published compute configurations.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Server aria-hidden="true" className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Instances</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                View lifecycle records for your account.
              </p>
              <Button render={<Link href="/instances" />} variant="outline" size="sm">
                View <ArrowRight aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <Cpu aria-hidden="true" className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Compute catalog</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Review configurations published in the catalog.
              </p>
              <Button render={<Link href="/compute" />} variant="outline" size="sm">
                Browse <ArrowRight aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
