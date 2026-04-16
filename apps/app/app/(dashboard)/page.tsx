import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getQueryClient, trpc } from "@/src/lib/trpc/server";
import { auth } from "@/src/server/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { ChangeTypeBadge } from "@/components/ui/change-type-badge";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  Lightbulb,
  AlertCircle,
  ArrowRight,
  Plus,
  TrendingDown,
  Minus,
} from "lucide-react";

function formatDistanceToNow(date: Date): string {
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length]!;
}

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) redirect("/login");

  const queryClient = getQueryClient();

  const [competitors, changeEvents, recommendations, weeklyPulses] =
    await Promise.all([
      queryClient.fetchQuery(trpc.competitors.list.queryOptions({ workspaceId })),
      queryClient.fetchQuery(trpc.changeEvents.list.queryOptions({ workspaceId })),
      queryClient.fetchQuery(trpc.recommendations.list.queryOptions({ workspaceId })),
      queryClient.fetchQuery(trpc.weeklyPulse.list.queryOptions({ workspaceId })),
    ]);

  const activeCompetitors = competitors.filter((c) => c.isActive).length;

  // eslint-disable-next-line react-hooks/purity -- RSC runs once per request; Date.now() is safe
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const recentChanges = changeEvents.filter((e) => new Date(e.detectedAt) > sevenDaysAgo);
  const priorPeriodChanges = changeEvents.filter((e) => {
    const d = new Date(e.detectedAt);
    return d > fourteenDaysAgo && d <= sevenDaysAgo;
  });

  const changesTrend =
    priorPeriodChanges.length > 0
      ? (() => {
          const pct = ((recentChanges.length - priorPeriodChanges.length) / priorPeriodChanges.length) * 100;
          const trend = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
          const sign = pct > 0 ? "+" : "";
          return { value: `${sign}${Math.round(pct)}%`, trend } as const;
        })()
      : undefined;

  const highConfidenceChanges = recentChanges.filter((e) => e.confidence === "high").length;
  const openRecommendations = recommendations.filter((r) => r.status === "open").length;

  const latestChanges = changeEvents.slice(0, 8);
  const currentPulse = weeklyPulses[0];

  type Trend = { value: string; trend: "up" | "down" | "neutral" };
  type Kpi = {
    label: string;
    value: number;
    trend?: Trend;
    icon: LucideIcon;
    accent: string;
    iconBg: string;
  };

  const kpis: Kpi[] = [
    {
      label: "Changes · 7 days",
      value: recentChanges.length,
      trend: changesTrend,
      icon: TrendingUp,
      accent: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "High confidence",
      value: highConfidenceChanges,
      icon: AlertCircle,
      accent: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Active competitors",
      value: activeCompetitors,
      icon: Users,
      accent: "text-violet-600",
      iconBg: "bg-violet-50",
    },
    {
      label: "Open recommendations",
      value: openRecommendations,
      icon: Lightbulb,
      accent: "text-amber-600",
      iconBg: "bg-amber-50",
    },
  ];

  return (
    <div className="mx-auto flex w-full flex-1 flex-col gap-5" style={{ maxWidth: 1400 }}>

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Overview</h1>
          <p className="mt-0.5 text-sm text-slate-500">Monitor competitor activity and track key changes</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" asChild>
          <Link href="/competitors/new">
            <Plus className="h-3.5 w-3.5" />
            Add Competitor
          </Link>
        </Button>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, trend, icon: Icon, accent, iconBg }) => (
          <div
            key={label}
            className="group flex items-center gap-3.5 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.08)]"
          >
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
              <Icon className={cn("h-3.5 w-3.5", accent)} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium uppercase tracking-widest text-slate-400">
                {label}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                  {value}
                </p>
                {trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-semibold",
                      trend.trend === "up" && "text-emerald-600",
                      trend.trend === "down" && "text-red-500",
                      trend.trend === "neutral" && "text-slate-400",
                    )}
                  >
                    {trend.trend === "up" && <TrendingUp className="h-3 w-3" />}
                    {trend.trend === "down" && <TrendingDown className="h-3 w-3" />}
                    {trend.trend === "neutral" && <Minus className="h-3 w-3" />}
                    {trend.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_380px]">

        {/* Latest Changes */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Latest Changes</h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-slate-800"
            >
              <Link href="/changes">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {latestChanges.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={TrendingUp}
                title="No changes yet"
                description="Changes will appear here as we detect them from your competitors"
                action={{ label: "Add Competitor", href: "/competitors/new" }}
              />
            </div>
          ) : (
            <div className="flex-1 divide-y divide-slate-100/80 overflow-y-auto">
              {latestChanges.map((change) => {
                const competitor = competitors.find((c) => c.id === change.competitorId);
                const name = competitor?.name ?? "Unknown";
                const initial = name.charAt(0).toUpperCase();
                const avatarColor = getAvatarColor(name);

                return (
                  <Link
                    key={change.id}
                    href={`/changes?selected=${change.id}`}
                    className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50/80"
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                        avatarColor,
                      )}
                    >
                      {initial}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[13px] font-medium text-slate-800">{name}</span>
                        <ChangeTypeBadge type={change.type} className="h-4 px-1.5 text-[10px]" />
                        <ConfidenceBadge confidence={change.confidence} className="h-4 px-1.5 text-[10px]" />
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {change.summary}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="mt-0.5 shrink-0 text-[11px] tabular-nums text-slate-400">
                      {formatDistanceToNow(new Date(change.detectedAt))}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* This Week's Pulse */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">This Week&apos;s Pulse</h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-7 gap-1 px-2 text-xs text-slate-500 hover:text-slate-800"
            >
              <Link href="/weekly-pulse">
                Full report
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          {currentPulse ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Totals inline */}
              <div className="flex items-center gap-6 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    Total changes
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    {currentPulse.totals.changes}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    Promo changes
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    {currentPulse.totals.promos}
                  </p>
                </div>
              </div>

              {/* Highlights */}
              {currentPulse.highlights && currentPulse.highlights.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Key highlights
                  </p>
                  {currentPulse.highlights.slice(0, 3).map((highlight, idx) => (
                    <div
                      key={idx}
                      className="group relative overflow-hidden rounded-lg border border-slate-100 bg-white px-3 py-2.5 transition-colors hover:border-blue-200/70 hover:bg-blue-50/30"
                    >
                      {/* Left accent */}
                      <div className="absolute inset-y-0 left-0 w-[2px] bg-blue-400/60" />
                      <p className="text-[13px] font-medium leading-snug text-slate-800 pl-1">
                        {highlight.title}
                      </p>
                      {highlight.detail && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500 pl-1">
                          {highlight.detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 h-full">
              <EmptyState
                icon={TrendingUp}
                title="No pulse data yet"
                description="Weekly pulse reports will appear here"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
