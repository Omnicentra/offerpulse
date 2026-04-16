/**
 * After email/password auth, attach a pending marketing-tool snapshot if the HttpOnly cookie is set.
 */
const FLOW_DEBUG = "[pending-offer-flow:client]";

function debugClient(message: string, payload?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    const dbg = globalThis.console.debug;
    if (typeof dbg === "function") {
      dbg.call(globalThis.console, FLOW_DEBUG, message, payload ?? {});
    }
  }
}

export async function consumePendingSnapshotAndNavigate(
  navigate: (path: string) => void,
  fallbackPath = "/"
): Promise<void> {
  debugClient("POST /api/onboarding/consume-pending-snapshot", { fallbackPath });
  try {
    const res = await fetch("/api/onboarding/consume-pending-snapshot", {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json()) as {
      next?: string;
      ok?: boolean;
      reason?: string;
      duplicate?: boolean;
      competitorId?: string;
    };
    debugClient("consume response", {
      status: res.status,
      ok: data.ok,
      reason: data.reason,
      duplicate: data.duplicate,
      next: data.next,
      competitorId: data.competitorId,
    });
    navigate(typeof data.next === "string" ? data.next : fallbackPath);
  } catch (e) {
    debugClient("consume fetch failed", {
      error: e instanceof Error ? e.message : String(e),
    });
    navigate(fallbackPath);
  }
}
