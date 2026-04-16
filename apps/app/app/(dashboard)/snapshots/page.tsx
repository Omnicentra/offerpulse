"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AVATAR_COLORS,
  getAvatarColor,
} from "@/components/ui/dashboard-table-helpers";
import { useTRPC } from "@/src/lib/trpc/client";
import { useWorkspace } from "@/src/providers/workspace-provider";
import {
  Camera,
  Search,
  ArrowUpRight,
  Percent,
  Truck,
  Package,
  ShoppingCart,
  Zap,
  Clock,
} from "lucide-react";

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

  return { score, grade };
}

function getGradeGradient(grade: string) {
  if (grade.startsWith("A")) return { stroke: "#22c55e", text: "from-green-500 to-emerald-600" };
  if (grade.startsWith("B")) return { stroke: "#3b82f6", text: "from-blue-500 to-indigo-600" };
  if (grade.startsWith("C")) return { stroke: "#f59e0b", text: "from-yellow-500 to-orange-600" };
  return { stroke: "#94a3b8", text: "from-slate-400 to-slate-500" };
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Mini Score Ring ────────────────────────────────────────────────────────────

function MiniScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const { stroke, text } = getGradeGradient(grade);
  const id = `grad-${grade.replace("+", "p").replace("-", "m")}`;
  return (
    <div className="relative shrink-0">
      <svg width={56} height={56} className="-rotate-90" viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={r} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <circle
          cx={28}
          cy={28}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stroke} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-sm font-bold bg-gradient-to-br ${text} bg-clip-text text-transparent leading-none`}
        >
          {grade}
        </span>
        <span className="text-[10px] text-slate-400 leading-none mt-0.5">{score}</span>
      </div>
    </div>
  );
}

// ── Offer pills ────────────────────────────────────────────────────────────────

function OfferPills({ signals }: { signals: ExtractedSignals }) {
  const pills: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [];
  if (signals.promoText || signals.discountPercent != null || signals.discountCode)
    pills.push({ label: "Discount", icon: Percent });
  if (signals.shippingText || signals.shippingThreshold != null)
    pills.push({ label: "Shipping", icon: Truck });
  if (signals.bundleText)
    pills.push({ label: "Bundle", icon: Package });
  if (signals.cartIncentiveText)
    pills.push({ label: "Cart", icon: ShoppingCart });

  if (pills.length === 0)
    return <span className="text-xs text-slate-300">No offers</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
        >
          <Icon className="h-3 w-3" />
          {label}
        </span>
      ))}
    </div>
  );
}

// ── Skeleton grid ──────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

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
        <SkeletonGrid />
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
          action={{
            label: "View Competitors",
            onClick: () => router.push("/competitors"),
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
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
              {filtered?.length ?? 0}{" "}
              {(filtered?.length ?? 0) === 1 ? "snapshot" : "snapshots"}
            </span>
          </div>

          {/* Card grid */}
          {filtered?.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-400">
              No snapshots match your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered?.map((snapshot) => {
                const competitor = snapshot.competitor;
                const signals = snapshot.extractedSignals;
                const { score, grade } = computeScore(signals);
                const name = competitor?.name ?? "Unknown";
                const initial = name.charAt(0).toUpperCase();
                const avatarColor = name ? getAvatarColor(name) : AVATAR_COLORS[0];
                const isMarketingTool = snapshot.captureSource === "marketing_tool";
                const keySignal =
                  signals.promoText ||
                  signals.shippingText ||
                  signals.bundleText ||
                  null;

                const goToDetail = () => router.push(`/snapshots/${snapshot.id}`);

                return (
                  <div
                    key={snapshot.id}
                    role="button"
                    tabIndex={0}
                    className="group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={goToDetail}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToDetail();
                      }
                    }}
                  >
                    {/* Header: avatar + name + score ring */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColor} text-sm font-bold text-white shadow-sm`}
                        >
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatRelativeTime(new Date(snapshot.capturedAt))}
                          </p>
                        </div>
                      </div>
                      <MiniScoreRing score={score} grade={grade} />
                    </div>

                    {/* Offer pills */}
                    <OfferPills signals={signals} />

                    {/* Key signal preview */}
                    {keySignal && (
                      <p className="truncate text-xs text-slate-500 leading-relaxed">
                        {keySignal}
                      </p>
                    )}

                    {/* Footer badges */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <ConfidenceBadge confidence={signals.confidence} className="text-[11px] h-5 px-1.5" />
                        {isMarketingTool && (
                          <Badge className="h-5 bg-violet-100 px-1.5 text-[11px] text-violet-700">
                            <Zap className="mr-0.5 h-2.5 w-2.5" />
                            Free tool
                          </Badge>
                        )}
                        {snapshot.firecrawlChangeStatus && (
                          <Badge
                            variant="outline"
                            className={`h-5 px-1.5 text-[11px] ${
                              snapshot.firecrawlChangeStatus === "changed"
                                ? "border-orange-200 bg-orange-50 text-orange-700"
                                : snapshot.firecrawlChangeStatus === "new"
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-slate-200 bg-slate-50 text-slate-500"
                            }`}
                          >
                            <Clock className="mr-0.5 h-2.5 w-2.5" />
                            {snapshot.firecrawlChangeStatus}
                          </Badge>
                        )}
                      </div>
                      <span className="inline-flex h-6 items-center gap-0.5 px-1.5 text-[11px] font-semibold text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                        View
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
