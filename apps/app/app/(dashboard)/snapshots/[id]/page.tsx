"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { snapshotsApi, competitorsApi, changeEventsApi } from "@/src/mock/api";
import { ArrowLeft, Download, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SnapshotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const snapshotId = params.id as string;

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["snapshots", snapshotId],
    queryFn: () => snapshotsApi.get(snapshotId),
  });

  const { data: competitors } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => competitorsApi.list(),
  });

  const { data: allSnapshots } = useQuery({
    queryKey: ["snapshots"],
    queryFn: () => snapshotsApi.list(),
    enabled: !!snapshot,
  });

  const { data: changes } = useQuery({
    queryKey: ["changeEvents"],
    queryFn: () => changeEventsApi.list(),
    enabled: !!snapshot,
  });

  const competitor = competitors?.find((c) => c.id === snapshot?.competitorId);

  // Find the previous snapshot for comparison
  const previousSnapshot = allSnapshots
    ?.filter(
      (s) =>
        s.competitorId === snapshot?.competitorId &&
        new Date(s.capturedAt) < new Date(snapshot.capturedAt)
    )
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())[0];

  // Find related change event
  const relatedChange = changes?.find(
    (c) => c.snapshotAfterId === snapshotId || c.snapshotBeforeId === snapshotId
  );

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    toast({
      title: "Coming soon",
      description: "Snapshot download will be available soon",
    });
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="mb-8 h-12 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <EmptyState
        icon={Camera}
        title="Snapshot not found"
        description="The snapshot you're looking for doesn't exist."
        action={{
          label: "Back to Snapshots",
          onClick: () => router.push("/snapshots"),
        }}
      />
    );
  }

  const renderSignalsCard = (
    signals: typeof snapshot.extractedSignals,
    title: string,
    isAfter = false
  ) => {
    const hasData = Object.keys(signals).some((key) => key !== "confidence" && signals[key as keyof typeof signals]);

    return (
      <div className={`rounded-2xl border-2 p-6 ${isAfter ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-white"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <ConfidenceBadge confidence={signals.confidence} />
        </div>

        {!hasData ? (
          <p className="text-sm text-slate-500">No data available</p>
        ) : (
          <div className="space-y-4">
            {signals.promoText && (
              <div className="rounded-xl bg-purple-100/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-purple-900">
                  Promotion
                </p>
                <p className="mt-2 text-sm font-medium text-purple-800">{signals.promoText}</p>
                {signals.discountPercent && (
                  <p className="mt-1 text-sm text-purple-700">
                    Discount: {signals.discountPercent}%
                  </p>
                )}
                {signals.discountCode && (
                  <p className="mt-1 text-sm text-purple-700">Code: {signals.discountCode}</p>
                )}
              </div>
            )}

            {signals.shippingText && (
              <div className="rounded-xl bg-blue-100/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-900">
                  Shipping
                </p>
                <p className="mt-2 text-sm font-medium text-blue-800">{signals.shippingText}</p>
                {signals.shippingThreshold !== undefined && (
                  <p className="mt-1 text-sm text-blue-700">
                    Threshold: ${signals.shippingThreshold}
                  </p>
                )}
              </div>
            )}

            {signals.bundleText && (
              <div className="rounded-xl bg-orange-100/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-orange-900">
                  Bundle Offer
                </p>
                <p className="mt-2 text-sm font-medium text-orange-800">{signals.bundleText}</p>
              </div>
            )}

            {signals.cartIncentiveText && (
              <div className="rounded-xl bg-green-100/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-green-900">
                  Cart Incentive
                </p>
                <p className="mt-2 text-sm font-medium text-green-800">
                  {signals.cartIncentiveText}
                </p>
              </div>
            )}

            {(signals.deliveryText || signals.returnsText) && (
              <div className="rounded-xl bg-indigo-100/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-900">
                  Delivery & Returns
                </p>
                {signals.deliveryText && (
                  <p className="mt-2 text-sm font-medium text-indigo-800">
                    Delivery: {signals.deliveryText}
                  </p>
                )}
                {signals.returnsText && (
                  <p className="mt-2 text-sm font-medium text-indigo-800">
                    Returns: {signals.returnsText}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/snapshots")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Snapshots
        </Button>

        <PageHeader
          title="Snapshot Details"
          description={`${competitor?.name || "Unknown Competitor"} • ${formatTime(snapshot.capturedAt)}`}
          action={
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          }
        />
      </div>

      {/* Summary */}
      {relatedChange && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900">Change Detected</h3>
          <p className="mt-2 text-sm text-blue-800">{relatedChange.summary}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push(`/changes?selected=${relatedChange.id}`)}
          >
            View Change Details
          </Button>
        </div>
      )}

      {/* Before/After Comparison */}
      {previousSnapshot ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {renderSignalsCard(previousSnapshot.extractedSignals, "Before")}
          {renderSignalsCard(snapshot.extractedSignals, "After (Current)", true)}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-slate-600">
              No previous snapshot available for comparison
            </p>
          </div>
          {renderSignalsCard(snapshot.extractedSignals, "Captured Data", true)}
        </div>
      )}

      {/* Screenshot Placeholder */}
      {snapshot.screenshotUrl ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Screenshot</h3>
          <img
            src={snapshot.screenshotUrl}
            alt="Snapshot screenshot"
            className="rounded-xl"
          />
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-600">No screenshot available for this snapshot</p>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Metadata</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-600">Snapshot ID</dt>
            <dd className="mt-1 text-sm text-slate-900 font-mono">{snapshot.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Competitor</dt>
            <dd className="mt-1 text-sm text-slate-900">{competitor?.name || "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Captured At</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatTime(snapshot.capturedAt)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Confidence</dt>
            <dd className="mt-1">
              <ConfidenceBadge confidence={snapshot.extractedSignals.confidence} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
