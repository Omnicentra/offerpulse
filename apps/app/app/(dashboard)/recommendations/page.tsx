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
import { recommendationsApi, competitorsApi } from "@/src/mock/api";
import { Lightbulb, CheckCircle2, Clock, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Recommendation } from "@/src/mock/types";

export default function RecommendationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [snoozeDays, setSnoozeDays] = useState("7");

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => recommendationsApi.list(),
  });

  const { data: competitors } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => competitorsApi.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      snoozedUntil,
    }: {
      id: string;
      status: "open" | "done" | "snoozed";
      snoozedUntil?: string;
    }) => recommendationsApi.updateStatus(id, status, snoozedUntil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast({
        title: "Recommendation updated",
        description: "The recommendation status has been updated.",
      });
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: ({ id, checklist }: { id: string; checklist: Recommendation["checklist"] }) =>
      recommendationsApi.updateChecklist(id, checklist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const filteredRecs = recommendations?.filter((rec) => {
    if (statusFilter === "all") return true;
    return rec.status === statusFilter;
  });

  // Group by competitor
  const groupedRecs = filteredRecs?.reduce((groups, rec) => {
    const competitorId = rec.competitorId;
    if (!groups[competitorId]) groups[competitorId] = [];
    groups[competitorId].push(rec);
    return groups;
  }, {} as Record<string, typeof filteredRecs>);

  const handleMarkDone = (rec: Recommendation) => {
    updateStatusMutation.mutate({ id: rec.id, status: "done" });
  };

  const handleSnooze = () => {
    if (!selectedRec) return;

    const days = parseInt(snoozeDays);
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    updateStatusMutation.mutate({
      id: selectedRec.id,
      status: "snoozed",
      snoozedUntil,
    });

    setSnoozeDialogOpen(false);
    setSelectedRec(null);
  };

  const handleChecklistToggle = (rec: Recommendation, itemId: string) => {
    const updatedChecklist = rec.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateChecklistMutation.mutate({ id: rec.id, checklist: updatedChecklist });
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 8) return "text-green-600 bg-green-100";
    if (impact >= 5) return "text-yellow-600 bg-yellow-100";
    return "text-slate-600 bg-slate-100";
  };

  const getEffortColor = (effort: number) => {
    if (effort <= 3) return "text-green-600 bg-green-100";
    if (effort <= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Recommendations" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommendations"
        description={`${filteredRecs?.length || 0} recommendations`}
      />

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-600" />
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("open")}
          >
            Open
          </Button>
          <Button
            variant={statusFilter === "done" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("done")}
          >
            Done
          </Button>
          <Button
            variant={statusFilter === "snoozed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("snoozed")}
          >
            Snoozed
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      {filteredRecs && filteredRecs.length === 0 ? (
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
          {Object.entries(groupedRecs || {}).map(([competitorId, recs]) => {
            const competitor = competitors?.find((c) => c.id === competitorId);
            return (
              <div key={competitorId}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                    {competitor?.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {competitor?.name || "Unknown"}
                    </h3>
                    <p className="text-sm text-slate-600">{recs.length} recommendations</p>
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                      {rec.checklist.length > 0 && (
                        <div className="mt-6 space-y-2">
                          <p className="text-sm font-medium text-slate-700">Action Items:</p>
                          {rec.checklist.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer"
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
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkDone(rec)}
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
                            Snoozed until {new Date(rec.snoozedUntil).toLocaleDateString()}
                          </p>
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
            <DialogDescription>How long would you like to snooze this recommendation?</DialogDescription>
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
              Snooze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
