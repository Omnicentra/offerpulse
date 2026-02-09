"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeTypeBadge } from "@/components/ui/change-type-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { StrategyBadge } from "@/components/ui/strategy-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  competitorsApi,
  snapshotsApi,
  changeEventsApi,
  recommendationsApi,
  monitorSettingsApi,
} from "@/src/mock/api";
import {
  Camera,
  ExternalLink,
  Pause,
  Play,
  Settings,
  TrendingUp,
  Lightbulb,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompetitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const competitorId = params.id as string;

  const [activeTab, setActiveTab] = useState("overview");

  const { data: competitor, isLoading: isLoadingCompetitor } = useQuery({
    queryKey: ["competitors", competitorId],
    queryFn: () => competitorsApi.get(competitorId),
  });

  const { data: snapshots, isLoading: isLoadingSnapshots } = useQuery({
    queryKey: ["snapshots", competitorId],
    queryFn: () => snapshotsApi.list(competitorId),
  });

  const { data: changes, isLoading: isLoadingChanges } = useQuery({
    queryKey: ["changeEvents", competitorId],
    queryFn: () => changeEventsApi.list({ competitorId }),
  });

  const { data: recommendations } = useQuery({
    queryKey: ["recommendations", competitorId],
    queryFn: () => recommendationsApi.list({ competitorId }),
  });

  const { data: monitorSettings } = useQuery({
    queryKey: ["monitorSettings", competitorId],
    queryFn: () => monitorSettingsApi.get(competitorId),
    enabled: !!competitorId,
  });

  const captureMutation = useMutation({
    mutationFn: () => snapshotsApi.capture(competitorId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["snapshots", competitorId] });
      queryClient.invalidateQueries({ queryKey: ["changeEvents", competitorId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", competitorId] });
      queryClient.invalidateQueries({ queryKey: ["competitors", competitorId] });

      let message = "Snapshot captured successfully";
      if (result.changeEvent) {
        message += " and a change was detected!";
      }

      toast({
        title: "Snapshot Captured",
        description: message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to capture snapshot",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) => competitorsApi.update(competitorId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors", competitorId] });
    },
  });

  if (isLoadingCompetitor) {
    return (
      <div>
        <Skeleton className="mb-8 h-12 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/competitors")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Competitors
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-semibold text-white">
              {competitor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{competitor.name}</h1>
                <Badge variant={competitor.isActive ? "default" : "secondary"}>
                  {competitor.isActive ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{competitor.domain}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {competitor.tags.map((tag) => (
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
              onClick={() => toggleActiveMutation.mutate(!competitor.isActive)}
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
              onClick={() => captureMutation.mutate()}
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
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Latest Snapshot</h2>
            {latestSnapshot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={latestSnapshot.extractedSignals.confidence} />
                    <span className="text-sm text-slate-600">
                      Captured {formatTime(latestSnapshot.capturedAt)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/snapshots/${latestSnapshot.id}`)}
                  >
                    View Details
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {latestSnapshot.extractedSignals.promoText && (
                    <div className="rounded-xl bg-purple-50 p-4">
                      <p className="text-xs font-medium text-purple-900">Promotion</p>
                      <p className="mt-1 text-sm text-purple-700">
                        {latestSnapshot.extractedSignals.promoText}
                      </p>
                    </div>
                  )}
                  {latestSnapshot.extractedSignals.shippingText && (
                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-xs font-medium text-blue-900">Shipping</p>
                      <p className="mt-1 text-sm text-blue-700">
                        {latestSnapshot.extractedSignals.shippingText}
                      </p>
                    </div>
                  )}
                  {latestSnapshot.extractedSignals.bundleText && (
                    <div className="rounded-xl bg-orange-50 p-4">
                      <p className="text-xs font-medium text-orange-900">Bundle</p>
                      <p className="mt-1 text-sm text-orange-700">
                        {latestSnapshot.extractedSignals.bundleText}
                      </p>
                    </div>
                  )}
                  {latestSnapshot.extractedSignals.cartIncentiveText && (
                    <div className="rounded-xl bg-green-50 p-4">
                      <p className="text-xs font-medium text-green-900">Cart Incentive</p>
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
                  onClick: () => captureMutation.mutate(),
                }}
              />
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-600">Total Changes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{changes?.length || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-600">Total Snapshots</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{snapshots?.length || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-600">Recommendations</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {recommendations?.filter((r) => r.status === "open").length || 0}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="changes" className="space-y-4">
          {isLoadingChanges ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : changes && changes.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
              {changes.map((change) => (
                <div key={change.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ChangeTypeBadge type={change.type} />
                        <ConfidenceBadge confidence={change.confidence} />
                        <span className="text-sm text-slate-500">{formatTime(change.detectedAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-900">{change.summary}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/changes?selected=${change.id}`)}
                    >
                      View Details
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
          {isLoadingSnapshots ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : snapshots && snapshots.length > 0 ? (
            <div className="grid gap-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge confidence={snapshot.extractedSignals.confidence} />
                      <span className="text-sm text-slate-600">
                        {new Date(snapshot.capturedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {snapshot.extractedSignals.promoText ||
                        snapshot.extractedSignals.shippingText ||
                        "No key signals detected"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/snapshots/${snapshot.id}`)}
                  >
                    View
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
                onClick: () => captureMutation.mutate(),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StrategyBadge strategy={rec.strategy} />
                        <Badge variant={rec.status === "open" ? "default" : "secondary"}>
                          {rec.status}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-slate-900">{rec.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{rec.rationale}</p>
                      <div className="mt-2 flex gap-4 text-xs text-slate-500">
                        <span>Impact: {rec.impact}/10</span>
                        <span>Effort: {rec.effort}/10</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/recommendations")}
                    >
                      Manage
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
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Monitor Settings</h2>
            {monitorSettings ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Capture Frequency</p>
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
                    {monitorSettings.track.promos && <Badge>Promotions</Badge>}
                    {monitorSettings.track.shipping && <Badge>Shipping</Badge>}
                    {monitorSettings.track.bundles && <Badge>Bundles</Badge>}
                    {monitorSettings.track.cart && <Badge>Cart Incentives</Badge>}
                    {monitorSettings.track.deliveryReturns && <Badge>Delivery & Returns</Badge>}
                  </div>
                </div>
              </div>
            ) : (
              <Skeleton className="h-32" />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
