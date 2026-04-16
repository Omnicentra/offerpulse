"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useSubscription } from "@/src/providers/subscription-provider";
import { useCallback, useEffect, useSyncExternalStore } from "react";

const DISMISS_KEY = "offerpulse_connect_store_banner_dismissed";
const DISMISS_CHANGE_EVENT = "offerpulse_connect_store_banner_change";

function readDismissedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeDismissed(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener("storage", handler);
  window.addEventListener(DISMISS_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(DISMISS_CHANGE_EVENT, handler);
  };
}

function notifyDismissStorageChanged() {
  window.dispatchEvent(new Event(DISMISS_CHANGE_EVENT));
}

function clearDismissFromStorage() {
  try {
    window.localStorage.removeItem(DISMISS_KEY);
  } catch {
    // ignore
  }
  notifyDismissStorageChanged();
}

/** Matches default from `ownStore.get` insert when no row exists yet */
const DEFAULT_STORE_NAME = "My Store";

function isManualStoreConfigured(store: {
  storeUrl: string | null;
  storeName: string;
}): boolean {
  const url = store.storeUrl?.trim();
  if (url) return true;
  const name = store.storeName?.trim();
  if (name && name !== DEFAULT_STORE_NAME) return true;
  return false;
}

function isStoreConfiguredForBanner(store: {
  platform: string;
  storeUrl: string | null;
  storeName: string;
}): boolean {
  if (store.platform === "shopify") return true;
  return isManualStoreConfigured(store);
}

function shouldHideForPath(pathname: string): boolean {
  if (pathname.startsWith("/settings/store")) return true;
  if (pathname.startsWith("/onboarding/shopify")) return true;
  return false;
}

export function ConnectStoreBanner() {
  const pathname = usePathname();
  const { workspaceId } = useWorkspace();
  const { isActive, isLoading: subscriptionLoading } = useSubscription();
  const trpc = useTRPC();

  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    readDismissedFromStorage,
    () => false
  );

  const { data: store, isLoading: storeLoading } = useQuery({
    ...trpc.ownStore.get.queryOptions({ workspaceId: workspaceId! }),
    enabled: !!workspaceId && isActive,
  });

  const storeConfigured = store ? isStoreConfiguredForBanner(store) : false;

  useEffect(() => {
    if (!storeConfigured) return;
    clearDismissFromStorage();
  }, [storeConfigured]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    notifyDismissStorageChanged();
  }, []);

  if (subscriptionLoading || !isActive || !workspaceId) return null;
  if (storeLoading || !store) return null;
  if (storeConfigured) return null;
  if (shouldHideForPath(pathname)) return null;
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Connect your store"
      className="relative shrink-0 overflow-hidden border-b border-rose-200/70 bg-gradient-to-br from-rose-50/[0.92] via-white to-rose-50/50 px-4 py-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)] sm:px-6"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-3 pl-2.5 sm:flex-row sm:items-center sm:justify-between sm:pl-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-200/80 bg-white/90 text-rose-700 shadow-sm shadow-rose-900/5">
            <Store className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-rose-950">Connect your store</p>
            <p className="mt-0.5 text-sm leading-relaxed text-rose-950/75">
              Link Shopify or add your storefront details so OfferPulse can tailor recommendations and compare
              competitor promos to your catalog—not generic benchmarks alone.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:pl-4">
          <Button
            size="sm"
            className="h-9 gap-1.5 border border-rose-700/15 bg-rose-600 text-white shadow-sm shadow-rose-900/20 transition-colors hover:bg-rose-700"
            asChild
          >
            <Link href="/settings/store">Add your store</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-rose-900/45 hover:bg-rose-100/60 hover:text-rose-950"
            onClick={dismiss}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
