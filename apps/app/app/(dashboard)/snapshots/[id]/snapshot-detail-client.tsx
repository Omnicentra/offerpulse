"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTRPC } from "@/src/lib/trpc/client";
import { ArrowLeft, Download, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/src/server/trpc/routers/root";

type SnapshotWithCompetitor = RouterOutputs["snapshots"]["get"];
type CompetitorItem = RouterOutputs["competitors"]["list"][number];
type SnapshotItem = RouterOutputs["snapshots"]["list"][number];
type ChangeEventItem = RouterOutputs["changeEvents"]["list"][number];

interface SnapshotDetailClientProps {
  snapshotId: string;
  workspaceId: string;
  initialSnapshot: SnapshotWithCompetitor | null;
  initialCompetitors: CompetitorItem[];
  initialAllSnapshots: SnapshotItem[];
  initialChanges: ChangeEventItem[];
}

export function SnapshotDetailClient({
  snapshotId,
  workspaceId,
  initialSnapshot,
  initialCompetitors,
  initialAllSnapshots,
  initialChanges,
}: SnapshotDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const trpc = useTRPC();
  const downloadPdfMutation = useMutation(
    trpc.snapshots.downloadPDF.mutationOptions()
  );

  const {
    data: snapshot,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...trpc.snapshots.get.queryOptions({ workspaceId, id: snapshotId }),
    initialData: initialSnapshot ?? undefined,
    enabled: !!workspaceId && !!snapshotId,
  });

  const { data: competitors = initialCompetitors } = useQuery({
    ...trpc.competitors.list.queryOptions({ workspaceId }),
    initialData: initialCompetitors,
    enabled: !!workspaceId,
  });

  const { data: allSnapshots = initialAllSnapshots } = useQuery({
    ...trpc.snapshots.list.queryOptions({ workspaceId }),
    initialData: initialAllSnapshots,
    enabled: !!workspaceId && !!snapshot,
  });

  const { data: changes = initialChanges } = useQuery({
    ...trpc.changeEvents.list.queryOptions({ workspaceId }),
    initialData: initialChanges,
    enabled: !!workspaceId && !!snapshot,
  });

  const competitor =
    snapshot?.competitor ??
    competitors?.find((c) => c.id === snapshot?.competitorId);

  const previousSnapshot = allSnapshots
    ?.filter(
      (s) =>
        s.competitorId === snapshot?.competitorId &&
        (snapshot
          ? new Date(s.capturedAt) < new Date(snapshot.capturedAt)
          : false)
    )
    .sort(
      (a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    )[0];

  const relatedChange = changes?.find(
    (c) => c.snapshotAfterId === snapshotId || c.snapshotBeforeId === snapshotId
  );

  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    if (!snapshot) return;

    downloadPdfMutation.mutate(
      { workspaceId, id: snapshot.id },
      {
        onSuccess: ({ data, filename }) => {
          const binary = atob(data);
          const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
          const blob = new Blob([bytes], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          toast({
            title: "Report downloaded",
            description: "Your PDF report is ready.",
          });
        },
        onError: (error) => {
          toast({
            title: "Download failed",
            description:
              error instanceof Error
                ? error.message
                : "Could not generate PDF report.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading && !snapshot) {
    return (
      <div>
        <Skeleton className="mb-8 h-12 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (
    !snapshot ||
    (isError && (error as { data?: { code?: string } })?.data?.code === "NOT_FOUND")
  ) {
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
    const hasData = Object.keys(signals).some(
      (key) =>
        key !== "confidence" &&
        (signals as Record<string, unknown>)[key] != null
    );

    return (
      <div
        className={`rounded-2xl border-2 p-6 ${isAfter ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-white"}`}
      >
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
                <p className="mt-2 text-sm font-medium text-purple-800">
                  {signals.promoText}
                </p>
                {signals.discountPercent != null && (
                  <p className="mt-1 text-sm text-purple-700">
                    Discount: {signals.discountPercent}%
                  </p>
                )}
                {signals.discountCode && (
                  <p className="mt-1 text-sm text-purple-700">
                    Code: {signals.discountCode}
                  </p>
                )}
              </div>
            )}

            {signals.shippingText && (
              <div className="rounded-xl bg-blue-100/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-900">
                  Shipping
                </p>
                <p className="mt-2 text-sm font-medium text-blue-800">
                  {signals.shippingText}
                </p>
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
                <p className="mt-2 text-sm font-medium text-orange-800">
                  {signals.bundleText}
                </p>
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
          className="mb-4 gap-2 no-print"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Snapshots
        </Button>

        <PageHeader
          title="Snapshot Details"
          description={`${competitor?.name || "Unknown Competitor"} • ${formatTime(snapshot.capturedAt)}`}
          action={
            <Button
              variant="outline"
              onClick={handleDownload}
              className="gap-2 no-print"
              disabled={downloadPdfMutation.isPending}
            >
              <Download className="h-4 w-4" />
              {downloadPdfMutation.isPending ? "Generating PDF..." : "Download Report"}
            </Button>
          }
        />
      </div>

      {relatedChange && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="text-sm font-semibold text-blue-900">
            Change Detected
          </h3>
          <p className="mt-2 text-sm text-blue-800">{relatedChange.summary}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() =>
              router.push(`/changes?selected=${relatedChange.id}`)
            }
          >
            View Change Details
          </Button>
        </div>
      )}

      {previousSnapshot ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {renderSignalsCard(
            previousSnapshot.extractedSignals,
            "Before"
          )}
          {renderSignalsCard(
            snapshot.extractedSignals,
            "After (Current)",
            true
          )}
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

      {snapshot.screenshotUrl ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Screenshot
          </h3>
          <div className="relative h-[420px] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="relative w-full min-h-full">
              <Image
                src={snapshot.screenshotUrl}
                alt="Snapshot screenshot"
                width={1920}
                height={5000}
                className="w-full min-w-full object-top object-contain rounded-xl"
                unoptimized
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <Camera className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-600">
            No screenshot available for this snapshot
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Metadata
        </h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-600">Snapshot ID</dt>
            <dd className="mt-1 font-mono text-sm text-slate-900">
              {snapshot.id}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Competitor</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {competitor?.name || "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Captured At</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {formatTime(snapshot.capturedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Confidence</dt>
            <dd className="mt-1">
              <ConfidenceBadge
                confidence={snapshot.extractedSignals.confidence}
              />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
