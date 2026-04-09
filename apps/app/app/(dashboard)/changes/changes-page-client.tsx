"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChangeTypeBadge } from "@/components/ui/change-type-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTRPC } from "@/src/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, X, Zap, AlertCircle } from "lucide-react";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type ChangeEventType =
  | "PROMO"
  | "SHIPPING"
  | "BUNDLE"
  | "CART_INCENTIVE"
  | "DELIVERY_RETURNS";

type CompetitorsList = RouterOutputs["competitors"]["list"];
type ChangeEventsList = RouterOutputs["changeEvents"]["list"];

interface ChangesPageClientProps {
  workspaceId: string;
  initialCompetitors: CompetitorsList;
  initialChanges: ChangeEventsList;
}

export function ChangesPageClient({
  workspaceId,
  initialCompetitors,
  initialChanges,
}: ChangesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("selected");

  const trpc = useTRPC();

  const [competitorFilter, setCompetitorFilter] = useState<string>("all");
  const [typeFilters, setTypeFilters] = useState<ChangeEventType[]>([]);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [detectionFilter, setDetectionFilter] = useState<string>("all");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<string | null>(null);

  const { data: competitors = initialCompetitors } = useQuery({
    ...trpc.competitors.list.queryOptions({ workspaceId }),
    initialData: initialCompetitors,
    enabled: !!workspaceId,
  });

  const { data: allChanges = initialChanges } = useQuery({
    ...trpc.changeEvents.list.queryOptions({ workspaceId }),
    initialData: initialChanges,
    enabled: !!workspaceId,
  });

  // Handle selected change from URL
  useEffect(() => {
    if (selectedId && allChanges) {
      const change = allChanges.find((c) => c.id === selectedId);
      if (change) {
        setSelectedChange(selectedId);
        setDetailDrawerOpen(true);
      }
    }
  }, [selectedId, allChanges]);

  // Filter changes
  const filteredChanges = allChanges?.filter((change) => {
    if (competitorFilter && competitorFilter !== "all" && change.competitorId !== competitorFilter) return false;
    if (typeFilters.length > 0 && !typeFilters.includes(change.type as ChangeEventType)) return false;
    if (confidenceFilter && confidenceFilter !== "all" && change.confidence !== confidenceFilter) return false;
    if (detectionFilter && detectionFilter !== "all" && (change.diffType ?? "manual") !== detectionFilter) return false;
    return true;
  });

  // Group by date
  const groupedChanges = filteredChanges?.reduce((groups, change) => {
    const date = new Date(change.detectedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffInDays === 0) label = "Today";
    else if (diffInDays === 1) label = "Yesterday";
    else if (diffInDays < 7) label = "Last 7 days";
    else label = "Older";

    if (!groups[label]) groups[label] = [];
    groups[label].push(change);
    return groups;
  }, {} as Record<string, typeof filteredChanges>);

  const toggleTypeFilter = (type: ChangeEventType) => {
    setTypeFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const hasActiveFilters =
    (competitorFilter && competitorFilter !== "all") ||
    typeFilters.length > 0 ||
    (confidenceFilter && confidenceFilter !== "all") ||
    (detectionFilter && detectionFilter !== "all");

  const clearFilters = () => {
    setCompetitorFilter("all");
    setTypeFilters([]);
    setConfidenceFilter("all");
    setDetectionFilter("all");
  };

  const formatFieldLabel = (field: string) =>
    field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const selectedChangeData = allChanges?.find((c) => c.id === selectedChange);
  const selectedCompetitor = competitors?.find(
    (c) => c.id === selectedChangeData?.competitorId
  );

  const beforeData = selectedChangeData?.before ?? {};
  const afterData = selectedChangeData?.after ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        compact
        title="Changes"
        description={`${filteredChanges?.length || 0} changes detected`}
      />

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Competitor</Label>
            <Select value={competitorFilter} onValueChange={setCompetitorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All competitors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All competitors</SelectItem>
                {competitors?.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Confidence</Label>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All confidence levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Detection method</Label>
            <Select value={detectionFilter} onValueChange={setDetectionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                <SelectItem value="json">Firecrawl AI</SelectItem>
                <SelectItem value="git-diff">Git diff</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Change Type</Label>
            <div className="flex flex-wrap gap-2">
              {(["PROMO", "SHIPPING", "BUNDLE", "CART_INCENTIVE", "DELIVERY_RETURNS"] as const).map(
                (type) => (
                  <Button
                    key={type}
                    variant={typeFilters.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTypeFilter(type)}
                  >
                    {type.replace("_", " ")}
                  </Button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Changes List */}
      {filteredChanges && filteredChanges.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No changes found"
          description={
            hasActiveFilters
              ? "Try adjusting your filters"
              : "Changes will appear here as we detect them from your competitors"
          }
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedChanges || {}).map(([label, changes]) => (
            <div key={label}>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">{label}</h3>
              <div className="space-y-2">
                {changes.map((change) => {
                  const competitor = competitors?.find((c) => c.id === change.competitorId);
                  return (
                    <button
                      key={change.id}
                      onClick={() => {
                        setSelectedChange(change.id);
                        setDetailDrawerOpen(true);
                      }}
                      className="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left transition-colors hover:border-slate-200 hover:bg-slate-50/50"
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
                          {change.diffType === "json" && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0">
                              AI
                            </Badge>
                          )}
                          {"alertStatus" in change && change.alertStatus === "sent" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Alert via {Array.isArray(change.alertChannels) ? change.alertChannels.join(", ") : "—"}
                            </Badge>
                          )}
                          {"alertStatus" in change && change.alertStatus === "filtered" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Alert filtered
                            </Badge>
                          )}
                          {"alertStatus" in change && change.alertStatus === "failed" && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Alert failed
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{change.summary}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatTime(change.detectedAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedChangeData && (
            <>
              <SheetHeader>
                <SheetTitle>Change Details</SheetTitle>
                <SheetDescription>
                  {selectedCompetitor?.name} • {formatTime(selectedChangeData.detectedAt)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Badges: type, confidence, detection method, alert status */}
                <div className="flex flex-wrap gap-2">
                  <ChangeTypeBadge type={selectedChangeData.type} />
                  <ConfidenceBadge confidence={selectedChangeData.confidence} />
                  <Badge
                    variant={
                      selectedChangeData.diffType === "json" ? "default" : "secondary"
                    }
                  >
                    {selectedChangeData.diffType === "json"
                      ? "AI Detected"
                      : selectedChangeData.diffType === "git-diff"
                        ? "Git diff"
                        : "Manual"}
                  </Badge>
                  {"alertStatus" in selectedChangeData &&
                    selectedChangeData.alertStatus === "sent" && (
                      <Badge variant="secondary">
                        Alert sent via{" "}
                        {Array.isArray(selectedChangeData.alertChannels)
                          ? selectedChangeData.alertChannels.join(", ")
                          : "—"}
                      </Badge>
                    )}
                  {"alertStatus" in selectedChangeData &&
                    selectedChangeData.alertStatus === "filtered" && (
                      <Badge variant="outline">Alert filtered</Badge>
                    )}
                  {"alertStatus" in selectedChangeData &&
                    selectedChangeData.alertStatus === "failed" && (
                      <Badge variant="destructive">Alert failed</Badge>
                    )}
                </div>

                {/* Firecrawl status indicator */}
                {selectedChangeData.diffType === "json" && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 shrink-0 text-blue-600" />
                      <p className="text-sm text-blue-900">
                        Detected by Firecrawl AI • High accuracy
                      </p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Summary</h4>
                  <p className="mt-2 text-sm text-slate-700">{selectedChangeData.summary}</p>
                  {"snapshotAfter" in selectedChangeData &&
                    selectedChangeData.snapshotAfter?.firecrawlVisibility === "hidden" && (
                      <div className="mt-2 flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p className="text-xs">
                          This offer is no longer visible on the page
                        </p>
                      </div>
                    )}
                </div>

                {/* Fields Changed (Firecrawl) */}
                {selectedChangeData.fieldsChanged &&
                  selectedChangeData.fieldsChanged.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Fields changed
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedChangeData.fieldsChanged.map((field) => (
                          <Badge key={field} variant="outline">
                            {formatFieldLabel(field)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Before/After: field-level when Firecrawl, else generic */}
                {selectedChangeData.fieldsChanged &&
                selectedChangeData.fieldsChanged.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Before / After
                    </h4>
                    {selectedChangeData.fieldsChanged.map((field) => {
                      const before = beforeData[field];
                      const after = afterData[field];
                      return (
                        <div
                          key={field}
                          className="rounded-lg border border-slate-200 p-4"
                        >
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {formatFieldLabel(field)}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-red-600">
                                Before
                              </p>
                              <p className="text-sm text-slate-700 line-through">
                                {before != null && before !== ""
                                  ? String(before)
                                  : "(none)"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-green-600">
                                After
                              </p>
                              <p className="text-sm font-medium text-slate-900">
                                {after != null && after !== ""
                                  ? String(after)
                                  : "(none)"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="rounded-xl border border-slate-200 bg-red-50/50 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-red-900">
                        Before
                      </h4>
                      <div className="mt-2 space-y-1">
                        {Object.entries(beforeData).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-slate-700">
                              {formatFieldLabel(key)}:{" "}
                            </span>
                            <span className="text-slate-600">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                        {Object.keys(beforeData).length === 0 && (
                          <p className="text-sm text-slate-500">
                            No previous data
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-green-50/50 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-green-900">
                        After
                      </h4>
                      <div className="mt-2 space-y-1">
                        {Object.entries(afterData).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-slate-700">
                              {formatFieldLabel(key)}:{" "}
                            </span>
                            <span className="text-slate-600">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedChangeData.snapshotAfterId && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        router.push(`/snapshots/${selectedChangeData.snapshotAfterId}`);
                        setDetailDrawerOpen(false);
                      }}
                    >
                      View Snapshot
                    </Button>
                  )}
                  {selectedCompetitor && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        router.push(`/competitors/${selectedCompetitor.id}`);
                        setDetailDrawerOpen(false);
                      }}
                    >
                      View Competitor
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
