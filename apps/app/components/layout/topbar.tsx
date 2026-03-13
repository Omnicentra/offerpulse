"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import Image from "next/image";
import { Search, Plus, Menu, LogOut, User as UserIcon, ChevronDown, Clock } from "lucide-react";
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
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useSubscription } from "@/src/providers/subscription-provider";

interface TopbarProps {
  onMenuClick?: () => void;
  onAddCompetitor?: () => void;
}

export function Topbar({ onMenuClick, onAddCompetitor }: TopbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const { workspace, workspaces, setWorkspaceId, isLoading: isLoadingWorkspace } = useWorkspace();
  const { subscription, isTrialing } = useSubscription();

  const daysRemaining = isTrialing && subscription?.trialEnd
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleLogout = async () => {
    await signOut();
    posthog.reset();
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
          <Dialog open={showWorkspaceMenu} onOpenChange={setShowWorkspaceMenu}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                aria-label="Switch workspace"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white">
                  {workspace?.name?.charAt(0).toUpperCase() ?? "W"}
                </div>
                <span>
                  {isLoadingWorkspace
                    ? "Loading..."
                    : workspace?.name ?? "Select workspace"}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[320px]">
              <DialogHeader>
                <DialogTitle>Switch workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-1 py-2">
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setWorkspaceId(ws.id);
                      setShowWorkspaceMenu(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      workspace?.id === ws.id
                        ? "bg-slate-100 text-slate-900 font-medium"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                      {ws.name?.charAt(0).toUpperCase() ?? "W"}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
                {workspaces.length === 0 && !isLoadingWorkspace && (
                  <p className="py-4 text-center text-sm text-slate-500">
                    No workspaces found
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Trial indicator */}
        {isTrialing && daysRemaining > 0 && (
          <button
            onClick={() => router.push("/settings/billing")}
            className="hidden items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 lg:flex"
          >
            <Clock className="h-3.5 w-3.5" />
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left in trial
          </button>
        )}

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
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white ring-2 ring-white hover:ring-slate-200"
              aria-label="User menu"
            >
              {user?.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={40}
                  height={40}
                  className="h-full w-full object-cover object-center"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[320px]">
            <DialogHeader>
              <DialogTitle>Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-semibold text-white">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover object-center"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || "U"
                  )}
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
