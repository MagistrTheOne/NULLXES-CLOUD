import { and, eq } from "drizzle-orm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  catalogListings,
  computeConfigurations,
  computeRegions,
  computeResourceTypes,
} from "@/drizzle/schema";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export default async function ComputeCatalogPage() {
  let catalog:
    | Awaited<ReturnType<typeof loadCatalog>>
    | null = null;
  let unavailable = false;

  try {
    catalog = await loadCatalog();
  } catch (error) {
    unavailable = true;
    console.error("Console compute catalog request failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[.2em] text-muted-foreground">
          Console / Compute
        </p>
        <h1 className="text-3xl font-medium tracking-tight">Compute catalog</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Published configurations and regions from the catalog.
        </p>
      </div>

      <Alert>
        <AlertTitle>Catalog information</AlertTitle>
        <AlertDescription>
          A published listing describes a catalog configuration. It does not indicate current provider capacity or guarantee provisioning.
        </AlertDescription>
      </Alert>

      {unavailable ? (
        <Alert variant="destructive">
          <AlertTitle>Catalog unavailable</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load published configurations. Please try again later.
          </AlertDescription>
        </Alert>
      ) : catalog?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {catalog.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">
                    {item.resourceTypeName}
                  </p>
                  <CardTitle className="text-base">{item.configuration}</CardTitle>
                </div>
                <Badge variant="outline">{item.resourceType.toUpperCase()}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Published region: {item.regionName} ({item.region})
                </p>
                <div className="space-y-2">
                  <h2 className="text-xs font-medium">Specifications</h2>
                  <pre className="overflow-x-auto border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                    {JSON.stringify(item.specifications, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="border border-border py-12">
          <EmptyHeader>
            <EmptyTitle>No published configurations</EmptyTitle>
            <EmptyDescription>
              There are no published compute configurations in the catalog right now.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

async function loadCatalog() {
  return db
    .select({
      id: catalogListings.id,
      resourceType: computeResourceTypes.category,
      resourceTypeName: computeResourceTypes.displayName,
      configuration: computeConfigurations.displayName,
      specifications: computeConfigurations.specifications,
      region: computeRegions.code,
      regionName: computeRegions.displayName,
    })
    .from(catalogListings)
    .innerJoin(
      computeConfigurations,
      eq(catalogListings.configurationId, computeConfigurations.id),
    )
    .innerJoin(
      computeResourceTypes,
      eq(computeConfigurations.resourceTypeId, computeResourceTypes.id),
    )
    .innerJoin(computeRegions, eq(catalogListings.regionId, computeRegions.id))
    .where(
      and(
        eq(catalogListings.published, true),
        eq(computeConfigurations.published, true),
        eq(computeResourceTypes.published, true),
        eq(computeRegions.published, true),
      ),
    );
}
