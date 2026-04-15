import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

function signingSecret(): string {
  return env.BETTER_AUTH_SECRET;
}

export function signPendingSnapshotToken(pendingId: string): string {
  const sig = createHmac("sha256", signingSecret())
    .update(pendingId)
    .digest("hex");
  return `${pendingId}.${sig}`;
}

/** Returns pendingId if valid, else null */
export function verifyPendingSnapshotCookieValue(
  cookieValue: string | undefined
): string | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const lastDot = cookieValue.lastIndexOf(".");
  const pendingId = cookieValue.slice(0, lastDot);
  const sig = cookieValue.slice(lastDot + 1);
  if (!pendingId || !sig) return null;
  const expected = createHmac("sha256", signingSecret())
    .update(pendingId)
    .digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return pendingId;
}
