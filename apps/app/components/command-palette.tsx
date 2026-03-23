"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  CreditCard,
  Lightbulb,
  Store,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTRPC } from "@/src/lib/trpc/client";
import { cn } from "@/lib/utils";

interface QuickActionDef {
  id: string;
  label: string;
  href: string;
  keywords: string[];
  Icon: typeof CreditCard;
}

const QUICK_ACTIONS: QuickActionDef[] = [
  {
    id: "qa-billing",
    label: "Billing",
    href: "/settings/billing",
    keywords: ["billing", "plan", "subscription", "invoice", "payment", "trial", "stripe"],
    Icon: CreditCard,
  },
  {
    id: "qa-store",
    label: "My Store",
    href: "/settings/store",
    keywords: ["store", "my store", "shop", "products", "promos", "import", "shopify"],
    Icon: Store,
  },
  { id: "qa-alerts", label: "Alerts", href: "/alerts", keywords: ["alerts", "notifications"], Icon: Bell },
  {
    id: "qa-digests",
    label: "Alert digests",
    href: "/alerts?tab=digests",
    keywords: ["digest", "digests", "weekly", "summary", "email"],
    Icon: CalendarClock,
  },
  {
    id: "qa-pulse",
    label: "Weekly Pulse",
    href: "/weekly-pulse",
    keywords: ["pulse", "weekly", "report"],
    Icon: TrendingUp,
  },
  {
    id: "qa-recs",
    label: "Recommendations",
    href: "/recommendations",
    keywords: ["recommend", "recommendations", "actions", "ai"],
    Icon: Lightbulb,
  },
  {
    id: "qa-changes",
    label: "Changes",
    href: "/changes",
    keywords: ["changes", "feed", "updates", "detected"],
    Icon: Zap,
  },
  {
    id: "qa-competitors",
    label: "Competitors",
    href: "/competitors",
    keywords: ["competitors", "list", "tracked"],
    Icon: Building2,
  },
  {
    id: "qa-add-comp",
    label: "Add competitor",
    href: "/competitors/new",
    keywords: ["add", "competitor", "new", "create"],
    Icon: UserPlus,
  },
];

type PaletteRow =
  | { key: string; kind: "quick"; label: string; sub?: string; href: string; Icon: typeof CreditCard }
  | { key: string; kind: "competitor"; label: string; sub: string; href: string; Icon: typeof Building2 }
  | { key: string; kind: "change"; label: string; sub: string; href: string; Icon: typeof Zap }
  | { key: string; kind: "recommendation"; label: string; sub: string; href: string; Icon: typeof Lightbulb };

function matchesQuickAction(action: QuickActionDef, qLower: string): boolean {
  if (!qLower) return true;
  if (action.label.toLowerCase().includes(qLower)) return true;
  return action.keywords.some((k) => k.includes(qLower) || qLower.includes(k));
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return el.closest("[contenteditable=\"true\"]") != null;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null | undefined;
}

export function CommandPalette({ open, onOpenChange, workspaceId }: CommandPaletteProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(query);
    }, 200);
    return () => window.clearTimeout(t);
  }, [query]);

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery("");
        setDebouncedQ("");
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const { data, isFetching, isPending } = useQuery({
    ...trpc.search.globalSearch.queryOptions({
      workspaceId: workspaceId ?? "",
      q: debouncedQ,
    }),
    enabled: open && !!workspaceId,
    placeholderData: (previousData) => previousData,
  });

  const qLower = debouncedQ.trim().toLowerCase();
  const quickFiltered = useMemo(
    () => QUICK_ACTIONS.filter((a) => matchesQuickAction(a, qLower)),
    [qLower]
  );

  const rows = useMemo((): PaletteRow[] => {
    const list: PaletteRow[] = [];
    for (const a of quickFiltered) {
      list.push({
        key: `q-${a.id}`,
        kind: "quick",
        label: a.label,
        href: a.href,
        Icon: a.Icon,
      });
    }
    if (!data) return list;
    for (const c of data.competitors) {
      list.push({
        key: `c-${c.id}`,
        kind: "competitor",
        label: c.name,
        sub: c.domain,
        href: `/competitors/${c.id}`,
        Icon: Building2,
      });
    }
    for (const e of data.changeEvents) {
      list.push({
        key: `e-${e.id}`,
        kind: "change",
        label: e.summary,
        sub: e.competitorName,
        href: `/changes?selected=${encodeURIComponent(e.id)}`,
        Icon: Zap,
      });
    }
    for (const r of data.recommendations) {
      list.push({
        key: `r-${r.id}`,
        kind: "recommendation",
        label: r.title,
        sub: r.competitorName,
        href: `/recommendations?selected=${encodeURIComponent(r.id)}`,
        Icon: Lightbulb,
      });
    }
    return list;
  }, [data, quickFiltered]);

  const navigateTo = useCallback(
    (href: string) => {
      handleDialogOpenChange(false);
      router.push(href);
    },
    [handleDialogOpenChange, router]
  );

  const showSkeleton = isPending && data === undefined && !!workspaceId;
  const empty =
    !showSkeleton &&
    rows.length === 0 &&
    !isFetching &&
    (!workspaceId || data !== undefined);

  const quickRows = rows.filter((r) => r.kind === "quick");
  const competitorRows = rows.filter((r) => r.kind === "competitor");
  const changeRows = rows.filter((r) => r.kind === "change");
  const recommendationRows = rows.filter((r) => r.kind === "recommendation");

  const footer = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
      <span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">⌘K</kbd> /{" "}
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">/</kbd> open
      </span>
      <span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">↑</kbd>{" "}
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">↓</kbd> navigate
      </span>
      <span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">↵</kbd> open
      </span>
      <span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">esc</kbd> close
      </span>
    </div>
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      ariaDescription="Search competitors, changes, and recommendations, or jump to a page."
      commandProps={{ shouldFilter: false }}
      dialogContentClassName={cn(
        "max-h-[min(80vh,560px)] w-[calc(100vw-2rem)] max-w-2xl sm:left-[50%] sm:top-[50%] sm:max-h-[min(80vh,560px)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%]",
        "max-md:fixed max-md:inset-x-4 max-md:top-[max(1rem,env(safe-area-inset-top))] max-md:max-h-[min(85dvh,640px)] max-md:translate-x-0 max-md:translate-y-0"
      )}
      dialogContentProps={{
        onOpenAutoFocus: (e) => e.preventDefault(),
      }}
      footer={footer}
    >
      <CommandInput
        ref={inputRef}
        value={query}
        onValueChange={setQuery}
        placeholder="Search or jump to…"
      />
      <CommandList>
        {showSkeleton && (
          <div className="space-y-2 px-2 py-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        )}

        {!showSkeleton && empty && <CommandEmpty>No matches. Try another search.</CommandEmpty>}

        {!showSkeleton && !empty && (
          <>
            {quickRows.length > 0 && (
              <CommandGroup heading="Quick actions">
                {quickRows.map((row) => (
                  <PaletteCommandItem key={row.key} row={row} onSelect={() => navigateTo(row.href)} />
                ))}
              </CommandGroup>
            )}
            {competitorRows.length > 0 && (
              <CommandGroup heading="Competitors">
                {competitorRows.map((row) => (
                  <PaletteCommandItem key={row.key} row={row} onSelect={() => navigateTo(row.href)} />
                ))}
              </CommandGroup>
            )}
            {changeRows.length > 0 && (
              <CommandGroup heading="Changes">
                {changeRows.map((row) => (
                  <PaletteCommandItem key={row.key} row={row} onSelect={() => navigateTo(row.href)} />
                ))}
              </CommandGroup>
            )}
            {recommendationRows.length > 0 && (
              <CommandGroup heading="Recommendations">
                {recommendationRows.map((row) => (
                  <PaletteCommandItem key={row.key} row={row} onSelect={() => navigateTo(row.href)} />
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function PaletteCommandItem({
  row,
  onSelect,
}: {
  row: PaletteRow;
  onSelect: () => void;
}) {
  const Icon = row.Icon;
  return (
    <CommandItem
      value={row.key}
      keywords={
        row.kind === "quick"
          ? [
              row.label,
              ...(QUICK_ACTIONS.find((a) => row.key === `q-${a.id}`)?.keywords ?? []),
            ]
          : [row.label, row.sub ?? ""]
      }
      onSelect={onSelect}
      className="items-start"
    >
      <Icon className="mt-0.5 text-slate-400" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-medium">{row.label}</span>
        {row.sub ? <span className="mt-0.5 block truncate text-xs text-slate-500">{row.sub}</span> : null}
      </span>
      <ArrowRight className="mt-0.5 shrink-0 text-slate-300" aria-hidden />
    </CommandItem>
  );
}

export function useCommandPaletteHotkeys(options: {
  onOpen: () => void;
  enabled?: boolean;
}): void {
  const { onOpen, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
        return;
      }
      if (e.key === "/" && !isEditableTarget(e.target)) {
        e.preventDefault();
        onOpen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onOpen]);
}
