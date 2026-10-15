import Link from "next/link";
import type { ReactNode } from "react";
import {
  Cpu,
  LayoutDashboard,
  Server,
  Settings,
} from "lucide-react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
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

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/instances", label: "Instances", icon: Server },
  { href: "/compute", label: "Compute catalog", icon: Cpu },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function ConsoleLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  return (
    <SidebarProvider className="min-h-screen bg-background">
      <Sidebar collapsible="none" className="hidden border-r border-border md:flex">
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
              <SidebarMenu>
                {navigation.map(({ href, label, icon: Icon }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton render={<Link href={href} />}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
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
          <nav aria-label="Console navigation" className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {navigation.map(({ href, label }) => (
              <Button
                key={href}
                render={<Link href={href} />}
                nativeButton={false}
                variant="ghost"
                size="sm"
                className="shrink-0"
              >
                {label}
              </Button>
            ))}
          </nav>
        </header>
        <div className="w-full px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
