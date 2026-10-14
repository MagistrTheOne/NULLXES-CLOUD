"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Server } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InstanceRecord = {
  id: string;
  status: string;
  configuration: string;
  resourceType: string;
  createdAt: string;
};

type InstancesResponse = {
  data?: { instances?: InstanceRecord[] };
  error?: { message?: string };
};

function statusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function statusVariant(status: string): "secondary" | "destructive" | "outline" {
  if (status === "running") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function InstancesWorkspace() {
  const [instances, setInstances] = useState<InstanceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; needsSignIn: boolean } | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    async function loadInstances() {
      try {
        const response = await fetch("/api/instances", {
          signal: controller.signal,
          cache: "no-store",
        });
        const payload = (await response.json()) as InstancesResponse;

        if (!response.ok) {
          setError({
            message:
              response.status === 401
                ? "Your session has expired. Sign in to view your instances."
                : payload.error?.message ??
                  "Instances are temporarily unavailable. Please try again.",
            needsSignIn: response.status === 401,
          });
          return;
        }

        if (!Array.isArray(payload.data?.instances)) {
          setError({
            message: "The instance response was invalid. Please try again later.",
            needsSignIn: false,
          });
          return;
        }

        setInstances(payload.data.instances);
      } catch {
        if (controller.signal.aborted) return;
        setError({
          message: "Instances are temporarily unavailable. Please try again.",
          needsSignIn: false,
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadInstances();
    return () => controller.abort();
  }, [reloadKey]);

  const availableStatuses = useMemo(
    () => [...new Set(instances.map((instance) => instance.status))].sort(),
    [instances],
  );
  const filteredInstances = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return instances.filter((instance) => {
      const matchesStatus = status === "all" || instance.status === status;
      const matchesQuery =
        !normalizedQuery ||
        [
          instance.id,
          instance.configuration,
          instance.resourceType,
          instance.status,
        ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [instances, query, status]);
  const hasFilters = query.trim().length > 0 || status !== "all";

  return (
    <div className="space-y-5" aria-busy={isLoading}>
      <div className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search instances</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ID, configuration, or status"
            className="h-9 pl-9"
          />
        </label>
        <div className="flex items-center gap-2">
          <label htmlFor="instance-status" className="text-xs text-muted-foreground">
            Status
          </label>
          <Select value={status} onValueChange={(value) => setStatus(value ?? "all")}>
            <SelectTrigger id="instance-status" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {availableStatuses.map((instanceStatus) => (
                <SelectItem key={instanceStatus} value={instanceStatus}>
                  {statusLabel(instanceStatus)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load instances</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {error.needsSignIn ? (
                <Link href="/auth/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
              ) : (
                error.message
              )}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <Card>
          <CardContent className="space-y-4 py-5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filteredInstances.length === 0 ? (
        <Empty className="border border-border py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Server aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {hasFilters ? "No matching instances" : "No instances yet"}
            </EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? "Try adjusting your search or status filter."
                : "Your compute instances will appear here when available."}
            </EmptyDescription>
          </EmptyHeader>
          {!hasFilters && (
            <Button render={<Link href="/compute" />} variant="outline" size="sm">
              Browse published configurations
            </Button>
          )}
        </Empty>
      ) : (
        <>
          <div className="hidden border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Resource type</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-mono text-[11px]">{instance.id}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(instance.status)}>
                        {statusLabel(instance.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{instance.configuration}</TableCell>
                    <TableCell>{instance.resourceType}</TableCell>
                    <TableCell>{formatDate(instance.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 sm:hidden">
            {filteredInstances.map((instance) => (
              <Card key={instance.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="break-all font-mono text-xs">{instance.id}</p>
                    <Badge variant={statusVariant(instance.status)}>
                      {statusLabel(instance.status)}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Configuration</dt>
                      <dd className="mt-1">{instance.configuration}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Resource type</dt>
                      <dd className="mt-1">{instance.resourceType}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="mt-1">{formatDate(instance.createdAt)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
