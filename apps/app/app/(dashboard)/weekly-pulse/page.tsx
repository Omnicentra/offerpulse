"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { weeklyPulseApi, competitorsApi } from "@/src/mock/api";
import { BarChart3, Share2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WeeklyPulsePage() {
  const router = useRouter();
  const { toast } = useToast();

  const { data: pulses, isLoading } = useQuery({
    queryKey: ["weeklyPulses"],
    queryFn: () => weeklyPulseApi.list(),
  });

  const { data: competitors } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => competitorsApi.list(),
  });

  const [selectedWeek, setSelectedWeek] = useState<string>("");

  // Set initial selected week when data loads
  useState(() => {
    if (pulses && pulses.length > 0 && !selectedWeek) {
      setSelectedWeek(pulses[0].weekOf);
    }
  });

  const currentPulse = pulses?.find((p) => p.weekOf === selectedWeek) || pulses?.[0];

  const handleShare = () => {
    const url = `${window.location.origin}/weekly-pulse?week=${selectedWeek}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Weekly pulse link copied to clipboard",
    });
  };

  const formatWeekRange = (weekOf: string) => {
    const start = new Date(weekOf);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Weekly Pulse" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

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
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {pulses.map((pulse) => (
                  <SelectItem key={pulse.weekOf} value={pulse.weekOf}>
                    {formatWeekRange(pulse.weekOf)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        }
      />

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

          {/* Top Competitor Moves */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-slate-900">Top Competitor Moves</h3>
            <div className="space-y-3">
              {currentPulse.topMoves.slice(0, 5).map((change) => {
                const competitor = competitors?.find((c) => c.id === change.competitorId);
                return (
                  <button
                    key={change.id}
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

          {/* Recommended Actions */}
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StrategyBadge strategy={rec.strategy} />
                        <span className="text-sm text-slate-600">
                          Impact: {rec.impact}/10 • Effort: {rec.effort}/10
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

          {/* Footer Note */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              This report was automatically generated based on detected competitor activity. Review
              recommendations and take action in the{" "}
              <button
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
