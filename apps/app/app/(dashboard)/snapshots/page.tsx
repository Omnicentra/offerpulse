"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVATAR_COLORS,
  getAvatarColor,
  SkeletonTable,
} from "@/components/ui/dashboard-table-helpers";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import { Camera, Search, ArrowUpRight } from "lucide-react";

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SnapshotsPage() {
  const router = useRouter();
  const { workspaceId } = useWorkspace();
  const trpc = useTRPC();
  const [search, setSearch] = useState("");

  const { data: snapshots, isLoading } = useQuery(
    trpc.snapshots.list.queryOptions(
      { workspaceId: workspaceId! },
      { enabled: !!workspaceId }
    )
  );

  const filtered = snapshots?.filter((s) => {
    if (!search.trim()) return true;
    return s.competitor?.name?.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader compact title="Snapshots" />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        compact
        title="Snapshots"
        description={`${snapshots?.length ?? 0} snapshots captured`}
      />

      {snapshots && snapshots.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No snapshots yet"
          description="Snapshots will appear here as you capture competitor data"
          action={{ label: "View Competitors", onClick: () => router.push("/competitors") }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3">
            <div className="relative w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search competitor…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 rounded-lg pl-8 text-sm"
              />
            </div>
            <span className="text-xs tabular-nums text-slate-400">
              {filtered?.length ?? 0} {(filtered?.length ?? 0) === 1 ? "snapshot" : "snapshots"}
            </span>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Competitor
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Captured
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Confidence
                </th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  Key Signal
                </th>
                <th className="w-20 px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                    No snapshots match your search.
                  </td>
                </tr>
              ) : (
                filtered?.map((snapshot) => {
                  const competitor = snapshot.competitor;
                  const signals = snapshot.extractedSignals;
                  const keySignal =
                    signals?.promoText ||
                    signals?.shippingText ||
                    signals?.bundleText ||
                    null;
                  const confidence = signals?.confidence ?? "low";
                  const name = competitor?.name ?? "Unknown";
                  const initial = name.charAt(0).toUpperCase();
                  const avatarColor = name ? getAvatarColor(name) : AVATAR_COLORS[0];

                  return (
                    <tr
                      key={snapshot.id}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                      onClick={() => router.push(`/snapshots/${snapshot.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${avatarColor} text-[11px] font-bold text-white shadow-sm`}
                          >
                            {initial}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {formatTime(snapshot.capturedAt.toISOString())}
                      </td>
                      <td className="px-5 py-3.5">
                        <ConfidenceBadge confidence={confidence} />
                      </td>
                      <td className="px-5 py-3.5">
                        {keySignal ? (
                          <p className="max-w-sm truncate text-sm text-slate-700">{keySignal}</p>
                        ) : (
                          <span className="text-sm text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs text-slate-500 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/snapshots/${snapshot.id}`);
                          }}
                        >
                          View
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
