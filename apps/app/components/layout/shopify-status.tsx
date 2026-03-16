"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/src/lib/trpc/client";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/src/server/auth/client";
import ShopifyLogo from "@/assets/shopify.svg";

export function ShopifyStatus() {
  const { data: session } = useSession();
  const trpc = useTRPC();

  const workspaceId = session?.user?.workspaceId;

  const { data: store, isLoading } = useQuery({
    ...trpc.ownStore.get.queryOptions({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
  });

  if (isLoading || !store) {
    return null;
  }

  const isConnected = store.platform === "shopify";
  const isSyncing = store.syncStatus === "syncing";
  const hasError = store.syncStatus === "error";

  return (
    <Link
      href="/settings/store"
      className={cn(
        "mx-3 mb-4 rounded-xl border p-4 transition-all hover:shadow-sm",
        isConnected
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : "border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-slate-300",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Shopify Logo */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
          <Image src={ShopifyLogo} alt="Shopify" className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">
              Shopify
            </span>
            {isConnected ? (
              isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
              ) : hasError ? (
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              )
            ) : null}
          </div>

          <p className="mt-0.5 text-xs text-slate-600">
            {isConnected
              ? isSyncing
                ? "Syncing..."
                : hasError
                  ? "Sync error"
                  : store.lastSyncedAt
                    ? `Last synced ${formatRelativeTime(new Date(store.lastSyncedAt))}`
                    : "Connected"
              : "Connect your store"}
          </p>

          {isConnected && store.shopifyShopDomain && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {store.shopifyShopDomain}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
