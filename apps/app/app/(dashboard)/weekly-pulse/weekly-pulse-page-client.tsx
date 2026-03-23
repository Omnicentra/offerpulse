"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChangeTypeBadge } from "@/components/ui/change-type-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { StrategyBadge } from "@/components/ui/strategy-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/src/lib/trpc/client";
import { BarChart3, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type PulsesList = RouterOutputs["weeklyPulse"]["list"];
type CurrentPulse = RouterOutputs["weeklyPulse"]["get"];
type CompetitorsList = RouterOutputs["competitors"]["list"];

function formatWeekRange(weekOf: string | Date) {
  const start = new Date(weekOf);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export interface WeeklyPulsePageClientProps {
  workspaceId: string;
  initialPulses: PulsesList;
  initialCurrentPulse: CurrentPulse | null;
  initialCompetitors: CompetitorsList;
  /** Week ISO string resolved on the server (URL param or most recent). */
  initialWeekIso: string;
}

export function WeeklyPulsePageClient({
  workspaceId,
  initialPulses,
  initialCurrentPulse,
  initialCompetitors,
  initialWeekIso,
}: WeeklyPulsePageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const trpc = useTRPC();

  const [manualSelection, setManualSelection] = useState<string>("");

  const selectedWeekOf =
    manualSelection ||
    initialWeekIso ||
    (initialPulses.length > 0
      ? new Date(initialPulses[0].weekOf).toISOString()
      : "");

  const { data: pulses = initialPulses } = useQuery({
    ...trpc.weeklyPulse.list.queryOptions({ workspaceId }),
    initialData: initialPulses,
    enabled: !!workspaceId,
  });

  const { data: currentPulse, isPending: isPulsePending } = useQuery({
    ...trpc.weeklyPulse.get.queryOptions(
      { workspaceId, weekOf: selectedWeekOf },
      { enabled: !!workspaceId && !!selectedWeekOf }
    ),
    initialData:
      selectedWeekOf === initialWeekIso && initialCurrentPulse
        ? initialCurrentPulse
        : undefined,
  });

  const { data: competitors = initialCompetitors } = useQuery({
    ...trpc.competitors.list.queryOptions({ workspaceId }),
    initialData: initialCompetitors,
    enabled: !!workspaceId,
  });

  const handleShare = () => {
    const url = `${window.location.origin}/weekly-pulse?week=${encodeURIComponent(selectedWeekOf)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Weekly pulse link copied to clipboard",
    });
  };

  if (!pulses || pulses.length === 0) {
    return (
      <div>
        <PageHeader title="Weekly Pulse" />
        <EmptyState
          icon={BarChart3}
          title="No weekly reports yet"
          description="Weekly pulse reports will appear here as data is collected"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Weekly Pulse"
        description="Your weekly competitive intelligence report"
        action={
          <div className="flex gap-3">
            <Select value={selectedWeekOf} onValueChange={setManualSelection}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {pulses.map((pulse) => {
                  const iso = new Date(pulse.weekOf).toISOString();
                  return (
                    <SelectItem key={iso} value={iso}>
                      {formatWeekRange(pulse.weekOf)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        }
      />

      {isPulsePending && !currentPulse && (
        <Skeleton className="h-96 rounded-2xl" />
      )}

      {currentPulse && (
        <>
          {/* Week Header */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              Week of {formatWeekRange(currentPulse.weekOf)}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Competitive intelligence summary for this week
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Total Changes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{currentPulse.totals.changes}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Promos</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">{currentPulse.totals.promos}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Shipping</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{currentPulse.totals.shipping}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Bundles</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{currentPulse.totals.bundles}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Cart</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{currentPulse.totals.cart}</p>
            </div>
          </div>

          {/* Highlights */}
          {currentPulse.highlights && currentPulse.highlights.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-slate-900">Key Highlights</h3>
              <div className="space-y-4">
                {currentPulse.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border-l-4 border-blue-600 bg-blue-50/50 p-4"
                  >
                    <h4 className="text-sm font-semibold text-slate-900">{highlight.title}</h4>
                    <p className="mt-1 text-sm text-slate-700">{highlight.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Competitor Moves */}
          {currentPulse.topMoves.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-6 text-lg font-semibold text-slate-900">Top Competitor Moves</h3>
              <div className="space-y-3">
                {currentPulse.topMoves.slice(0, 5).map((change) => {
                  const competitor = competitors?.find((c) => c.id === change.competitorId);
                  return (
                    <button
                      key={change.id}
                      type="button"
                      onClick={() => router.push(`/changes?selected=${change.id}`)}
                      className="flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                        {competitor?.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-slate-900">
                            {competitor?.name || "Unknown"}
                          </p>
                          <ChangeTypeBadge type={change.type} />
                          <ConfidenceBadge confidence={change.confidence} />
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{change.summary}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {currentPulse.recommendations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Recommended Actions</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/recommendations")}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {currentPulse.recommendations.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StrategyBadge strategy={rec.strategy} />
                          <span className="text-sm text-slate-600">
                            Impact: {rec.impact}/10 · Effort: {rec.effort}/10
                          </span>
                        </div>
                        <h4 className="mt-2 text-sm font-semibold text-slate-900">{rec.title}</h4>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{rec.rationale}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              This report was automatically generated based on detected competitor activity. Review
              recommendations and take action in the{" "}
              <button
                type="button"
                onClick={() => router.push("/recommendations")}
                className="font-medium text-blue-600 hover:underline"
              >
                Recommendations
              </button>{" "}
              section.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
