import { PENDING_SNAPSHOT_COOKIE_NAME } from "./constants";

function secureSuffix(): string {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

/** Set pending snapshot cookie (signed token as value). */
export function buildSetPendingSnapshotCookieHeader(
  signedToken: string,
  maxAgeSeconds: number
): string {
  return `${PENDING_SNAPSHOT_COOKIE_NAME}=${encodeURIComponent(signedToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secureSuffix()}`;
}

export function buildClearPendingSnapshotCookieHeader(): string {
  return `${PENDING_SNAPSHOT_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureSuffix()}`;
}
