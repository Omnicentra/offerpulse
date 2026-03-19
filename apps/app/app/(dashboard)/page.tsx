"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeTypeBadge } from "@/components/ui/change-type-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { 
  TrendingUp, 
  Users, 
  Lightbulb, 
  AlertCircle, 
  ArrowRight,
  Plus,
} from "lucide-react";

// Date formatting helper
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

export default function HomePage() {
  const router = useRouter();
  const { workspaceId } = useWorkspace();
  const trpc = useTRPC();

  const { data: competitors, isLoading: isLoadingCompetitors } = useQuery(
    trpc.competitors.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const { data: changeEvents, isLoading: isLoadingChanges } = useQuery(
    trpc.changeEvents.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const { data: recommendations, isLoading: isLoadingRecs } = useQuery(
    trpc.recommendations.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const { data: weeklyPulses } = useQuery(
    trpc.weeklyPulse.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  // Calculate stats
  const activeCompetitors = competitors?.filter((c) => c.isActive).length || 0;
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentChanges = changeEvents?.filter(
    (e) => new Date(e.detectedAt) > sevenDaysAgo
  ) || [];
  
  const highConfidenceChanges = recentChanges.filter(
    (e) => e.confidence === "high"
  ).length;
  
  const openRecommendations = recommendations?.filter(
    (r) => r.status === "open"
  ).length || 0;

  const latestChanges = changeEvents?.slice(0, 10) || [];
  const currentPulse = weeklyPulses?.[0];

  if (isLoadingCompetitors || isLoadingChanges || isLoadingRecs) {
    return (
      <div>
        <PageHeader
          title="Overview"
          description="Monitor competitor activity and track key changes"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Monitor competitor activity and track key changes"
        action={
          <Button onClick={() => router.push("/competitors/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Competitor
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Changes (7 days)"
          value={recentChanges.length}
          change={{ value: "+12%", trend: "up" }}
          icon={TrendingUp}
        />
        <StatCard
          label="High Confidence"
          value={highConfidenceChanges}
          icon={AlertCircle}
          iconColor="bg-green-100"
        />
        <StatCard
          label="Active Competitors"
          value={activeCompetitors}
          icon={Users}
          iconColor="bg-blue-100"
        />
        <StatCard
          label="Open Recommendations"
          value={openRecommendations}
          icon={Lightbulb}
          iconColor="bg-orange-100"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest Changes */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Latest Changes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/changes")}
              className="gap-1 text-blue-600 hover:text-blue-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {latestChanges.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={TrendingUp}
                  title="No changes yet"
                  description="Changes will appear here as we detect them from your competitors"
                  action={{
                    label: "Add Competitor",
                    onClick: () => router.push("/competitors/new"),
                  }}
                />
              </div>
            ) : (
              latestChanges.map((change) => {
                const competitor = competitors?.find((c) => c.id === change.competitorId);
                return (
                  <button
                    key={change.id}
                    onClick={() => router.push(`/changes?selected=${change.id}`)}
                    className="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {competitor?.name || "Unknown"}
                        </p>
                        <ChangeTypeBadge type={change.type} />
                        <ConfidenceBadge confidence={change.confidence} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                        {change.summary}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDistanceToNow(new Date(change.detectedAt))}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* This Week's Pulse */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">This Week's Pulse</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/weekly-pulse")}
              className="gap-1 text-blue-600 hover:text-blue-700"
            >
              View full report
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {currentPulse ? (
            <div className="p-6 space-y-6">
              {/* Totals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">Total Changes</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {currentPulse.totals.changes}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">Promo Changes</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {currentPulse.totals.promos}
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Key Highlights</h3>
                {currentPulse.highlights?.slice(0, 3).map((highlight, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-blue-50/50 p-4">
                    <p className="text-sm font-medium text-slate-900">{highlight.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{highlight.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                icon={TrendingUp}
                title="No pulse data yet"
                description="Weekly pulse reports will appear here"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
