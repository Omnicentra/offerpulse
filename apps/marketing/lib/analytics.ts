/**
 * Analytics tracking utility with PostHog integration
 */

import posthog from "posthog-js"
import { logger } from "./logger"

type AnalyticsEvent =
  // Landing page events
  | "landing_page_viewed"
  | "landing_input_focused"
  | "landing_competitor_url_entered"
  | "landing_competitor_url_submitted"
  | "landing_free_tool_clicked"
  | "landing_cta_clicked"
  | "product_hunt_badge_clicked"
  // Snapshot events
  | "offer_snapshot_submitted"
  | "offer_snapshot_success"
  | "offer_snapshot_error"
  | "offer_snapshot_viewed"
  // Signup events
  | "signup_page_viewed"
  | "signup_form_started"
  | "signup_form_submitted"
  | "signup_completed"
  // Free tool events
  | "free_tools_page_viewed"
  | "free_tool_opened"
  | "free_tool_url_submitted"
  | "free_tool_result_viewed"
  // Other events
  | "cta_signup_clicked"
  | "pricing_viewed"
  | "page_viewed"
  | "marketing_cta_clicked"
  | "marketing_competitor_submitted"
  | "marketing_routing_error"

type EventProperties = Record<string, string | number | boolean | undefined | null>

const isDevelopment = process.env.NODE_ENV === "development"

/**
 * Track an analytics event with PostHog
 * In development, logs to console
 * In production, sends to PostHog
 */
export function track(event: AnalyticsEvent, properties?: EventProperties): void {
  if (isDevelopment) {
    console.log("[Analytics]", event, properties || {})
    return
  }

  // Send to PostHog
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties)
  }
}

/**
 * Identify a user (for when they sign up/sign in)
 */
export function identify(userId: string, traits?: EventProperties): void {
  if (isDevelopment) {
    console.log("[Analytics] Identify:", userId, traits || {})
  }

  // Identify in PostHog
  if (typeof window !== "undefined") {
    posthog.identify(userId, traits)
  }
}

/**
 * Track page view
 */
export function pageView(pageName: string, properties?: EventProperties): void {
  track("page_viewed", { page: pageName, ...properties })
}
