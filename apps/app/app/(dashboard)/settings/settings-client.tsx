"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetApi } from "@/src/mock/api";
import { Users, CreditCard, RefreshCw, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useTRPC } from "@/src/lib/trpc/client";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type WorkspaceSettingsRow = RouterOutputs["workspaceSettings"]["get"];

interface SettingsClientProps {
  workspaceId: string;
  initialSettings: WorkspaceSettingsRow;
}

/** UI-friendly shape for form state */
interface LocalSettings {
  defaultFrequency: "daily" | "6h" | "1h";
  defaultTrack: {
    promos: boolean;
    shipping: boolean;
    bundles: boolean;
    cart: boolean;
    deliveryReturns: boolean;
  };
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
  };
}

export function SettingsClient({
  workspaceId,
  initialSettings,
}: SettingsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<LocalSettings>(() =>
    toLocalSettings(initialSettings)
  );

  const { data: settings = initialSettings } = useQuery({
    ...trpc.workspaceSettings.get.queryOptions({ workspaceId }),
    initialData: initialSettings,
    enabled: !!workspaceId,
  });

  useEffect(() => {
    setLocalSettings(toLocalSettings(settings));
  }, [settings]);

  const updateMutation = useMutation(
    trpc.workspaceSettings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.workspaceSettings.get.queryFilter({ workspaceId })
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

  const resetMutation = useMutation({
    mutationFn: resetApi.resetDemoData,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Demo data reset",
        description: "All data has been reset to initial state.",
      });
      setResetDialogOpen(false);
    },
  });

  const handleSave = () => {
    if (!localSettings) return;
    updateMutation.mutate({
      workspaceId,
      defaultFrequency: localSettings.defaultFrequency,
      defaultTrackPromos: localSettings.defaultTrack.promos,
      defaultTrackShipping: localSettings.defaultTrack.shipping,
      defaultTrackBundles: localSettings.defaultTrack.bundles,
      defaultTrackCart: localSettings.defaultTrack.cart,
      defaultTrackDeliveryReturns: localSettings.defaultTrack.deliveryReturns,
    });
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  if (!localSettings) {
    return (
      <div>
        <PageHeader title="Settings" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your workspace settings and preferences"
      />

      {/* Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => router.push("/settings/members")}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Team Members</h3>
              <p className="mt-1 text-sm text-slate-600">Manage workspace members</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>

        <button
          onClick={() => router.push("/settings/billing")}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Billing & Plan</h3>
              <p className="mt-1 text-sm text-slate-600">View plan and usage</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      {/* Workspace Settings */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-900">Default Monitor Settings</h2>

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
                    {freq === "daily" ? "Daily" : freq === "6h" ? "Every 6h" : "Hourly"}
                  </span>
                </label>
              ))}
            </div>
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
                    checked={localSettings.defaultTrack[key as keyof typeof localSettings.defaultTrack]}
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
          <Button variant="outline" onClick={() => setLocalSettings(toLocalSettings(settings))}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <RefreshCw className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Reset Demo Data</h3>
              <p className="mt-1 text-sm text-slate-600">
                Reset all competitors, snapshots, changes, and recommendations to the initial demo state
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setResetDialogOpen(true)}
            className="flex-shrink-0"
          >
            Reset Data
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Demo Data</DialogTitle>
            <DialogDescription>
              This will delete all your current data and restore the initial demo dataset. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Resetting..." : "Reset Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
