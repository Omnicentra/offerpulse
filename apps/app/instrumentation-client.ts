import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";

if (posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: "/ingest",
    ui_host: posthogHost,
    // Enables capturing unhandled exceptions via Error Tracking
    capture_exceptions: true,
    // Turn on debug in development mode
    debug: process.env.NODE_ENV === "development",
    // Use environment-specific person profiles to separate data
    person_profiles: environment === "prd" ? "identified_only" : "always",
    // Automatically add environment to all events
    loaded: (posthogInstance) => {
      posthogInstance.register({
        $environment: environment,
        $client_side: true,
      });
    },
  });
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
