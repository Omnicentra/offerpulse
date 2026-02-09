"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { competitorsApi, changeEventsApi } from "@/src/mock/api";
import { Plus, Search, MoreVertical, Pause, Play, Trash2, Edit, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompetitorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => competitorsApi.list(),
  });

  const { data: allChanges } = useQuery({
    queryKey: ["changeEvents"],
    queryFn: () => changeEventsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: competitorsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast({
        title: "Competitor deleted",
        description: "The competitor has been removed.",
      });
      setCompetitorToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete competitor.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      competitorsApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
    },
  });

  // Get all unique tags
  const allTags = Array.from(
    new Set(competitors?.flatMap((c) => c.tags) || [])
  ).sort();

  // Filter competitors
  const filteredCompetitors = competitors?.filter((competitor) => {
    const matchesSearch =
      !searchQuery ||
      competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      competitor.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || competitor.tags.includes(selectedTag);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && competitor.isActive) ||
      (statusFilter === "paused" && !competitor.isActive);

    return matchesSearch && matchesTag && matchesStatus;
  });

  // Get changes count for last 7 days per competitor
  const getChangesCount = (competitorId: string) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return (
      allChanges?.filter(
        (c) => c.competitorId === competitorId && new Date(c.detectedAt) > sevenDaysAgo
      ).length || 0
    );
  };

  const formatLastSnapshot = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Competitors" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        description={`Monitoring ${competitors?.filter((c) => c.isActive).length || 0} active competitors`}
        action={
          <Button onClick={() => router.push("/competitors/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Competitor
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search competitors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "paused" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("paused")}
          >
            Paused
          </Button>
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag(null)}
          >
            All Tags
          </Button>
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {/* Competitors List */}
      {filteredCompetitors && filteredCompetitors.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No competitors found"
          description={
            searchQuery || selectedTag || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first competitor to start monitoring offers"
          }
          action={
            !searchQuery && !selectedTag
              ? {
                  label: "Add Competitor",
                  onClick: () => router.push("/competitors/new"),
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Competitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Last Snapshot
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Changes (7d)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompetitors?.map((competitor) => (
                  <tr
                    key={competitor.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => router.push(`/competitors/${competitor.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-semibold text-white">
                          {competitor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{competitor.name}</p>
                          <p className="text-sm text-slate-500">{competitor.domain}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {competitor.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {competitor.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{competitor.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">
                        {competitor.platformGuess === "shopify" ? "Shopify" : "Other"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={competitor.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {competitor.isActive ? "Active" : "Paused"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatLastSnapshot(competitor.lastSnapshotAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {getChangesCount(competitor.id)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(competitor.baseUrl, "_blank")}
                          title="Visit site"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: competitor.id,
                              isActive: !competitor.isActive,
                            })
                          }
                          title={competitor.isActive ? "Pause" : "Resume"}
                        >
                          {competitor.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCompetitorToDelete(competitor.id)}
                          title="Delete"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!competitorToDelete} onOpenChange={() => setCompetitorToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Competitor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this competitor? This will also remove all associated
              snapshots, changes, and recommendations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompetitorToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => competitorToDelete && deleteMutation.mutate(competitorToDelete)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
