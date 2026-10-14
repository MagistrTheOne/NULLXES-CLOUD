"use client";
import * as React from "react";
import * as G from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export const ToggleGroup = ({ className, ...p }: React.ComponentProps<typeof G.Root>) => <G.Root className={cn("flex flex-wrap gap-2", className)} {...p} />;
export const ToggleGroupItem = ({ className, ...p }: React.ComponentProps<typeof G.Item>) => (
  <G.Item className={cn("rounded-[3px] border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground data-[state=on]:border-foreground data-[state=on]:bg-[#151517] data-[state=on]:text-foreground", className)} {...p} />
);
