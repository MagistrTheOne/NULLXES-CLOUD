import Image from "next/image";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  Cpu,
  CreditCard,
  ReceiptText,
  Server,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
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
  if (!user) redirect("/auth/sign-in");

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
      value: overview ? new Intl.NumberFormat("en").format(overview.instanceCount) : "—",
      detail: overview ? "Account lifecycle records" : "Account data unavailable",
      icon: Server,
    },
    {
      label: "GPU inventory",
      value: "Not connected",
      detail: "Provider connectivity is not established",
      icon: Cpu,
    },
    {
      label: "Monthly spend",
      value: "Unavailable",
      detail: "Usage metering is not implemented",
      icon: ReceiptText,
    },
    {
      label: "Available credit",
      value: "Unavailable",
      detail: "No credit balance is maintained",
      icon: CreditCard,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1760px] space-y-5 pb-8">
      <div className="flex min-h-9 items-center justify-between gap-4 border-b border-border pb-3">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          Console <span className="px-1.5 text-border">/</span> Overview
        </p>
        <Button
          render={<Link href="/settings" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="max-w-[220px] justify-start gap-2 px-1.5 text-muted-foreground"
        >
          <Avatar size="sm" className="border border-border">
            <AvatarFallback className="bg-muted text-[10px] font-medium text-foreground">
              {user.email?.slice(0, 1).toUpperCase() ?? "N"}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{user.email}</span>
        </Button>
      </div>

      <section className="relative isolate grid min-h-[190px] items-center overflow-hidden border-b border-border py-6 sm:min-h-[210px] sm:py-8">
        <Image
          src="/images/cluster.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="(min-width: 1280px) 70vw, 100vw"
          className="-z-20 object-cover object-right opacity-55"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/35"
        />
        <div className="max-w-3xl">
          <h1 className="text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">
            Your workspace
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Manage account resources and review available platform capabilities.
          </p>
        </div>

      </section>

      {overview === null && (
        <Alert variant="destructive" className="items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto]">
          <div>
            <AlertTitle>Overview unavailable</AlertTitle>
            <AlertDescription>
              We couldn&apos;t load your instance records. Try again in a moment.
            </AlertDescription>
          </div>
          <AlertAction className="static col-auto row-auto">
            <Button
              render={<Link href="/dashboard" />}
              nativeButton={false}
              variant="outline"
              size="sm"
            >
              Retry <ArrowRight aria-hidden="true" />
            </Button>
          </AlertAction>
        </Alert>
      )}

      <section
        aria-label="Workspace summary"
        className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4"
      >
        {summary.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="min-w-0">
            <CardHeader className="flex-row items-center justify-between gap-3 pb-0">
              <p className="text-[10px] uppercase tracking-[.15em] text-muted-foreground">
                {label}
              </p>
              <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="mt-4 truncate text-xl font-medium tracking-tight sm:text-2xl">
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
        <Card className="min-h-[300px]">
          <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-1">
              <CardTitle>Recent instances</CardTitle>
              <p className="text-xs text-muted-foreground">
                The latest lifecycle records attached to your account.
              </p>
            </div>
            {overview !== null && overview.instanceCount > 0 && (
              <Button
                render={<Link href="/instances" />}
                nativeButton={false}
                variant="outline"
                size="sm"
              >
                View all <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex min-h-[245px] flex-col justify-center p-0">
            {overview === null ? (
              <Empty className="min-h-[220px] border-0">
                <EmptyHeader>
                  <EmptyTitle>Records unavailable</EmptyTitle>
                  <EmptyDescription>
                    Account instance records could not be loaded.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : overview.recentInstances.length === 0 ? (
              <Empty className="min-h-[220px] border-0">
                <EmptyHeader>
                  <EmptyTitle>No instances yet</EmptyTitle>
                  <EmptyDescription>
                    Your account has no compute lifecycle records. Published configurations do not confirm live capacity.
                  </EmptyDescription>
                </EmptyHeader>
                <Button
                  render={<Link href="/compute" />}
                  nativeButton={false}
                  size="sm"
                >
                  Browse compute catalog <ArrowRight aria-hidden="true" />
                </Button>
              </Empty>
            ) : (
              <div className="divide-y divide-border">
                {overview.recentInstances.map((instance) => (
                  <div
                    key={instance.id}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {instance.configuration}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {instance.resourceType} · {formatDate(instance.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={instance.status === "failed" ? "destructive" : "outline"}
                    >
                      {statusLabel(instance.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Compute catalog</CardTitle>
              <Cpu aria-hidden="true" className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Review published configurations. Availability is not verified live capacity.
              </p>
              <Button
                render={<Link href="/compute" />}
                nativeButton={false}
                variant="outline"
                size="sm"
              >
                Open catalog <ArrowRight aria-hidden="true" />
              </Button>
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
