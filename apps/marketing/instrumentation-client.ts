import posthog from "posthog-js";

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_MARKETING_APP_URL,
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  // Enables capturing unhandled exceptions via Error Tracking
  capture_exceptions: true,
  // Turn on debug in development mode
  debug: process.env.NODE_ENV === "development",
  // Automatically add environment to all events
  loaded: (posthog) => {
    posthog.register({
      $environment: environment,
      $client_side: true,
    });
  },
});

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
