"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeTypeBadge } from "@/components/ui/change-type-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { StrategyBadge } from "@/components/ui/strategy-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTRPC } from "@/src/lib/trpc/client";
import {
  Camera,
  ExternalLink,
  Pause,
  Play,
  TrendingUp,
  Lightbulb,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type CompetitorItem = RouterOutputs["competitors"]["get"];
type SnapshotItem = RouterOutputs["snapshots"]["list"][number];
type ChangeEventItem = RouterOutputs["changeEvents"]["list"][number];
type RecommendationItem = RouterOutputs["recommendations"]["list"][number];
type MonitorSettingsItem = RouterOutputs["monitorSettings"]["get"];

interface CompetitorDetailClientProps {
  competitorId: string;
  workspaceId: string;
  initialCompetitor: CompetitorItem | null;
  initialSnapshots: SnapshotItem[];
  initialChanges: ChangeEventItem[];
  initialRecommendations: RecommendationItem[];
  initialMonitorSettings: MonitorSettingsItem | null | undefined;
}

function formatTime(timestamp: string | Date) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
}

export function CompetitorDetailClient({
  competitorId,
  workspaceId,
  initialCompetitor,
  initialSnapshots,
  initialChanges,
  initialRecommendations,
  initialMonitorSettings,
}: CompetitorDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const [activeTab, setActiveTab] = useState("overview");

  const { data: competitor = initialCompetitor } = useQuery({
    ...trpc.competitors.get.queryOptions({ workspaceId, id: competitorId }),
    initialData: initialCompetitor ?? undefined,
    enabled: !!workspaceId && !!competitorId,
  });

  const { data: snapshots = initialSnapshots } = useQuery({
    ...trpc.snapshots.list.queryOptions({ workspaceId, competitorId }),
    initialData: initialSnapshots,
    enabled: !!workspaceId && !!competitorId,
  });

  const { data: changes = initialChanges } = useQuery({
    ...trpc.changeEvents.list.queryOptions({ workspaceId, competitorId }),
    initialData: initialChanges,
    enabled: !!workspaceId && !!competitorId,
  });

  const { data: recommendations = initialRecommendations } = useQuery({
    ...trpc.recommendations.list.queryOptions({ workspaceId, competitorId }),
    initialData: initialRecommendations,
    enabled: !!workspaceId && !!competitorId,
  });

  const { data: monitorSettings = initialMonitorSettings } = useQuery({
    ...trpc.monitorSettings.get.queryOptions({ workspaceId, competitorId }),
    initialData: initialMonitorSettings ?? undefined,
    enabled: !!workspaceId && !!competitorId,
  });

  const captureMutation = useMutation(
    trpc.snapshots.capture.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.snapshots.list.queryFilter({ workspaceId, competitorId })
        );
        void queryClient.invalidateQueries(
          trpc.changeEvents.list.queryFilter({ workspaceId, competitorId })
        );
        void queryClient.invalidateQueries(
          trpc.recommendations.list.queryFilter({ workspaceId, competitorId })
        );
        void queryClient.invalidateQueries(
          trpc.competitors.get.queryFilter({ workspaceId, id: competitorId })
        );
        toast({
          title: "Snapshot Captured",
          description: "Snapshot captured successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to capture snapshot",
          variant: "destructive",
        });
      },
    })
  );

  const toggleStatusMutation = useMutation(
    trpc.competitors.toggleStatus.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.competitors.get.queryFilter({ workspaceId, id: competitorId })
        );
      },
    })
  );

  if (!competitor) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Competitor not found"
        description="The competitor you're looking for doesn't exist."
        action={{
          label: "Back to Competitors",
          onClick: () => router.push("/competitors"),
        }}
      />
    );
  }

  const latestSnapshot = snapshots?.[0];
  const tags = (competitor.tags ?? []) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-2">
          <Link href="/competitors">
            <ArrowLeft className="h-4 w-4" />
            Back to Competitors
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-semibold text-white">
              {competitor.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  {competitor.name}
                </h1>
                <Badge variant={competitor.isActive ? "default" : "secondary"}>
                  {competitor.isActive ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{competitor.domain}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(competitor.baseUrl, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Site
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toggleStatusMutation.mutate({ workspaceId, id: competitorId })
              }
              disabled={toggleStatusMutation.isPending}
              className="gap-2"
            >
              {competitor.isActive ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
            <Button
              onClick={() =>
                captureMutation.mutate({ workspaceId, competitorId })
              }
              disabled={captureMutation.isPending}
              className="gap-2"
            >
              {captureMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  Capture Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Latest Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Latest Snapshot
            </h2>
            {latestSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge
                      confidence={latestSnapshot.extractedSignals.confidence}
                    />
                    <span className="text-sm text-slate-600">
                      Captured {formatTime(latestSnapshot.capturedAt)}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/snapshots/${latestSnapshot.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {latestSnapshot.extractedSignals.promoText && (
                    <div className="rounded-xl bg-purple-50 p-4">
                      <p className="text-xs font-medium text-purple-900">
                        Promotion
                      </p>
                      <p className="mt-1 text-sm text-purple-700">
                        {latestSnapshot.extractedSignals.promoText}
                      </p>
                    </div>
                  )}
                  {latestSnapshot.extractedSignals.shippingText && (
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-xs font-medium text-blue-900">
                        Shipping
                      </p>
                      <p className="mt-1 text-sm text-blue-700">
                        {latestSnapshot.extractedSignals.shippingText}
                      </p>
                    </div>
                  )}
                  {latestSnapshot.extractedSignals.bundleText && (
                    <div className="rounded-xl bg-orange-50 p-4">
                      <p className="text-xs font-medium text-orange-900">
                        Bundle
                      </p>
                      <p className="mt-1 text-sm text-orange-700">
                        {latestSnapshot.extractedSignals.bundleText}
                      </p>
                    </div>
                  )}
                  {latestSnapshot.extractedSignals.cartIncentiveText && (
                    <div className="rounded-xl bg-green-50 p-4">
                      <p className="text-xs font-medium text-green-900">
                        Cart Incentive
                      </p>
                      <p className="mt-1 text-sm text-green-700">
                        {latestSnapshot.extractedSignals.cartIncentiveText}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Camera}
                title="No snapshots yet"
                description="Capture your first snapshot to start monitoring"
                action={{
                  label: "Capture Now",
                  onClick: () =>
                  captureMutation.mutate({ workspaceId, competitorId }),
                }}
              />
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-600">
                Total Changes
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {changes?.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-600">
                Total Snapshots
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {snapshots?.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-600">
                Recommendations
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {recommendations?.filter((r) => r.status === "open").length ??
                  0}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          {changes && changes.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {changes.map((change) => (
                <div key={change.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ChangeTypeBadge type={change.type} />
                        <ConfidenceBadge confidence={change.confidence} />
                        <span className="text-sm text-slate-500">
                          {formatTime(change.detectedAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">
                        {change.summary}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/changes?selected=${change.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title="No changes detected"
              description="Changes will appear here as we detect them"
            />
          )}
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-4">
          {snapshots && snapshots.length > 0 ? (
            <div className="grid gap-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge
                        confidence={snapshot.extractedSignals.confidence}
                      />
                      <span className="text-sm text-slate-600">
                        {new Date(snapshot.capturedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {snapshot.extractedSignals.promoText ??
                        snapshot.extractedSignals.shippingText ??
                        "No key signals detected"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/snapshots/${snapshot.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Camera}
              title="No snapshots yet"
              description="Capture your first snapshot"
              action={{
                label: "Capture Now",
                onClick: () =>
                  captureMutation.mutate({ workspaceId, competitorId }),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StrategyBadge strategy={rec.strategy} />
                        <Badge
                          variant={
                            rec.status === "open" ? "default" : "secondary"
                          }
                        >
                          {rec.status}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-slate-900">
                        {rec.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {rec.rationale}
                      </p>
                      <div className="mt-2 flex gap-4 text-xs text-slate-500">
                        <span>Impact: {rec.impact}/10</span>
                        <span>Effort: {rec.effort}/10</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/recommendations">Manage</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No recommendations yet"
              description="Recommendations will appear as changes are detected"
            />
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Monitor Settings
            </h2>
            {monitorSettings ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Capture Frequency
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {monitorSettings.frequency === "daily"
                      ? "Daily"
                      : monitorSettings.frequency === "6h"
                        ? "Every 6 hours"
                        : "Hourly"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Tracking</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {monitorSettings.trackPromos && (
                      <Badge>Promotions</Badge>
                    )}
                    {monitorSettings.trackShipping && (
                      <Badge>Shipping</Badge>
                    )}
                    {monitorSettings.trackBundles && (
                      <Badge>Bundles</Badge>
                    )}
                    {monitorSettings.trackCart && (
                      <Badge>Cart Incentives</Badge>
                    )}
                    {monitorSettings.trackDeliveryReturns && (
                      <Badge>Delivery & Returns</Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No monitor settings configured
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
