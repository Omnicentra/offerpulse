"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreDetailsForm } from "./store-details-form";
import { ProductsTable } from "./products-table";
import { PromosTable } from "./promos-table";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { useTRPC } from "@/src/lib/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

function SyncNowButton({ workspaceId }: { workspaceId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const syncMutation = useMutation(
    trpc.shopify.triggerSync.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.ownStore.get.queryFilter({ workspaceId }));
        toast({ title: "Sync started", description: "Products will sync in the background." });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message ?? "Failed to start sync", variant: "destructive" });
      },
    })
  );
  return (
    <Button
      variant="outline"
      onClick={() => syncMutation.mutate({ workspaceId })}
      disabled={syncMutation.isPending}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
      {syncMutation.isPending ? "Syncing..." : "Sync now"}
    </Button>
  );
}

interface StoreClientProps {
  workspaceId: string;
  initialStore: RouterOutputs["ownStore"]["get"];
  planId: string;
  isAdmin: boolean;
}

export function StoreClient({ workspaceId, initialStore, planId, isAdmin }: StoreClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [shopInput, setShopInput] = useState("");

  const { data: store } = useQuery({
    ...trpc.ownStore.get.queryOptions({ workspaceId }),
    initialData: initialStore,
    enabled: !!workspaceId,
  });

  const canUseShopify = isAdmin || planId === "growth" || planId === "agency";
  const isShopifyConnected = (store?.platform ?? initialStore.platform) === "shopify";

  const disconnectMutation = useMutation(
    trpc.shopify.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.ownStore.get.queryFilter({ workspaceId }));
        toast({ title: "Shopify disconnected", description: "Your store is now in manual mode." });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message ?? "Failed to disconnect", variant: "destructive" });
      },
    })
  );

  useEffect(() => {
    const error = searchParams.get("error");
    const shopifyConnected = searchParams.get("shopify_connected");
    if (shopifyConnected === "true") {
      toast({ title: "Shopify connected", description: "Your store is now connected. Syncing products..." });
      router.replace("/settings/store");
    } else if (error) {
      const messages: Record<string, string> = {
        shopify_not_configured: "Shopify integration is not configured.",
        missing_params: "Missing shop or workspace.",
        forbidden: "You don't have access to this workspace.",
        upgrade_required: "Upgrade to Growth or Agency to connect Shopify.",
        oauth_failed: "OAuth failed. Please try again.",
        invalid_hmac: "Invalid request signature.",
        invalid_state: "Invalid or expired state. Please try again.",
        state_expired: "Session expired. Please try again.",
        token_exchange_failed: "Failed to get access token.",
      };
      toast({ title: "Error", description: messages[error] ?? error, variant: "destructive" });
      router.replace("/settings/store");
    }
  }, [searchParams, router, toast]);

  const handleConnect = () => {
    const shop = shopInput.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!shop) {
      toast({ title: "Enter your shop domain", variant: "destructive" });
      return;
    }
    const url = `/api/shopify/auth/start?shop=${encodeURIComponent(shop)}&workspaceId=${encodeURIComponent(workspaceId)}`;
    window.location.href = url;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/settings")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title="Your store"
          description="Configure your store details, products, and promotions for personalized competitor insights"
        />
      </div>

      {/* Shopify connection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Shopify integration</h2>
        {canUseShopify ? (
          isShopifyConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Connected to {store?.shopifyShopDomain ?? "Shopify"}</p>
                <p className="text-sm text-slate-600">Products sync automatically. Last synced: {store?.lastSyncedAt ? new Date(store.lastSyncedAt).toLocaleString() : "Never"}</p>
              </div>
              <div className="flex gap-2">
                <SyncNowButton workspaceId={workspaceId} />
                <Button
                  variant="outline"
                  onClick={() => disconnectMutation.mutate({ workspaceId })}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Connect your Shopify store to automatically sync products and promotions.
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="shop" className="sr-only">Shop domain</Label>
                  <Input
                    id="shop"
                    placeholder="your-store.myshopify.com"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                  />
                </div>
                <Button onClick={handleConnect}>Connect Shopify</Button>
              </div>
            </div>
          )
        ) : (
          <UpgradePrompt feature="Shopify integration" requiredPlan="Growth" />
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Store details</h2>
        <StoreDetailsForm
          workspaceId={workspaceId}
          initialStoreName={initialStore.storeName}
          initialStoreUrl={initialStore.storeUrl}
          initialCurrency={initialStore.currency}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Products</h2>
        <p className="mb-4 text-sm text-slate-600">
          Add products to compare your pricing against competitor offers. AI recommendations will use this data for personalized insights.
        </p>
        <ProductsTable workspaceId={workspaceId} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Promotions</h2>
        <p className="mb-4 text-sm text-slate-600">
          Add your active promotions so AI can compare your offers against competitor deals.
        </p>
        <PromosTable workspaceId={workspaceId} />
      </div>
    </div>
  );
}
