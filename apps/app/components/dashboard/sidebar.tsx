"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Camera,
  Lightbulb,
  Bell,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@offerpulse/lib/utils";

const navigation = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
  { name: "Competitors", href: "/dashboard/competitors", icon: Users },
  { name: "Changes", href: "/dashboard/changes", icon: Activity },
  { name: "Snapshots", href: "/dashboard/snapshots", icon: Camera },
  { name: "Recommendations", href: "/dashboard/recommendations", icon: Lightbulb },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
  { name: "Weekly Pulse", href: "/dashboard/pulse", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-ink">OfferPulse</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-body hover:bg-muted hover:text-ink"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
