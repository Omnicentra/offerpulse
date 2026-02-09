/**
 * Analytics tracking utility
 * In production, this would integrate with your analytics provider
 * (e.g., Segment, Mixpanel, PostHog, etc.)
 */

type AnalyticsEvent =
  | "offer_snapshot_submitted"
  | "offer_snapshot_success"
  | "offer_snapshot_error"
  | "cta_signup_clicked"
  | "pricing_viewed"
  | "page_viewed"
  | "marketing_cta_clicked"
  | "marketing_competitor_submitted"
  | "marketing_routing_error"

type EventProperties = Record<string, string | number | boolean | undefined>

const isDevelopment = process.env.NODE_ENV === "development"

/**
 * Track an analytics event
 * In development, logs to console
 * In production, would send to analytics provider
 */
export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  if (isDevelopment) {
    console.log("[Analytics]", event, properties || {})
  }

  // Production implementation would go here:
  // Example with Segment:
  // if (typeof window !== 'undefined' && window.analytics) {
  //   window.analytics.track(event, properties)
  // }

  // Example with PostHog:
  // if (typeof window !== 'undefined' && window.posthog) {
  //   window.posthog.capture(event, properties)
  // }
}

/**
 * Identify a user (for when they sign up/sign in)
 */
export function identify(userId: string, traits?: EventProperties): void {
  if (isDevelopment) {
    console.log("[Analytics] Identify:", userId, traits || {})
  }

  // Production implementation:
  // if (typeof window !== 'undefined' && window.analytics) {
  //   window.analytics.identify(userId, traits)
  // }
}

/**
 * Track page view
 */
export function pageView(pageName: string, properties?: EventProperties): void {
  track("page_viewed", { page: pageName, ...properties })
}
