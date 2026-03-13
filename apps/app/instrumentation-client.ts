import "./sentry.client.config";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nextjs";

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";
const isProduction = environment === "prd";
const isLocal = process.env.NODE_ENV === "development";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: isProduction ? process.env.NEXT_PUBLIC_DASHBOARD_APP_URL : process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: isLocal,
  // Use environment-specific person profiles to separate data
  person_profiles: isProduction ? "identified_only" : "always",
  // Automatically add environment to all events
  loaded: (posthogInstance) => {
    posthogInstance.register({
      $environment: environment,
      $client_side: true,
    });
  },
});

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;


