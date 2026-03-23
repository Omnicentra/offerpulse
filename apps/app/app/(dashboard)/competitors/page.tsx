"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pause, Play, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-600",
  "from-slate-600 to-slate-800",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-3">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="ml-auto h-8 w-32 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="ml-8 h-4 w-20" />
            <Skeleton className="ml-auto h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompetitorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { workspaceId } = useWorkspace();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null);

  const { data: competitors, isLoading } = useQuery(
    trpc.competitors.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const { data: allChanges } = useQuery(
    trpc.changeEvents.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const deleteMutation = useMutation(
    trpc.competitors.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.competitors.list.queryFilter());
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
    })
  );

  const toggleActiveMutation = useMutation(
    trpc.competitors.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.competitors.list.queryFilter());
      },
    })
  );

  const allTags = Array.from(new Set(competitors?.flatMap((c) => c.tags) || [])).sort();

  const filteredCompetitors = competitors?.filter((competitor) => {
    const matchesSearch =
      !searchQuery ||
      competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      competitor.domain.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || competitor.tags?.includes(selectedTag);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && competitor.isActive) ||
      (statusFilter === "paused" && !competitor.isActive);

    return matchesSearch && matchesTag && matchesStatus;
  });

  const changesCountByCompetitor = useMemo(() => {
    const map = new Map<string, number>();
    if (!allChanges?.length) return map;
    const cutoff = new Date();
    cutoff.setTime(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000);
    for (const c of allChanges) {
      if (new Date(c.detectedAt) > cutoff) {
        map.set(c.competitorId, (map.get(c.competitorId) ?? 0) + 1);
      }
    }
    return map;
  }, [allChanges]);

  const formatLastSnapshot = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const openCompetitorSite = (baseUrl: string) => {
    try {
      const sanitizedUrl = new URL(baseUrl);
      if (!["http:", "https:"].includes(sanitizedUrl.protocol)) {
        toast({
          title: "Invalid URL",
          description: "Only HTTP and HTTPS URLs are allowed.",
          variant: "destructive",
        });
        return;
      }
      window.open(sanitizedUrl.toString(), "_blank", "noopener,noreferrer");
    } catch {
      toast({
        title: "Invalid URL",
        description: "Could not open competitor website.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Competitors" />
        <SkeletonTable />
      </div>
    );
  }

  const activeCount = competitors?.filter((c) => c.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        description={`Monitoring ${activeCount} active competitor${activeCount === 1 ? "" : "s"}`}
      />

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
            !searchQuery && !selectedTag && statusFilter === "all"
              ? {
                  label: "Add Competitor",
                  onClick: () => router.push("/competitors/new"),
                }
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search name or domain…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg pl-8 text-sm"
              />
            </div>
            <span className="text-xs tabular-nums text-slate-400">
              {filteredCompetitors?.length ?? 0}{" "}
              {(filteredCompetitors?.length ?? 0) === 1 ? "competitor" : "competitors"}
            </span>
            <div className="flex flex-wrap gap-1.5 sm:ml-2">
              {(["all", "active", "paused"] as const).map((key) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? "default" : "outline"}
                  size="sm"
                  className="h-7 rounded-md px-2.5 text-xs capitalize"
                  onClick={() => setStatusFilter(key)}
                >
                  {key === "all" ? "All" : key === "active" ? "Active" : "Paused"}
                </Button>
              ))}
            </div>
            <div className="ml-auto flex shrink-0">
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => router.push("/competitors/new")}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Competitor
              </Button>
            </div>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50/40 px-5 py-2.5">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Tags
              </span>
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                className="h-6 rounded-md px-2 text-[11px]"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  className="h-6 rounded-md px-2 text-[11px] font-normal"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Competitor
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Tags
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Platform
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Last snapshot
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Changes (7d)
                  </th>
                  <th className="w-28 px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompetitors?.map((competitor) => {
                  const initial = competitor.name.charAt(0).toUpperCase();
                  const avatarColor = getAvatarColor(competitor.name);
                  let domainLabel = competitor.domain;
                  if (!domainLabel) {
                    try {
                      domainLabel = new URL(competitor.baseUrl).hostname;
                    } catch {
                      domainLabel = competitor.baseUrl;
                    }
                  }

                  return (
                    <tr
                      key={competitor.id}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/60"
                      onClick={() => router.push(`/competitors/${competitor.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${avatarColor} text-[11px] font-bold text-white shadow-sm`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{competitor.name}</p>
                            <p className="truncate text-xs text-slate-400">{domainLabel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex max-w-[200px] flex-wrap gap-1">
                          {competitor.tags?.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {competitor.tags && competitor.tags.length > 3 && (
                            <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                              +{competitor.tags.length - 3}
                            </span>
                          )}
                          {!competitor.tags?.length && (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                            competitor.platformGuess === "shopify"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {competitor.platformGuess === "shopify" ? "Shopify" : "Other"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                            competitor.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              competitor.isActive ? "bg-green-500" : "bg-slate-400"
                            )}
                          />
                          {competitor.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {formatLastSnapshot(competitor.lastSnapshotAt?.toISOString())}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium tabular-nums text-slate-900">
                          {changesCountByCompetitor.get(competitor.id) ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div
                          className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-slate-700"
                            onClick={() => openCompetitorSite(competitor.baseUrl)}
                            title="Visit site"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-slate-700"
                            onClick={() => {
                              if (toggleActiveMutation.isPending) return;
                              toggleActiveMutation.mutate({
                                workspaceId: competitor.workspaceId,
                                id: competitor.id,
                                isActive: !competitor.isActive,
                              });
                            }}
                            disabled={toggleActiveMutation.isPending}
                            aria-disabled={toggleActiveMutation.isPending}
                            title={competitor.isActive ? "Pause" : "Resume"}
                          >
                            {competitor.isActive ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setCompetitorToDelete(competitor.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              onClick={() =>
                competitorToDelete &&
                deleteMutation.mutate({ workspaceId: workspaceId!, id: competitorToDelete })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
