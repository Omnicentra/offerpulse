"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useTRPC } from "@/src/lib/trpc/client";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Camera,
  Store,
  Percent,
  Truck,
  Package,
  Gift,
  ShoppingCart,
  Clock,
  CheckCircle,
  Circle,
  ExternalLink,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TRPCClientError } from "@trpc/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SnapshotDetailClientProps {
  snapshotId: string;
  workspaceId: string;
}

// ── Score helpers ──────────────────────────────────────────────────────────────

type ExtractedSignals = {
  promoText?: string;
  discountPercent?: number;
  discountCode?: string;
  shippingThreshold?: number;
  shippingText?: string;
  bundleText?: string;
  cartIncentiveText?: string;
  deliveryText?: string;
  returnsText?: string;
  confidence: "low" | "medium" | "high";
};

function computeScore(signals: ExtractedSignals): {
  score: number;
  grade: string;
  interpretation: string;
} {
  let score = 0;
  if (signals.promoText) score += 20;
  if (signals.discountPercent != null) score += 15;
  if (signals.discountCode) score += 10;
  if (signals.shippingText || signals.shippingThreshold != null) score += 15;
  if (signals.bundleText) score += 15;
  if (signals.cartIncentiveText) score += 15;
  if (signals.deliveryText || signals.returnsText) score += 5;

  const mechanicCount = [
    signals.promoText || signals.discountCode || signals.discountPercent != null,
    signals.shippingText || signals.shippingThreshold != null,
    signals.bundleText,
    signals.cartIncentiveText,
  ].filter(Boolean).length;
  if (mechanicCount >= 3) score += 10;

  score = Math.min(100, score);

  let grade = "D";
  if (score >= 95) grade = "A+";
  else if (score >= 85) grade = "A";
  else if (score >= 75) grade = "A-";
  else if (score >= 65) grade = "B+";
  else if (score >= 55) grade = "B";
  else if (score >= 45) grade = "B-";
  else if (score >= 35) grade = "C";

  let interpretation = "Minimal promotional activity detected on public pages";
  if (score >= 80)
    interpretation =
      "Highly promotional competitor with multiple offer mechanics active";
  else if (score >= 60)
    interpretation =
      "Strong promotional approach with several active incentives";
  else if (score >= 40)
    interpretation = "Moderate promotional activity detected";
  else if (score >= 20)
    interpretation = "Light promotional approach with few active mechanics";

  return { score, grade, interpretation };
}

function getGradeColor(grade: string) {
  if (grade.startsWith("A")) return "from-green-500 to-emerald-600";
  if (grade.startsWith("B")) return "from-blue-500 to-indigo-600";
  if (grade.startsWith("C")) return "from-yellow-500 to-orange-600";
  return "from-slate-400 to-slate-500";
}

function getIntensityLabel(score: number): {
  label: string;
  className: string;
} {
  if (score >= 75)
    return { label: "High promo intensity", className: "bg-green-100 text-green-800" };
  if (score >= 45)
    return { label: "Moderate promo intensity", className: "bg-yellow-100 text-yellow-800" };
  return { label: "Low promo intensity", className: "bg-slate-100 text-slate-700" };
}

// ── Offer stack derived from extractedSignals ──────────────────────────────────

interface OfferItem {
  text: string;
  detail?: string;
  location?: string;
}

function buildOfferSections(signals: ExtractedSignals) {
  const discounts: OfferItem[] = [];
  if (signals.promoText) {
    discounts.push({
      text: signals.promoText,
      detail: [
        signals.discountPercent != null
          ? `${signals.discountPercent}% off`
          : null,
        signals.discountCode ? `Code: ${signals.discountCode}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    });
  } else if (signals.discountCode ?? signals.discountPercent != null) {
    discounts.push({
      text: signals.discountCode
        ? `Discount code: ${signals.discountCode}`
        : `${signals.discountPercent}% discount`,
      detail:
        signals.discountPercent != null
          ? `${signals.discountPercent}% off`
          : undefined,
    });
  }

  const shipping: OfferItem[] = [];
  if (signals.shippingText) {
    shipping.push({
      text: signals.shippingText,
      detail:
        signals.shippingThreshold != null
          ? `Threshold: $${signals.shippingThreshold}`
          : undefined,
    });
  } else if (signals.shippingThreshold != null) {
    shipping.push({
      text: `Free shipping over $${signals.shippingThreshold}`,
    });
  }

  const bundles: OfferItem[] = signals.bundleText
    ? [{ text: signals.bundleText }]
    : [];

  const cart: OfferItem[] = signals.cartIncentiveText
    ? [{ text: signals.cartIncentiveText }]
    : [];

  const policy: OfferItem[] = [
    signals.deliveryText ? { text: signals.deliveryText, location: "Delivery" } : null,
    signals.returnsText ? { text: signals.returnsText, location: "Returns" } : null,
  ].filter(Boolean) as OfferItem[];

  return { discounts, shipping, bundles, cart, policy };
}

// ── Offer stack from marketingToolPayload (rich source) ────────────────────────

interface RichDiscount {
  type: string;
  value?: number;
  code?: string;
  evidenceText: string;
  locationHint: string;
  sourcePages?: string[];
}

interface RichItem {
  evidenceText: string;
  locationHint: string;
  sourcePages?: string[];
}

interface RichShipping {
  amount: number;
  currency: string;
  evidenceText: string;
  locationHint: string;
  sourcePages?: string[];
}

interface RichOffers {
  discounts?: RichDiscount[];
  bundles?: RichItem[];
  gifts?: RichItem[];
  cartIncentives?: RichItem[];
  announcements?: Array<string | { text: string; sourcePages?: string[] }>;
  shippingThreshold?: RichShipping;
}

function extractRichOffers(payload: Record<string, unknown>): RichOffers | null {
  const offers = (payload.offers ?? payload) as Record<string, unknown>;
  if (!offers || typeof offers !== "object") return null;
  return {
    discounts: (offers.discounts as RichDiscount[]) ?? [],
    bundles: (offers.bundles as RichItem[]) ?? [],
    gifts: (offers.gifts as RichItem[]) ?? [],
    cartIncentives: (offers.cartIncentives as RichItem[]) ?? [],
    announcements: (offers.announcements as string[]) ?? [],
    shippingThreshold: offers.shippingThreshold as RichShipping | undefined,
  };
}

// ── OfferBlock sub-component ───────────────────────────────────────────────────

interface OfferBlockProps {
  sectionId: string;
  title: string;
  items: OfferItem[];
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  emptyLabel: string;
}

function OfferBlock({
  sectionId,
  title,
  items,
  icon: Icon,
  accentClass,
  emptyLabel,
}: OfferBlockProps) {
  return (
    <AccordionItem
      value={sectionId}
      className="h-fit min-h-0 rounded-2xl border border-slate-200 bg-white px-4 data-[state=open]:shadow-sm"
    >
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:pb-2">
        <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{title}</span>
            <Badge
              variant="outline"
              className="h-5 shrink-0 rounded-full px-2 text-[11px] font-medium tabular-nums"
            >
              {items.length}
            </Badge>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pt-0">
        {items.length > 0 ? (
          <div className="max-h-[min(55vh,520px)] space-y-2.5 overflow-y-auto pb-1">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-slate-900">{item.text}</p>
                  {item.detail && (
                    <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                  )}
                  {item.location && (
                    <Badge
                      variant="outline"
                      className="mt-1.5 h-4 rounded-md px-1.5 text-[10px]"
                    >
                      {item.location}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            <Circle className="h-4 w-4 text-slate-300" />
            {emptyLabel}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ── Rich OfferBlock (from marketingToolPayload) ────────────────────────────────

interface RichOfferBlockProps {
  sectionId: string;
  title: string;
  items: Array<{
    evidenceText: string;
    locationHint?: string;
    sourcePages?: string[];
    code?: string;
    value?: number;
    type?: string;
  }>;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  emptyLabel: string;
}

function RichOfferBlock({
  sectionId,
  title,
  items,
  icon: Icon,
  accentClass,
  emptyLabel,
}: RichOfferBlockProps) {
  return (
    <AccordionItem
      value={sectionId}
      className="h-fit min-h-0 rounded-2xl border border-slate-200 bg-white px-4 data-[state=open]:shadow-sm"
    >
      <AccordionTrigger className="py-3 hover:no-underline [&[data-state=open]]:pb-2">
        <span className="flex min-w-0 flex-1 items-center gap-3 pr-2">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{title}</span>
            <Badge
              variant="outline"
              className="h-5 shrink-0 rounded-full px-2 text-[11px] font-medium tabular-nums"
            >
              {items.length}
            </Badge>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pt-0">
        {items.length > 0 ? (
          <div className="max-h-[min(55vh,520px)] space-y-2.5 overflow-y-auto pb-1">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-slate-900">
                    {item.evidenceText}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {item.locationHint && (
                      <Badge
                        variant="outline"
                        className="h-4 rounded-md px-1.5 text-[10px]"
                      >
                        {item.locationHint}
                      </Badge>
                    )}
                    {item.code && (
                      <Badge className="h-4 rounded-md bg-purple-100 px-1.5 text-[10px] text-purple-800">
                        {item.code}
                      </Badge>
                    )}
                    {item.value != null && (
                      <Badge className="h-4 rounded-md bg-orange-100 px-1.5 text-[10px] text-orange-800">
                        {item.value}% off
                      </Badge>
                    )}
                    {item.sourcePages && item.sourcePages.length > 0 && (
                      <Badge className="h-4 rounded-md bg-blue-100 px-1.5 text-[10px] text-blue-800 truncate">
                        Found on: {item.sourcePages.slice(0, 2).join(", ")}
                        {item.sourcePages.length > 2
                          ? ` +${item.sourcePages.length - 2}`
                          : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            <Circle className="h-4 w-4 text-slate-300" />
            {emptyLabel}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SnapshotDetailClient({
  snapshotId,
  workspaceId,
}: SnapshotDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const trpc = useTRPC();
  const downloadPdfMutation = useMutation(
    trpc.snapshots.downloadPDF.mutationOptions()
  );

  const {
    data: snapshot,
    status: snapshotStatus,
    error: snapshotError,
  } = useQuery({
    ...trpc.snapshots.get.queryOptions({ workspaceId, id: snapshotId }),
    enabled: !!workspaceId && !!snapshotId,
    retry: false,
  });

  const { data: competitors } = useQuery({
    ...trpc.competitors.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const { data: allSnapshots } = useQuery({
    ...trpc.snapshots.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId && !!snapshot,
  });

  const { data: changes } = useQuery({
    ...trpc.changeEvents.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId && !!snapshot,
  });

  const competitorsList = competitors ?? [];
  const allSnapshotsList = allSnapshots ?? [];
  const changesList = changes ?? [];

  const { data: ownStore } = useQuery({
    ...trpc.ownStore.get.queryOptions({ workspaceId }),
    enabled: !!workspaceId,
  });

  const { data: storeProducts = [] } = useQuery({
    ...trpc.ownStore.products.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId && !!ownStore,
  });

  const competitor =
    snapshot?.competitor ??
    competitorsList.find((c) => c.id === snapshot?.competitorId);

  const previousSnapshot = allSnapshotsList
    .filter(
      (s) =>
        s.competitorId === snapshot?.competitorId &&
        (snapshot ? new Date(s.capturedAt) < new Date(snapshot.capturedAt) : false)
    )
    .sort(
      (a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
    )[0];

  const relatedChange = changesList.find(
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
          toast({ title: "Report downloaded", description: "Your PDF report is ready." });
        },
        onError: (error) => {
          toast({
            title: "Download failed",
            description:
              error instanceof Error ? error.message : "Could not generate PDF report.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (snapshotStatus === "pending") {
    return (
      <div>
        <Skeleton className="mb-8 h-12 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (snapshotStatus === "error" || !snapshot) {
    const notFound =
      snapshotError instanceof TRPCClientError &&
      snapshotError.data?.code === "NOT_FOUND";
    return (
      <EmptyState
        icon={Camera}
        title={notFound ? "Snapshot not found" : "Unable to load snapshot"}
        description={
          notFound
            ? "The snapshot you're looking for doesn't exist."
            : "Something went wrong. Try again or go back to the list."
        }
        action={{ label: "Back to Snapshots", onClick: () => router.push("/snapshots") }}
      />
    );
  }

  const signals = snapshot.extractedSignals;
  const { score, grade, interpretation } = computeScore(signals);
  const intensity = getIntensityLabel(score);
  const gradeColor = getGradeColor(grade);
  const circumference = 2 * Math.PI * 85; // r=85

  // Derive offer sections — prefer rich payload when available
  const richOffers =
    snapshot.captureSource === "marketing_tool" && snapshot.marketingToolPayload
      ? extractRichOffers(snapshot.marketingToolPayload)
      : null;

  const simpleSections = buildOfferSections(signals);

  /** Non-empty sections start expanded; empty stay collapsed to save space */
  const offerStackDefaultOpen: string[] = [];
  if (richOffers) {
    if ((richOffers.discounts?.length ?? 0) > 0) offerStackDefaultOpen.push("stack-discounts");
    if (richOffers.shippingThreshold) offerStackDefaultOpen.push("stack-shipping");
    if ((richOffers.bundles?.length ?? 0) > 0) offerStackDefaultOpen.push("stack-bundles");
    if ((richOffers.gifts?.length ?? 0) > 0) offerStackDefaultOpen.push("stack-gifts");
    if ((richOffers.cartIncentives?.length ?? 0) > 0) offerStackDefaultOpen.push("stack-cart");
    if ((richOffers.announcements?.length ?? 0) > 0) offerStackDefaultOpen.push("stack-urgency");
  } else {
    if (simpleSections.discounts.length) offerStackDefaultOpen.push("simple-discounts");
    if (simpleSections.shipping.length) offerStackDefaultOpen.push("simple-shipping");
    if (simpleSections.bundles.length) offerStackDefaultOpen.push("simple-bundles");
    if (simpleSections.cart.length) offerStackDefaultOpen.push("simple-cart");
    if (simpleSections.policy.length) offerStackDefaultOpen.push("simple-policy");
  }

  const metricsData = richOffers
    ? {
        discounts: richOffers.discounts?.length ?? 0,
        shipping: richOffers.shippingThreshold ? 1 : 0,
        bundles: richOffers.bundles?.length ?? 0,
        gifts: richOffers.gifts?.length ?? 0,
        cart: richOffers.cartIncentives?.length ?? 0,
        urgency: richOffers.announcements?.length ?? 0,
      }
    : {
        discounts: simpleSections.discounts.length,
        shipping: simpleSections.shipping.length,
        bundles: simpleSections.bundles.length,
        gifts: 0,
        cart: simpleSections.cart.length,
        urgency: 0,
      };

  const metricItems = [
    { label: "Discounts", value: metricsData.discounts, icon: Percent, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Shipping", value: metricsData.shipping, icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Bundles", value: metricsData.bundles, icon: Package, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Gifts", value: metricsData.gifts, icon: Gift, color: "text-green-600", bg: "bg-green-50" },
    { label: "Cart", value: metricsData.cart, icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Urgency", value: metricsData.urgency, icon: Clock, color: "text-red-600", bg: "bg-red-50" },
  ];

  const renderSignalsCard = (
    sig: typeof snapshot.extractedSignals,
    title: string,
    isAfter = false
  ) => {
    const hasData = Object.keys(sig).some(
      (key) => key !== "confidence" && (sig as Record<string, unknown>)[key] != null
    );

    return (
      <div
        className={`rounded-2xl border-2 p-6 ${
          isAfter
            ? "border-green-200 bg-green-50/50"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <ConfidenceBadge confidence={sig.confidence} />
        </div>
        {!hasData ? (
          <p className="text-sm text-slate-500">No data available</p>
        ) : (
          <div className="space-y-3">
            {sig.promoText && (
              <div className="rounded-xl bg-purple-100/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-700">
                  Promotion
                </p>
                <p className="mt-1 text-sm font-medium text-purple-900">{sig.promoText}</p>
                {sig.discountPercent != null && (
                  <p className="mt-0.5 text-xs text-purple-700">Discount: {sig.discountPercent}%</p>
                )}
                {sig.discountCode && (
                  <p className="mt-0.5 text-xs text-purple-700">Code: {sig.discountCode}</p>
                )}
              </div>
            )}
            {sig.shippingText && (
              <div className="rounded-xl bg-blue-100/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  Shipping
                </p>
                <p className="mt-1 text-sm font-medium text-blue-900">{sig.shippingText}</p>
                {sig.shippingThreshold !== undefined && (
                  <p className="mt-0.5 text-xs text-blue-700">
                    Threshold: ${sig.shippingThreshold}
                  </p>
                )}
              </div>
            )}
            {sig.bundleText && (
              <div className="rounded-xl bg-orange-100/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
                  Bundle Offer
                </p>
                <p className="mt-1 text-sm font-medium text-orange-900">{sig.bundleText}</p>
              </div>
            )}
            {sig.cartIncentiveText && (
              <div className="rounded-xl bg-green-100/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">
                  Cart Incentive
                </p>
                <p className="mt-1 text-sm font-medium text-green-900">{sig.cartIncentiveText}</p>
              </div>
            )}
            {(sig.deliveryText ?? sig.returnsText) && (
              <div className="rounded-xl bg-indigo-100/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                  Delivery & Returns
                </p>
                {sig.deliveryText && (
                  <p className="mt-1 text-sm font-medium text-indigo-900">
                    Delivery: {sig.deliveryText}
                  </p>
                )}
                {sig.returnsText && (
                  <p className="mt-1 text-sm font-medium text-indigo-900">
                    Returns: {sig.returnsText}
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
      {/* Header */}
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
          title="Snapshot Report"
          description={`${competitor?.name ?? "Unknown Competitor"} · ${formatTime(snapshot.capturedAt)}`}
          action={
            <div className="flex items-center gap-2">
              {competitor?.baseUrl && (
                <Button variant="outline" size="sm" asChild className="gap-1.5">
                  <Link href={competitor.baseUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit site
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2 no-print"
                disabled={downloadPdfMutation.isPending}
              >
                <Download className="h-4 w-4" />
                {downloadPdfMutation.isPending ? "Generating PDF…" : "Download Report"}
              </Button>
            </div>
          }
        />
      </div>

      {/* Own store banner */}
      {ownStore && (storeProducts.length > 0 || ownStore.platform === "shopify") && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-900">
                Your store: {ownStore.storeName}
              </span>
              <span className="text-xs text-slate-600">
                {storeProducts.length} products · Compare your offers
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/store">Manage store</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Change detected banner */}
      {relatedChange && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-sm font-semibold text-blue-900">Change Detected</h3>
          <p className="mt-1 text-sm text-blue-800">{relatedChange.summary}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => router.push(`/changes?selected=${relatedChange.id}`)}
          >
            View Change Details
          </Button>
        </div>
      )}

      {/* ── Score Ring + interpretation ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Ring */}
          <div className="flex justify-center">
            <div className="relative">
              <svg className="h-56 w-56 -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="12"
                />
                <circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke="url(#dashScoreGrad)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="dashScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={`text-5xl font-bold bg-gradient-to-br ${gradeColor} bg-clip-text text-transparent`}
                >
                  {grade}
                </div>
                <div className="text-xl font-semibold text-slate-900">
                  {score}/100
                </div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">
                  Promo Intensity
                </div>
              </div>
            </div>
          </div>

          {/* Interpretation + metric tiles */}
          <div className="flex flex-col justify-center space-y-5">
            <div>
              <Badge className={intensity.className}>{intensity.label}</Badge>
              <p className="mt-3 text-lg text-slate-700 leading-relaxed">
                {interpretation}
              </p>
            </div>

            {/* Metric tiles */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {metricItems.map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className={`rounded-xl ${bg} p-3 text-center`}
                >
                  <Icon className={`mx-auto h-5 w-5 ${color}`} />
                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {value}
                  </div>
                  <div className="text-[11px] text-slate-600">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Offer Stack ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          Offer Stack Detected
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Expand or collapse each category (empty ones start collapsed). Long lists scroll inside the panel;
          cards sit in a multi-column grid and align to the top of each row.
        </p>
        {richOffers ? (
          <Accordion
            key={snapshot.id}
            type="multiple"
            defaultValue={offerStackDefaultOpen}
            className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <RichOfferBlock
              sectionId="stack-discounts"
              title="Discounts & Codes"
              items={richOffers.discounts ?? []}
              icon={Percent}
              accentClass="bg-purple-100 text-purple-600"
              emptyLabel="No discounts detected"
            />
            <RichOfferBlock
              sectionId="stack-shipping"
              title="Free Shipping"
              items={
                richOffers.shippingThreshold
                  ? [richOffers.shippingThreshold as RichItem]
                  : []
              }
              icon={Truck}
              accentClass="bg-blue-100 text-blue-600"
              emptyLabel="No free shipping detected"
            />
            <RichOfferBlock
              sectionId="stack-bundles"
              title="Bundle Offers"
              items={richOffers.bundles ?? []}
              icon={Package}
              accentClass="bg-orange-100 text-orange-600"
              emptyLabel="No bundles detected"
            />
            <RichOfferBlock
              sectionId="stack-gifts"
              title="Gifts & Perks"
              items={richOffers.gifts ?? []}
              icon={Gift}
              accentClass="bg-green-100 text-green-600"
              emptyLabel="No gifts detected"
            />
            <RichOfferBlock
              sectionId="stack-cart"
              title="Cart Incentives"
              items={richOffers.cartIncentives ?? []}
              icon={ShoppingCart}
              accentClass="bg-indigo-100 text-indigo-600"
              emptyLabel="No cart incentives detected"
            />
            <RichOfferBlock
              sectionId="stack-urgency"
              title="Urgency Signals"
              items={(richOffers.announcements ?? []).map((a) => ({
                evidenceText: typeof a === "string" ? a : (a as { text: string }).text,
                locationHint: "Announcement bar",
                sourcePages:
                  typeof a === "object" && (a as { sourcePages?: string[] }).sourcePages
                    ? (a as { sourcePages?: string[] }).sourcePages
                    : [],
              }))}
              icon={Clock}
              accentClass="bg-red-100 text-red-600"
              emptyLabel="No urgency signals detected"
            />
          </Accordion>
        ) : (
          <Accordion
            key={snapshot.id}
            type="multiple"
            defaultValue={offerStackDefaultOpen}
            className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <OfferBlock
              sectionId="simple-discounts"
              title="Discounts & Promos"
              items={simpleSections.discounts}
              icon={Tag}
              accentClass="bg-purple-100 text-purple-600"
              emptyLabel="No discounts detected"
            />
            <OfferBlock
              sectionId="simple-shipping"
              title="Shipping Incentives"
              items={simpleSections.shipping}
              icon={Truck}
              accentClass="bg-blue-100 text-blue-600"
              emptyLabel="No shipping offers detected"
            />
            <OfferBlock
              sectionId="simple-bundles"
              title="Bundle Offers"
              items={simpleSections.bundles}
              icon={Package}
              accentClass="bg-orange-100 text-orange-600"
              emptyLabel="No bundles detected"
            />
            <OfferBlock
              sectionId="simple-cart"
              title="Cart Incentives"
              items={simpleSections.cart}
              icon={ShoppingCart}
              accentClass="bg-indigo-100 text-indigo-600"
              emptyLabel="No cart incentives detected"
            />
            <OfferBlock
              sectionId="simple-policy"
              title="Delivery & Returns"
              items={simpleSections.policy}
              icon={Truck}
              accentClass="bg-green-100 text-green-600"
              emptyLabel="No policy signals detected"
            />
          </Accordion>
        )}
      </div>

      {/* ── Before / After comparison ─────────────────────────────────────── */}
      {previousSnapshot && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Change Comparison
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {renderSignalsCard(previousSnapshot.extractedSignals, "Before")}
            {renderSignalsCard(snapshot.extractedSignals, "After (Current)", true)}
          </div>
        </div>
      )}

      {/* ── Screenshot ────────────────────────────────────────────────────── */}
      {snapshot.screenshotUrl ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Screenshot</h2>
          <div className="relative h-[420px] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 bg-slate-100">
            <div className="relative w-full min-h-full">
              <Image
                src={snapshot.screenshotUrl}
                alt="Snapshot screenshot"
                width={1920}
                height={5000}
                className="w-full min-w-full rounded-xl object-contain object-top"
                unoptimized
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
          <Camera className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No screenshot available for this snapshot
          </p>
        </div>
      )}

      {/* ── Metadata ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Metadata</h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-sm font-medium text-slate-500">Competitor</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {competitor?.name ?? "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Captured At</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {formatTime(snapshot.capturedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Confidence</dt>
            <dd className="mt-1">
              <ConfidenceBadge confidence={snapshot.extractedSignals.confidence} />
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Capture Source</dt>
            <dd className="mt-1">
              <Badge
                variant="outline"
                className={
                  snapshot.captureSource === "marketing_tool"
                    ? "border-violet-200 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }
              >
                {snapshot.captureSource === "marketing_tool"
                  ? "Free tool"
                  : "Live capture"}
              </Badge>
            </dd>
          </div>
          {snapshot.firecrawlChangeStatus && (
            <div>
              <dt className="text-sm font-medium text-slate-500">Change Status</dt>
              <dd className="mt-1">
                <Badge
                  variant="outline"
                  className={
                    snapshot.firecrawlChangeStatus === "changed"
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : snapshot.firecrawlChangeStatus === "new"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }
                >
                  {snapshot.firecrawlChangeStatus}
                </Badge>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-slate-500">Snapshot ID</dt>
            <dd className="mt-1 font-mono text-xs text-slate-500">{snapshot.id}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
