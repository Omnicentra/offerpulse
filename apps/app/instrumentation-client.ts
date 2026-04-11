import "./sentry.client.config";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";
const isProduction = environment === "prd";
const isLocal = process.env.NODE_ENV === "development";

// Extract PostHog IDs from URL for cross-domain tracking (bootstrap approach)
// This must happen BEFORE posthog.init() to bootstrap the session
let bootstrapConfig = {};

const urlParams = new URLSearchParams(window.location.search);
const distinctId = urlParams.get('ph_distinct_id');
const sessionId = urlParams.get('ph_session_id');

if (distinctId || sessionId) {
  bootstrapConfig = {
    bootstrap: {
      distinctID: distinctId,
      sessionID: sessionId,
    }
  };
}


posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  // Use neutral proxy path (/_px) - /ingest is often blocked by ad blockers
  api_host: "/_px",
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: isLocal,
  // Use environment-specific person profiles to separate data
  person_profiles: isProduction ? "identified_only" : "always",
  // Bootstrap cross-domain tracking IDs if present in URL
  ...bootstrapConfig,
  // Automatically add environment to all events
  loaded: (posthogInstance) => {
    posthogInstance.register({
      $environment: environment,
      $client_side: true,
    });
    
    // Track successful cross-domain connection if IDs were bootstrapped
    if (bootstrapConfig && 'bootstrap' in bootstrapConfig) {
      posthogInstance.capture("cross_domain_tracking_connected", {
        from_domain: "marketing",
        method: "bootstrap"
      });
    }
  },
});

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;


