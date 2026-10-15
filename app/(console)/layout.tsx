import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ConsoleNavigation } from "@/components/site/console-navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <SidebarProvider
      className="min-h-svh bg-background"
      style={{ "--sidebar-width": "15rem" } as CSSProperties}
    >
      <Sidebar
        collapsible="none"
        style={{ height: "100svh" }}
        className="sticky top-0 hidden h-svh shrink-0 border-r border-border md:flex"
      >
        <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
          <Link href="/dashboard" className="space-y-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="block text-xs font-semibold tracking-[.18em] text-sidebar-foreground">
              NULLXES CLOUD
            </span>
            <span className="block text-[10px] uppercase tracking-[.2em] text-muted-foreground">
              Console
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <ConsoleNavigation mode="sidebar" />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-xs text-muted-foreground" title={user.email}>
            {user.email}
          </p>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/settings" />}>
                <Settings aria-hidden="true" />
                <span>Account settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SignOutButton />
          <div className="mt-3 flex items-end justify-between border-t border-sidebar-border px-2 pt-3">
            <span className="font-display text-2xl leading-none text-sidebar-foreground">
              N
            </span>
            <span className="text-[9px] uppercase tracking-[.2em] text-muted-foreground">
              NULLXES CLOUD · 2026
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-screen">
        <header className="border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="text-xs font-semibold tracking-[.16em]">
              NULLXES CLOUD
            </Link>
            <SignOutButton />
          </div>
          <ConsoleNavigation mode="mobile" />
        </header>
        <div className="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
