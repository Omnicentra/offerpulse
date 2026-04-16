const DASHBOARD =
  process.env.NEXT_PUBLIC_DASHBOARD_APP_URL ?? "http://localhost:3001";

export interface PendingBootstrapParams {
  pendingId: string;
  /** App pathname only; must be /signup or /login */
  next?: "/signup" | "/login";
  competitorUrl?: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export function buildPendingBootstrapUrl(params: PendingBootstrapParams): string {
  const u = new URL(`${DASHBOARD.replace(/\/$/, "")}/api/onboarding/pending-bootstrap`);
  u.searchParams.set("pendingId", params.pendingId);
  u.searchParams.set("next", params.next ?? "/signup");
  if (params.competitorUrl) {
    u.searchParams.set("competitorUrl", params.competitorUrl);
  }
  if (params.source) u.searchParams.set("source", params.source);
  if (params.utm_source) u.searchParams.set("utm_source", params.utm_source);
  if (params.utm_medium) u.searchParams.set("utm_medium", params.utm_medium);
  if (params.utm_campaign) {
    u.searchParams.set("utm_campaign", params.utm_campaign);
  }
  return u.toString();
}
