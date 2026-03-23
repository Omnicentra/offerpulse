"use client";

import { observable } from "@legendapp/state";

const STORAGE_KEY = "offerpulse.commandPalette.recents.v1";
export const MAX_PALETTE_RECENTS = 5;

export type PaletteRecentEntity = "competitor" | "changeEvent" | "recommendation" | "quick";

export interface PaletteRecentEntry {
  entity: PaletteRecentEntity;
  /** Stable id: competitor id, change id, recommendation id, or quick action id (e.g. qa-billing). */
  id: string;
  href: string;
  label: string;
  sub?: string;
  visitedAt: number;
}

interface PaletteRecentsPersisted {
  byWorkspace: Record<string, PaletteRecentEntry[]>;
}

function readFromStorage(): PaletteRecentsPersisted {
  if (typeof window === "undefined") {
    return { byWorkspace: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byWorkspace: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "byWorkspace" in parsed &&
      parsed.byWorkspace !== null &&
      typeof parsed.byWorkspace === "object"
    ) {
      return parsed as PaletteRecentsPersisted;
    }
  } catch {
    /* private mode / corrupt */
  }
  return { byWorkspace: {} };
}

function writeToStorage(value: PaletteRecentsPersisted) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* quota / blocked */
  }
}

/** Workspace-keyed command palette recents; persisted to localStorage. */
export const paletteRecents$ = observable<PaletteRecentsPersisted>(readFromStorage());

if (typeof window !== "undefined") {
  paletteRecents$.onChange(() => {
    writeToStorage(paletteRecents$.peek());
  });
}

export function recentEntryKey(entry: Pick<PaletteRecentEntry, "entity" | "id">): string {
  switch (entry.entity) {
    case "quick":
      return `q-${entry.id}`;
    case "competitor":
      return `c-${entry.id}`;
    case "changeEvent":
      return `e-${entry.id}`;
    case "recommendation":
      return `r-${entry.id}`;
  }
}

/**
 * Record an open from the command palette (browser-only). Call right before navigation.
 */
export function recordPaletteRecent(
  workspaceId: string,
  entry: Omit<PaletteRecentEntry, "visitedAt">
): void {
  if (!workspaceId) return;

  const now = Date.now();
  paletteRecents$.set((prev) => {
    const byWorkspace = { ...prev.byWorkspace };
    const current = byWorkspace[workspaceId] ?? [];
    const k = recentEntryKey(entry);
    const rest = current.filter((e) => recentEntryKey(e) !== k);
    byWorkspace[workspaceId] = [{ ...entry, visitedAt: now }, ...rest].slice(0, MAX_PALETTE_RECENTS);
    return { byWorkspace };
  });
}
