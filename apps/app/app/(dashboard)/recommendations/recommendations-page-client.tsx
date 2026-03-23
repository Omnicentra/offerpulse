"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StrategyBadge } from "@/components/ui/strategy-badge";
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
import { useTRPC } from "@/src/lib/trpc/client";
import { Lightbulb, CheckCircle2, Clock, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type RecommendationsList = RouterOutputs["recommendations"]["list"];
type Recommendation = RecommendationsList[number];

interface RecommendationsPageClientProps {
  workspaceId: string;
  initialRecommendations: RecommendationsList;
}

function getImpactColor(impact: number) {
  if (impact >= 8) return "text-green-600 bg-green-100";
  if (impact >= 5) return "text-yellow-600 bg-yellow-100";
  return "text-slate-600 bg-slate-100";
}

function getEffortColor(effort: number) {
  if (effort <= 3) return "text-green-600 bg-green-100";
  if (effort <= 6) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
}

export function RecommendationsPageClient({
  workspaceId,
  initialRecommendations,
}: RecommendationsPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "done" | "snoozed">("open");
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [snoozeDays, setSnoozeDays] = useState("7");

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

  const filteredRecs = recommendations.filter((rec) => {
    if (statusFilter === "all") return true;
    return rec.status === statusFilter;
  });

  // Group by competitor
  const groupedRecs = filteredRecs.reduce(
    (groups, rec) => {
      const key = rec.competitorId;
      if (!groups[key]) groups[key] = [];
      groups[key].push(rec);
      return groups;
    },
    {} as Record<string, typeof filteredRecs>
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommendations"
        description={`${filteredRecs.length} recommendation${filteredRecs.length === 1 ? "" : "s"}`}
      />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-600" />
        <div className="flex gap-2">
          {(["all", "open", "done", "snoozed"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredRecs.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations"
          description={
            statusFilter === "open"
              ? "New recommendations will appear here as changes are detected"
              : "No recommendations with this status"
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedRecs).map(([competitorId, recs]) => {
            const competitorName = recs[0]?.competitor?.name ?? "Unknown";
            return (
              <div key={competitorId}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                    {competitorName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{competitorName}</h3>
                    <p className="text-sm text-slate-600">
                      {recs.length} recommendation{recs.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {recs.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <StrategyBadge strategy={rec.strategy} />
                            <Badge variant={rec.status === "open" ? "default" : "secondary"}>
                              {rec.status}
                            </Badge>
                          </div>
                          <h4 className="mt-3 text-lg font-semibold text-slate-900">{rec.title}</h4>
                          <p className="mt-2 text-sm text-slate-600">{rec.rationale}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="mt-4 flex gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Impact:</span>
                          <Badge className={getImpactColor(rec.impact)}>{rec.impact}/10</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Effort:</span>
                          <Badge className={getEffortColor(rec.effort)}>{rec.effort}/10</Badge>
                        </div>
                      </div>

                      {/* Checklist */}
                      {rec.checklistItems.length > 0 && (
                        <div className="mt-6 space-y-2">
                          <p className="text-sm font-medium text-slate-700">Action Items:</p>
                          {rec.checklistItems.map((item) => (
                            <label
                              key={item.id}
                              className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                            >
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => handleChecklistToggle(rec, item.id)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                              />
                              <span
                                className={`text-sm ${
                                  item.done ? "text-slate-500 line-through" : "text-slate-700"
                                }`}
                              >
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      {rec.status === "open" && (
                        <div className="mt-6 flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => handleMarkDone(rec)}
                            disabled={updateStatusMutation.isPending}
                            className="gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Done
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRec(rec);
                              setSnoozeDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Snooze
                          </Button>
                        </div>
                      )}

                      {rec.status === "snoozed" && rec.snoozedUntil && (
                        <div className="mt-4 rounded-lg bg-yellow-50 p-3">
                          <p className="text-sm text-yellow-800">
                            Snoozed until{" "}
                            {new Date(rec.snoozedUntil).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      )}

                      {rec.status === "done" && (
                        <div className="mt-4 flex">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                workspaceId,
                                id: rec.id,
                                status: "open",
                              })
                            }
                            disabled={updateStatusMutation.isPending}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            Re-open
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Snooze Dialog */}
      <Dialog open={snoozeDialogOpen} onOpenChange={setSnoozeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Recommendation</DialogTitle>
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
