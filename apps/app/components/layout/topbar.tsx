"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Search, Plus, Menu, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { signOut, useSession } from "@/src/server/auth/client";

interface TopbarProps {
  onMenuClick?: () => void;
  onAddCompetitor?: () => void;
}

export function Topbar({ onMenuClick, onAddCompetitor }: TopbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { data: session } = useSession();
  const user = session?.user ?? null;

  const handleLogout = async () => {
    posthog.reset();
    await signOut();
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Workspace selector */}
        <div className="hidden lg:block">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white">
              M
            </div>
            <span>My Workspace</span>
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search competitors, changes..."
            className="h-10 w-64 pl-9 lg:w-80"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500">
            /
          </kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Add competitor button */}
        <Button
          onClick={onAddCompetitor || (() => router.push("/competitors/new"))}
          className="h-10 gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Competitor</span>
        </Button>

        {/* User menu */}
        <Dialog open={showUserMenu} onOpenChange={setShowUserMenu}>
          <DialogTrigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white ring-2 ring-white hover:ring-slate-200"
              aria-label="User menu"
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[320px]">
            <DialogHeader>
              <DialogTitle>Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.name || "Demo User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || "demo@offerpulse.com"}</p>
                </div>
              </div>

              <div className="space-y-1 border-t pt-4">
                <button
                  onClick={() => {
                    router.push("/settings");
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
