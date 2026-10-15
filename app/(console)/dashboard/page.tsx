import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { ArrowRight, Cpu, ReceiptText, Server } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeConfigurations,
  computeInstances,
  computeResourceTypes,
  customerProfiles,
} from "@/drizzle/schema";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  let overview: {
    instanceCount: number;
    recentInstances: Array<{
      id: string;
      status: string;
      configuration: string;
      resourceType: string;
      createdAt: Date;
    }>;
  } | null = null;

  try {
    const ownerFilter = eq(customerProfiles.authUserId, user.id);
    const [countRows, recentInstances] = await Promise.all([
      db
        .select({ value: count() })
        .from(computeInstances)
        .innerJoin(
          customerProfiles,
          eq(computeInstances.profileId, customerProfiles.id),
        )
        .where(ownerFilter),
      db
        .select({
          id: computeInstances.id,
          status: computeInstances.lifecycleStatus,
          configuration: computeConfigurations.displayName,
          resourceType: computeResourceTypes.displayName,
          createdAt: computeInstances.createdAt,
        })
        .from(computeInstances)
        .innerJoin(
          customerProfiles,
          eq(computeInstances.profileId, customerProfiles.id),
        )
        .innerJoin(
          computeConfigurations,
          eq(computeInstances.configurationId, computeConfigurations.id),
        )
        .innerJoin(
          computeResourceTypes,
          eq(computeConfigurations.resourceTypeId, computeResourceTypes.id),
        )
        .where(ownerFilter)
        .orderBy(desc(computeInstances.createdAt))
        .limit(5),
    ]);

    overview = {
      instanceCount: countRows[0]?.value ?? 0,
      recentInstances,
    };
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.warn(`Console overview data unavailable (${errorName})`);
  }

  const summary = [
    {
      label: "Instance records",
      value: overview
        ? new Intl.NumberFormat("en").format(overview.instanceCount)
        : "—",
      description: overview
        ? "Lifecycle records in your account"
        : "Account data unavailable",
      icon: Server,
    },
    {
      label: "GPU inventory",
      value: "Not connected",
      description: "Provider connectivity is not established",
      icon: Cpu,
    },
    {
      label: "Usage & billing",
      value: "Unavailable",
      description: "Metering and billing are not implemented",
      icon: ReceiptText,
    },
  ];

  return (
    <div className="space-y-7 pb-8">
      <section className="grid gap-6 border-b border-border pb-7 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-end">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
            Control plane / Overview
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
            Your workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Account resources and platform capabilities, in one place.
          </p>
        </div>

        <div className="flex min-h-24 items-start gap-4 border border-border bg-card p-4 sm:p-5">
          <span
            aria-hidden="true"
            className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground"
          />
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">
              Compute provider
            </p>
            <p className="text-sm font-medium">Not connected</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Live inventory and resource controls are not available yet.
            </p>
          </div>
        </div>
      </section>

      {overview === null && (
        <p role="status" className="text-xs text-muted-foreground">
          Account records could not be loaded. Refresh the page to try again.
        </p>
      )}

      <section aria-label="Workspace summary" className="grid gap-3 md:grid-cols-3">
        {summary.map(({ label, value, description, icon: Icon }) => (
          <article key={label} className="border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                {label}
              </p>
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-5 text-xl font-medium tracking-tight sm:text-2xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <Card className="min-h-72">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base">Recent instances</CardTitle>
              <p className="text-xs text-muted-foreground">
                The latest lifecycle records attached to your account.
              </p>
            </div>
            {overview && overview.instanceCount > 0 && (
              <Link
                href="/instances"
                className="inline-flex h-8 shrink-0 items-center gap-2 border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                View all <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {overview === null ? (
              <div className="px-5 py-12 text-sm text-muted-foreground">
                Instance records are unavailable right now.
              </div>
            ) : overview.recentInstances.length === 0 ? (
              <div className="flex min-h-52 flex-col items-start justify-center gap-3 px-5 py-8 sm:px-7">
                <div>
                  <p className="text-sm font-medium">No instance records</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                    This account has no compute lifecycle records. Published catalog entries do not confirm live provider capacity.
                  </p>
                </div>
                <Link
                  href="/compute"
                  className="inline-flex h-8 items-center gap-2 border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Review catalog <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {overview.recentInstances.map((instance) => (
                  <div
                    key={instance.id}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{instance.configuration}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {instance.resourceType} · {formatDate(instance.createdAt)}
                      </p>
                    </div>
                    <Badge variant={instance.status === "failed" ? "destructive" : "outline"}>
                      {statusLabel(instance.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Compute catalog</CardTitle>
              <Cpu aria-hidden="true" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Review published configurations. Availability is not verified live capacity.
              </p>
              <Link
                href="/compute"
                className="inline-flex h-8 items-center gap-2 border border-border px-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Open catalog <ArrowRight aria-hidden="true" className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Usage &amp; billing</CardTitle>
              <Badge variant="outline">Unavailable</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-5 text-muted-foreground">
                Usage metering, balances, and charges are not implemented in this console.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
