"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Button } from "@/components/ui/button";
import { snapshotsApi, competitorsApi } from "@/src/mock/api";
import { Camera } from "lucide-react";

export default function SnapshotsPage() {
  const router = useRouter();

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["snapshots"],
    queryFn: () => snapshotsApi.list(),
  });

  const { data: competitors } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => competitorsApi.list(),
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Snapshots" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Snapshots"
        description={`${snapshots?.length || 0} snapshots captured`}
      />

      {snapshots && snapshots.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No snapshots yet"
          description="Snapshots will appear here as you capture competitor data"
          action={{
            label: "View Competitors",
            onClick: () => router.push("/competitors"),
          }}
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
                    Captured At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                    Key Signals
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {snapshots?.map((snapshot) => {
                  const competitor = competitors?.find((c) => c.id === snapshot.competitorId);
                  const signals = snapshot.extractedSignals;
                  const keySignal =
                    signals.promoText || signals.shippingText || signals.bundleText || "No key signals";

                  return (
                    <tr
                      key={snapshot.id}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                      onClick={() => router.push(`/snapshots/${snapshot.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-semibold text-white">
                            {competitor?.name?.charAt(0) || "?"}
                          </div>
                          <span className="text-sm font-medium text-slate-900">
                            {competitor?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatTime(snapshot.capturedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <ConfidenceBadge confidence={signals.confidence} />
                      </td>
                      <td className="px-6 py-4">
                        <p className="max-w-md truncate text-sm text-slate-700">{keySignal}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/snapshots/${snapshot.id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
