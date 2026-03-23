"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StrategyBadge,
  RECOMMENDATION_STRATEGY_LABELS,
  type RecommendationStrategy,
} from "@/components/ui/strategy-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTRPC } from "@/src/lib/trpc/client";
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";
import { cn } from "@/lib/utils";

type RecommendationsList = RouterOutputs["recommendations"]["list"];
type Recommendation = RecommendationsList[number];

interface RecommendationsPageClientProps {
  workspaceId: string;
  initialRecommendations: RecommendationsList;
}

function impactAccentClass(impact: number) {
  if (impact >= 8) return "border-l-emerald-500";
  if (impact >= 5) return "border-l-amber-500";
  return "border-l-slate-300";
}

function getImpactBadgeClass(impact: number) {
  if (impact >= 8) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (impact >= 5) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getEffortBadgeClass(effort: number) {
  if (effort <= 3) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (effort <= 6) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-red-200 bg-red-50 text-red-800";
}

const STRATEGY_FILTERS = ["all", "MATCH", "COUNTER", "IGNORE", "TEST"] as const;
type StrategyFilterValue = (typeof STRATEGY_FILTERS)[number];

function checklistProgress(rec: Recommendation) {
  const total = rec.checklistItems.length;
  if (total === 0) return null;
  const done = rec.checklistItems.filter((i) => i.done).length;
  return { done, total };
}

export function RecommendationsPageClient({
  workspaceId,
  initialRecommendations,
}: RecommendationsPageClientProps) {
  const { toast } = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done" | "snoozed">("open");
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilterValue>("all");
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [snoozeDays, setSnoozeDays] = useState("7");
  const [openAccordionIds, setOpenAccordionIds] = useState<string[]>([]);

  const { data: recommendations = initialRecommendations } = useQuery({
    ...trpc.recommendations.list.queryOptions({ workspaceId }),
    initialData: initialRecommendations,
    enabled: !!workspaceId,
  });

  const updateStatusMutation = useMutation(
    trpc.recommendations.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.recommendations.list.queryFilter());
        toast({
          title: "Recommendation updated",
          description: "The recommendation status has been updated.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update recommendation",
          variant: "destructive",
        });
      },
    })
  );

  const updateChecklistMutation = useMutation(
    trpc.recommendations.updateChecklist.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.recommendations.list.queryFilter());
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update checklist",
          variant: "destructive",
        });
      },
    })
  );

  const statusCounts = useMemo(() => {
    return {
      all: recommendations.length,
      open: recommendations.filter((r) => r.status === "open").length,
      done: recommendations.filter((r) => r.status === "done").length,
      snoozed: recommendations.filter((r) => r.status === "snoozed").length,
    };
  }, [recommendations]);

  /** Rows matching the status tab (counts for strategy chips use this slice) */
  const afterStatusFilter = useMemo(() => {
    return recommendations.filter((rec) => {
      if (statusFilter === "all") return true;
      return rec.status === statusFilter;
    });
  }, [recommendations, statusFilter]);

  const strategyCounts = useMemo(() => {
    const counts: Record<StrategyFilterValue, number> = {
      all: afterStatusFilter.length,
      MATCH: 0,
      COUNTER: 0,
      IGNORE: 0,
      TEST: 0,
    };
    for (const rec of afterStatusFilter) {
      counts[rec.strategy as RecommendationStrategy] += 1;
    }
    return counts;
  }, [afterStatusFilter]);

  const filteredRecs = useMemo(() => {
    if (strategyFilter === "all") return afterStatusFilter;
    return afterStatusFilter.filter((rec) => rec.strategy === strategyFilter);
  }, [afterStatusFilter, strategyFilter]);

  const flatSorted = useMemo(() => {
    return [...filteredRecs].sort((a, b) => {
      const na = a.competitor?.name ?? "";
      const nb = b.competitor?.name ?? "";
      if (na !== nb) return na.localeCompare(nb);
      return b.impact - a.impact;
    });
  }, [filteredRecs]);

  const flatSortedIdSet = useMemo(() => new Set(flatSorted.map((r) => r.id)), [flatSorted]);

  /** Drop accordion open state for rows that are no longer in the filtered list */
  const visibleOpenAccordionIds = useMemo(
    () => openAccordionIds.filter((id) => flatSortedIdSet.has(id)),
    [openAccordionIds, flatSortedIdSet]
  );

  const handleMarkDone = (rec: Recommendation) => {
    updateStatusMutation.mutate({ workspaceId, id: rec.id, status: "done" });
  };

  const handleSnooze = () => {
    if (!selectedRec) return;
    const days = parseInt(snoozeDays, 10);
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    updateStatusMutation.mutate({
      workspaceId,
      id: selectedRec.id,
      status: "snoozed",
      snoozedUntil,
    });
    setSnoozeDialogOpen(false);
    setSelectedRec(null);
  };

  const handleChecklistToggle = (rec: Recommendation, itemId: string) => {
    const updatedChecklist = rec.checklistItems.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateChecklistMutation.mutate({
      workspaceId,
      id: rec.id,
      checklist: updatedChecklist.map(({ id, text, done }) => ({ id, text, done })),
    });
  };

  const expandAll = () => setOpenAccordionIds(flatSorted.map((r) => r.id));
  const collapseAll = () => setOpenAccordionIds([]);

  return (
    <div className="mx-auto space-y-8">
      <div className="space-y-2">
        <PageHeader
          title="Recommendations"
          description="Scan the list collapsed; open a row for rationale, checklist, and actions."
        />
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{statusCounts.open}</span> open ·{" "}
          <span className="font-medium text-slate-700">{statusCounts.all}</span> total in workspace
        </p>
      </div>

      {/* Filters — status then strategy */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="inline-flex h-auto flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1"
          >
            {(["all", "open", "done", "snoozed"] as const).map((status) => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={statusFilter === status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  statusFilter === status
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                )}
              >
                <span className="capitalize">{status}</span>
                <span className="ml-1.5 tabular-nums text-slate-400">({statusCounts[status]})</span>
              </button>
            ))}
          </div>

          <div
            className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block"
            aria-hidden
          />

          <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto sm:min-w-[13rem]">
            <Select
              value={strategyFilter}
              onValueChange={(value) => setStrategyFilter(value as StrategyFilterValue)}
            >
              <SelectTrigger
                id="recommendations-strategy-filter"
                className="h-9 w-full bg-white sm:w-[min(100%,17rem)]"
                aria-label="Filter by strategy"
              >
                <SelectValue placeholder="Strategy" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {STRATEGY_FILTERS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key === "all"
                      ? `All strategies (${strategyCounts.all})`
                      : `${RECOMMENDATION_STRATEGY_LABELS[key]} (${strategyCounts[key]})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {flatSorted.length > 0 && (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-200 text-slate-600"
              onClick={expandAll}
            >
              <ListChevronsUpDown className="h-3.5 w-3.5" aria-hidden />
              Expand all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-600"
              onClick={collapseAll}
            >
              <ListChevronsDownUp className="h-3.5 w-3.5" aria-hidden />
              Collapse
            </Button>
          </div>
        )}
      </div>

      {filteredRecs.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations"
          description={
            afterStatusFilter.length === 0
              ? statusFilter === "open"
                ? "New recommendations will appear here as changes are detected"
                : "No recommendations with this status"
              : strategyFilter === "all"
                ? "No recommendations match the current filters"
                : `No ${RECOMMENDATION_STRATEGY_LABELS[strategyFilter]} recommendations in this status — try another strategy or status`
          }
        />
      ) : (
        <Accordion
          type="multiple"
          value={visibleOpenAccordionIds}
          onValueChange={setOpenAccordionIds}
          className="space-y-2"
        >
          {flatSorted.map((rec) => {
            const competitorName = rec.competitor?.name ?? "Unknown";
            const progress = checklistProgress(rec);
            return (
              <AccordionItem
                key={rec.id}
                value={rec.id}
                className={cn(
                  "overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-soft transition-shadow data-[state=open]:shadow-soft-lg",
                  "border-l-[3px]",
                  impactAccentClass(rec.impact)
                )}
              >
                <AccordionTrigger className="px-4 py-3.5 hover:no-underline md:px-5">
                  <div className="min-w-0 flex-1 space-y-2 pr-2 text-left">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {competitorName}
                      </span>
                      <span className="text-slate-200" aria-hidden>
                        ·
                      </span>
                      <StrategyBadge strategy={rec.strategy} />
                      <Badge
                        variant={rec.status === "open" ? "default" : "secondary"}
                        className="text-[10px] uppercase tracking-wide"
                      >
                        {rec.status}
                      </Badge>
                    </div>
                    <p className="text-[15px] font-semibold leading-snug text-slate-900 line-clamp-2">
                      {rec.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500/80" aria-hidden />
                        Impact <strong className="font-semibold text-slate-700">{rec.impact}</strong>
                        <span className="text-slate-300">/</span>10
                      </span>
                      <span className="text-slate-200" aria-hidden>
                        ·
                      </span>
                      <span>
                        Effort <strong className="font-semibold text-slate-700">{rec.effort}</strong>
                        <span className="text-slate-300">/</span>10
                      </span>
                      {progress && (
                        <>
                          <span className="text-slate-200" aria-hidden>
                            ·
                          </span>
                          <span
                            className={cn(
                              progress.done === progress.total
                                ? "text-emerald-600"
                                : "text-slate-600"
                            )}
                          >
                            {progress.done}/{progress.total} actions done
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="border-t border-slate-100 bg-slate-50/40 px-4 pb-5 pt-4 md:px-5">
                  <p className="text-sm leading-relaxed text-slate-600">{rec.rationale}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("font-normal", getImpactBadgeClass(rec.impact))}>
                      Impact {rec.impact}/10
                    </Badge>
                    <Badge variant="outline" className={cn("font-normal", getEffortBadgeClass(rec.effort))}>
                      Effort {rec.effort}/10
                    </Badge>
                  </div>

                  {rec.checklistItems.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action items
                      </p>
                      <ul className="space-y-2">
                        {rec.checklistItems.map((item) => (
                          <li key={item.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm transition-colors hover:border-slate-300",
                                item.done && "bg-slate-50/80"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => handleChecklistToggle(rec, item.id)}
                                disabled={updateChecklistMutation.isPending}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                              />
                              <span
                                className={cn(
                                  "text-sm leading-snug",
                                  item.done ? "text-slate-400 line-through" : "text-slate-800"
                                )}
                              >
                                {item.text}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.status === "snoozed" && rec.snoozedUntil && (
                    <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5">
                      <p className="text-sm text-amber-950">
                        Snoozed until{" "}
                        <span className="font-medium">
                          {new Date(rec.snoozedUntil).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-2">
                    {rec.status === "open" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleMarkDone(rec)}
                          disabled={updateStatusMutation.isPending}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Mark done
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRec(rec);
                            setSnoozeDialogOpen(true);
                          }}
                          className="gap-2 border-slate-200"
                        >
                          <Clock className="h-4 w-4" aria-hidden />
                          Snooze
                        </Button>
                      </>
                    )}
                    {rec.status === "done" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            workspaceId,
                            id: rec.id,
                            status: "open",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="border-slate-200 text-slate-600"
                      >
                        Re-open
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <Dialog open={snoozeDialogOpen} onOpenChange={setSnoozeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze recommendation</DialogTitle>
            <DialogDescription>
              How long would you like to snooze this recommendation?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="snoozeDays">Snooze for (days)</Label>
            <Input
              id="snoozeDays"
              type="number"
              min="1"
              value={snoozeDays}
              onChange={(e) => setSnoozeDays(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnoozeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSnooze} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "Saving…" : "Snooze"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
