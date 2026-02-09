"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Plus, Search, User } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-body" />
          <input
            type="search"
            placeholder="Search competitors, changes..."
            className="h-10 w-full rounded-lg border border-border bg-bg pl-10 pr-4 text-sm placeholder:text-body/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Competitor
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
