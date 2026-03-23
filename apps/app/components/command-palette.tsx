"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  Lightbulb,
  Search,
  Settings,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/src/lib/trpc/client";
import { cn } from "@/lib/utils";
interface QuickActionDef {
  id: string;
  label: string;
  href: string;
  keywords: string[];
  Icon: typeof Settings;
}

const QUICK_ACTIONS: QuickActionDef[] = [
  { id: "qa-settings", label: "Settings", href: "/settings", keywords: ["settings", "config", "account"], Icon: Settings },
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
  | { key: string; kind: "quick"; label: string; sub?: string; href: string; Icon: typeof Settings }
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
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(query);
      setSelectedIndex(0);
    }, 200);
    return () => window.clearTimeout(t);
  }, [query]);

  const handleDialogOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery("");
        setDebouncedQ("");
      }
      setSelectedIndex(0);
      onOpenChange(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
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

  const safeIndex = rows.length === 0 ? -1 : Math.min(selectedIndex, rows.length - 1);
  const selectedKey = safeIndex >= 0 ? rows[safeIndex]!.key : null;

  useLayoutEffect(() => {
    if (!selectedKey || !listRef.current) return;
    const el = rowRefs.current.get(selectedKey);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedKey]);

  const navigateTo = useCallback(
    (href: string) => {
      handleDialogOpenChange(false);
      router.push(href);
    },
    [handleDialogOpenChange, router]
  );

  const rowCount = rows.length;
  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (rowCount === 0) return 0;
        const idx = Math.min(prev, rowCount - 1);
        return Math.max(0, Math.min(rowCount - 1, idx + delta));
      });
    },
    [rowCount]
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (safeIndex >= 0) navigateTo(rows[safeIndex]!.href);
    } else if (e.key === "Home") {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (rows.length > 0) setSelectedIndex(rows.length - 1);
    }
  };

  const showSkeleton = isPending && data === undefined && !!workspaceId;
  const empty =
    !showSkeleton &&
    rows.length === 0 &&
    !isFetching &&
    (!workspaceId || data !== undefined);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        showClose
        className={cn(
          "flex max-h-[min(80vh,560px)] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:left-[50%] sm:top-[50%] sm:max-h-[min(80vh,560px)] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%]",
          "max-md:fixed max-md:inset-x-4 max-md:top-[max(1rem,env(safe-area-inset-top))] max-md:max-h-[min(85dvh,640px)] max-md:translate-x-0 max-md:translate-y-0"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <DialogDescription className="sr-only">
          Search competitors, changes, and recommendations, or jump to a page.
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search or jump to…"
            className="h-10 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        <div
          ref={listRef}
          role="listbox"
          aria-label="Results"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
        >
          {showSkeleton && (
            <div className="space-y-2 px-2 py-3" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-11 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          )}

          {empty && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">
              No matches. Try another search.
            </p>
          )}

          {!showSkeleton && rows.length > 0 && (
            <div className="space-y-4 pb-2">
              <PaletteSection
                title="Quick actions"
                rows={rows.filter((r) => r.kind === "quick")}
                selectedKey={selectedKey}
                rowRefs={rowRefs}
                onSelectKey={(key) => {
                  const i = rows.findIndex((r) => r.key === key);
                  if (i >= 0) setSelectedIndex(i);
                }}
                onActivate={navigateTo}
              />
              <PaletteSection
                title="Competitors"
                rows={rows.filter((r) => r.kind === "competitor")}
                selectedKey={selectedKey}
                rowRefs={rowRefs}
                onSelectKey={(key) => {
                  const i = rows.findIndex((r) => r.key === key);
                  if (i >= 0) setSelectedIndex(i);
                }}
                onActivate={navigateTo}
              />
              <PaletteSection
                title="Changes"
                rows={rows.filter((r) => r.kind === "change")}
                selectedKey={selectedKey}
                rowRefs={rowRefs}
                onSelectKey={(key) => {
                  const i = rows.findIndex((r) => r.key === key);
                  if (i >= 0) setSelectedIndex(i);
                }}
                onActivate={navigateTo}
              />
              <PaletteSection
                title="Recommendations"
                rows={rows.filter((r) => r.kind === "recommendation")}
                selectedKey={selectedKey}
                rowRefs={rowRefs}
                onSelectKey={(key) => {
                  const i = rows.findIndex((r) => r.key === key);
                  if (i >= 0) setSelectedIndex(i);
                }}
                onActivate={navigateTo}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
          <span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">⌘K</kbd> /{" "}
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">/</kbd> open
          </span>
          <span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">↑</kbd>{" "}
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">↓</kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">↵</kbd>{" "}
            open
          </span>
          <span>
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">esc</kbd>{" "}
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PaletteSectionProps {
  title: string;
  rows: PaletteRow[];
  selectedKey: string | null;
  rowRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  onSelectKey: (key: string) => void;
  onActivate: (href: string) => void;
}

function PaletteSection({
  title,
  rows,
  selectedKey,
  rowRefs,
  onSelectKey,
  onActivate,
}: PaletteSectionProps) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="space-y-0.5" role="group" aria-label={title}>
        {rows.map((row) => {
          const Icon = row.Icon;
          const isSelected = row.key === selectedKey;
          return (
            <button
              key={row.key}
              type="button"
              role="option"
              aria-selected={isSelected}
              ref={(el) => {
                if (el) rowRefs.current.set(row.key, el);
                else rowRefs.current.delete(row.key);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                isSelected ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
              )}
              onMouseEnter={() => onSelectKey(row.key)}
              onClick={() => onActivate(row.href)}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-medium">{row.label}</span>
                {row.sub ? (
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{row.sub}</span>
                ) : null}
              </span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
            </button>
          );
        })}
      </div>
    </div>
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
