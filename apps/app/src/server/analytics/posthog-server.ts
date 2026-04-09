import { PostHog } from "posthog-node";
import { env } from "@/env";

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
      personProfiles:
        env.DOPPLER_ENVIRONMENT === "prd" ? "identified_only" : "always",
    });
  }
  return posthogClient;
}

/**
 * Fires once per new user (email/password or OAuth). Better Auth runs
 * `databaseHooks.user.create.after` for any path that inserts a user row.
 * Uses the same distinct id as client `posthog.identify(user.id)` on the dashboard.
 */
export function captureSignupCompletedServer(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): void {
  const ph = getPostHogClient();
  const environment = env.NEXT_PUBLIC_ENVIRONMENT;

  ph.identify({
    distinctId: user.id,
    properties: {
      ...(user.email ? { email: user.email } : {}),
      ...(user.name ? { name: user.name } : {}),
      $environment: environment,
    },
  });

  ph.capture({
    distinctId: user.id,
    event: "signup_completed",
    properties: {
      source: "dashboard_app",
      $server_side: true,
      $environment: environment,
    },
  });
}
