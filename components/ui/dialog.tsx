"use client";
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogClose = D.Close;
export const DialogTitle = ({ className, ...p }: React.ComponentProps<typeof D.Title>) => <D.Title className={cn("font-display text-[15px]", className)} {...p} />;
export const DialogDescription = ({ className, ...p }: React.ComponentProps<typeof D.Description>) => <D.Description className={cn("mt-1 text-xs text-muted-foreground", className)} {...p} />;
export const DialogContent = ({ className, children, ...p }: React.ComponentProps<typeof D.Content>) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <D.Content className={cn("fixed left-1/2 top-1/2 z-50 w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-[#0b0b0c] p-7 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95", className)} {...p}>
      {children}
      <D.Close className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close"><X className="size-4" /></D.Close>
    </D.Content>
  </D.Portal>
);
