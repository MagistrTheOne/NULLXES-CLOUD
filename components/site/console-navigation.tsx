"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  LayoutDashboard,
  Server,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/instances", label: "Instances", icon: Server },
  { href: "/compute", label: "Compute catalog", icon: Cpu },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function ConsoleNavigation({
  mode,
}: {
  mode: "sidebar" | "mobile";
}) {
  const pathname = usePathname();

  if (mode === "mobile") {
    return (
      <nav aria-label="Console navigation" className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {navigation.map(({ href, label }) => {
          const active = isCurrentPath(pathname, href);
          return (
            <Button
              key={href}
              render={<Link href={href} />}
              nativeButton={false}
              variant={active ? "secondary" : "ghost"}
              size="sm"
              aria-current={active ? "page" : undefined}
              className="shrink-0"
            >
              {label}
            </Button>
          );
        })}
      </nav>
    );
  }

  return (
    <SidebarMenu>
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = isCurrentPath(pathname, href);
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              render={<Link href={href} aria-current={active ? "page" : undefined} />}
              isActive={active}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
