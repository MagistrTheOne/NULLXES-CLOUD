"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export const TabsList = ({ className, ...p }: React.ComponentProps<typeof T.List>) => (
  <T.List className={cn("inline-flex overflow-hidden rounded border border-border", className)} {...p} />
);
export const TabsTrigger = ({ className, ...p }: React.ComponentProps<typeof T.Trigger>) => (
  <T.Trigger className={cn("border-r border-border px-6 py-2.5 text-xs text-muted-foreground transition-colors last:border-0 hover:text-foreground data-[state=active]:bg-[#17171a] data-[state=active]:text-foreground max-sm:px-3.5", className)} {...p} />
);
export const TabsContent = T.Content;
