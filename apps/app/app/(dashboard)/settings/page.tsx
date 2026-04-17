"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useSession } from "@/src/server/auth/client";
import {
  hasSubscribedWorkspaceAccess,
  PREMIUM_OPENROUTER_MODEL,
} from "@offerpulse/lib/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSpotlight } from "react-tourlight";
import { TOUR_ID } from "@/lib/dashboard-tour-analytics";
import { clearTourState, pendingTourStart$ } from "@/src/stores/tour-state";
import { Lock, Map } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreClient } from "./store/store-client";
import { AccountClient } from "./account/account-client";
import { MembersTab } from "./members-tab";
import { BillingTab } from "./billing-tab";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkspaceSettingsRow } from "@/src/lib/trpc/types";

const OPENROUTER_MODEL_OPTIONS = [
  {
    value: "openai/gpt-4.1-mini",
    label: "Balanced (recommended) — Cost-effective, good quality",
  },
  {
    value: "x-ai/grok-4.1-fast",
    label: "Fast + reasoning — Quick responses with step-by-step thinking",
  },
  {
    value: "google/gemini-3.1-pro-preview",
    label: "Best quality — Highest accuracy and reasoning (Gemini Pro)",
  },
] as const;

interface LocalSettings {
  defaultFrequency: "daily" | "6h" | "1h";
  defaultTrack: {
    promos: boolean;
    shipping: boolean;
    bundles: boolean;
    cart: boolean;
    deliveryReturns: boolean;
  };
  openRouterModel: string | null;
}

function toLocalSettings(row: WorkspaceSettingsRow): LocalSettings {
  return {
    defaultFrequency: row.defaultFrequency,
    defaultTrack: {
      promos: row.defaultTrackPromos,
      shipping: row.defaultTrackShipping,
      bundles: row.defaultTrackBundles,
      cart: row.defaultTrackCart,
      deliveryReturns: row.defaultTrackDeliveryReturns,
    },
    openRouterModel: row.openRouterModel ?? null,
  };
}

const BEST_QUALITY_TOOLTIP =
  "The Best quality model (Gemini Pro) is available on Growth and Agency plans. Upgrade your plan to unlock.";

type TabValue = "general" | "store" | "members" | "billing" | "account";

export default function SettingsPage() {
  const { workspaceId } = useWorkspace();
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { start: startTour } = useSpotlight();

  const { data: subscription, isLoading: subscriptionLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions(undefined, {
      enabled: !!session?.user,
      staleTime: 60 * 1000,
    })
  );

  useEffect(() => {
    if (sessionPending || subscriptionLoading) return;
    if (!session?.user) return;
    if (!subscription || !hasSubscribedWorkspaceAccess(subscription.status)) {
      router.replace("/settings/billing");
    }
  }, [session?.user, sessionPending, subscription, subscriptionLoading, router]);

  const planId = subscription?.planId ?? "";
  const userRole = session?.user?.role ?? "user";
  const canUseBestQualityModel = planId === "growth" || planId === "agency";

  const tabParam = searchParams.get("tab") as TabValue | null;
  const [activeTab, setActiveTab] = useState<TabValue>(tabParam ?? "general");

  const [localSettings, setLocalSettings] = useState<LocalSettings | null>(null);

  const { data: settings } = useQuery({
    ...trpc.workspaceSettings.get.queryOptions({ workspaceId: workspaceId! }),
    enabled: !!workspaceId,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (settings) {
      queueMicrotask(() => {
        setLocalSettings(toLocalSettings(settings));
      });
    }
  }, [settings]);

  useEffect(() => {
    const newTab = searchParams.get("tab") as TabValue | null;
    if (newTab && ["general", "store", "members", "billing", "account"].includes(newTab)) {
      queueMicrotask(() => {
        setActiveTab(newTab);
      });
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const tab = value as TabValue;
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.push(url.pathname + url.search, { scroll: false });
  };

  const updateMutation = useMutation(
    trpc.workspaceSettings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.workspaceSettings.get.queryFilter({
            workspaceId: workspaceId!,
          })
        );
        toast({
          title: "Settings saved",
          description: "Your workspace settings have been updated.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message ?? "Failed to update settings",
          variant: "destructive",
        });
      },
    })
  );

  const handleSave = () => {
    if (!localSettings || !workspaceId) return;
    updateMutation.mutate({
      workspaceId,
      defaultFrequency: localSettings.defaultFrequency,
      defaultTrackPromos: localSettings.defaultTrack.promos,
      defaultTrackShipping: localSettings.defaultTrack.shipping,
      defaultTrackBundles: localSettings.defaultTrack.bundles,
      defaultTrackCart: localSettings.defaultTrack.cart,
      defaultTrackDeliveryReturns: localSettings.defaultTrack.deliveryReturns,
      openRouterModel: localSettings.openRouterModel || null,
    });
  };

  const markTourSeenMutation = useMutation(
    trpc.users.markTourSeen.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.users.getProfile.queryFilter());
      },
    })
  );

  const handleRestartTour = () => {
    markTourSeenMutation.mutate(
      { seen: false },
      {
        onSuccess: () => {
          clearTourState();
          // Use the trigger observable so OnboardingTour picks it up after navigation
          pendingTourStart$.set(true);
          router.push("/");
        },
        onError: () => {
          // Fallback: start tour directly without DB update
          clearTourState();
          startTour(TOUR_ID);
          router.push("/");
        },
      }
    );
  };

  if (
    !workspaceId ||
    sessionPending ||
    (!!session?.user && subscriptionLoading)
  ) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (
    session?.user &&
    !subscriptionLoading &&
    (!subscription || !hasSubscribedWorkspaceAccess(subscription.status))
  ) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!settings || !localSettings) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your workspace settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="inline-flex h-auto w-full justify-start gap-8 border-b border-slate-200 bg-transparent p-0">
          <TabsTrigger
            value="general"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="store"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            Store
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            Members
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-0 font-medium text-slate-600 shadow-none transition-none data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:text-slate-900 data-[state=active]:shadow-none"
          >
            Account
          </TabsTrigger>
        </TabsList>

        <div className="mt-8">
          <TabsContent value="general" className="m-0 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">
                Default Monitor Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Default Capture Frequency</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["daily", "6h", "1h"] as const).map((freq) => (
                      <label
                        key={freq}
                        className={`flex cursor-pointer flex-col rounded-xl border-2 p-4 transition-colors ${
                          localSettings.defaultFrequency === freq
                            ? "border-blue-600 bg-blue-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="frequency"
                          value={freq}
                          checked={localSettings.defaultFrequency === freq}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              defaultFrequency: e.target.value as "daily" | "6h" | "1h",
                            })
                          }
                          className="sr-only"
                        />
                        <span className="text-sm font-medium text-slate-900">
                          {freq === "daily"
                            ? "Daily"
                            : freq === "6h"
                              ? "Every 6h"
                              : "Hourly"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">AI Model (OpenRouter)</Label>
                  <p className="mb-2 text-sm text-slate-600">
                    Choose based on your priority: balanced cost, faster responses with
                    reasoning, or highest-quality analysis.
                  </p>
                  <Select
                    value={localSettings.openRouterModel ?? "__default__"}
                    onValueChange={(value) =>
                      setLocalSettings({
                        ...localSettings,
                        openRouterModel: value === "__default__" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20">
                      <SelectValue placeholder="Balanced (recommended)" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENROUTER_MODEL_OPTIONS.map((opt) => {
                        const isPremium = opt.value === PREMIUM_OPENROUTER_MODEL;
                        const disabled = isPremium && !canUseBestQualityModel;
                        const itemValue = opt.value || "__default__";
                        return (
                          <SelectItem
                            key={itemValue}
                            value={itemValue}
                            disabled={disabled}
                            title={disabled ? BEST_QUALITY_TOOLTIP : undefined}
                            className={disabled ? "opacity-60" : undefined}
                          >
                            {isPremium && !canUseBestQualityModel ? (
                              <span className="inline-flex items-center gap-2">
                                <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {opt.label}
                              </span>
                            ) : (
                              opt.label
                            )}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {!canUseBestQualityModel && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      {BEST_QUALITY_TOOLTIP}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-3 block">Default Tracking</Label>
                  <div className="space-y-2">
                    {[
                      { key: "promos", label: "Promotions & Discounts" },
                      { key: "shipping", label: "Shipping Offers" },
                      { key: "bundles", label: "Bundle Deals" },
                      { key: "cart", label: "Cart Incentives" },
                      { key: "deliveryReturns", label: "Delivery & Returns" },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={
                            localSettings.defaultTrack[
                              key as keyof typeof localSettings.defaultTrack
                            ]
                          }
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              defaultTrack: {
                                ...localSettings.defaultTrack,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                        />
                        <span className="text-sm font-medium text-slate-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLocalSettings(toLocalSettings(settings))}
                >
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            {/* Product Tour */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary-tint))]">
                    <Map className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Product Tour</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Take a guided walkthrough of the dashboard and its key features
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRestartTour}
                  disabled={markTourSeenMutation.isPending}
                  className="flex-shrink-0"
                >
                  {markTourSeenMutation.isPending ? "Starting…" : "Restart Tour"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="store" className="m-0">
            <StoreClient
              workspaceId={workspaceId}
              planId={planId}
              isAdmin={userRole === "admin"}
              embedded
            />
          </TabsContent>

          <TabsContent value="members" className="m-0">
            <MembersTab workspaceId={workspaceId} />
          </TabsContent>

          <TabsContent value="billing" className="m-0">
            <BillingTab />
          </TabsContent>

          <TabsContent value="account" className="m-0">
            <AccountClient embedded />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
