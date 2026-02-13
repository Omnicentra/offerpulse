"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authApi } from "@/src/mock/api";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Camera,
  Lightbulb,
  Bell,
  BarChart3,
  Settings,
  CreditCard,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from "lucide-react";

interface CollapsibleSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const navigation = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Competitors", href: "/competitors", icon: Users },
  { name: "Changes", href: "/changes", icon: TrendingUp },
  { name: "Snapshots", href: "/snapshots", icon: Camera },
  { name: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Weekly Pulse", href: "/weekly-pulse", icon: BarChart3 },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function CollapsibleSidebar({ isOpen = true, onClose, isMobile = false }: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const user = authApi.getCurrentUser();

  // Load collapsed state from localStorage
  useEffect(() => {
    if (!isMobile) {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }
  }, [isMobile]);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
  };

  const handleLogout = async () => {
    await authApi.logout();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo + Collapse button */}
      <div className={cn(
        "flex h-16 items-center border-b border-slate-200 transition-all",
        isCollapsed ? "justify-center px-4" : "justify-between px-6"
      )}>
        <Link href="/overview" className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {!isCollapsed && <span className="text-lg font-semibold text-slate-900">OfferPulse</span>}
        </Link>

        {!isMobile && !isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {!isMobile && isCollapsed && (
        <div className="border-b border-slate-200 p-4">
          <button
            onClick={toggleCollapse}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Add Competitor button */}
      <div className={cn("border-b border-slate-200 p-4", isCollapsed && "px-2")}>
        {isCollapsed ? (
          <button
            onClick={() => router.push("/competitors/new")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
            aria-label="Add Competitor"
            title="Add Competitor"
          >
            <Plus className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={() => router.push("/competitors/new")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Add Competitor</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (isMobile && onClose) {
                  onClose();
                }
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-200 p-4">
        {isCollapsed ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "Demo User"}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || "demo@offerpulse.com"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white transition-transform duration-300 lg:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>

        {/* Mobile menu button */}
        {!isOpen && (
          <button
            onClick={onClose}
            className="fixed bottom-4 left-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
      </>
    );
  }

  return (
    <aside
      className={cn(
        "hidden flex-shrink-0 border-r border-slate-200 bg-white transition-all duration-200 lg:block",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
