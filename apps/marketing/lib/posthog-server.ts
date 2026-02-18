import { PostHog } from "posthog-node";
import { env } from "@/env";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    const environment = env.DOPPLER_ENVIRONMENT;
    
    posthogClient = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
      // Use environment-specific person profiles to separate data
      personProfiles: environment === "prd" ? "identified_only" : "always",
    });
  }
  return posthogClient;
}

/**
 * Wraps PostHog capture to automatically add environment context
 */
export function captureEvent(params: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}) {
  const posthog = getPostHogClient();
  const environment = env.DOPPLER_ENVIRONMENT;
  
  posthog.capture({
    distinctId: params.distinctId,
    event: params.event,
    properties: {
      ...params.properties,
      $environment: environment,
      $server_side: true,
    },
  });
}

/**
 * Wraps PostHog identify to automatically add environment context
 */
export function identifyUser(params: {
  distinctId: string;
  properties?: Record<string, unknown>;
}) {
  const posthog = getPostHogClient();
  const environment = env.DOPPLER_ENVIRONMENT;
  
  posthog.identify({
    distinctId: params.distinctId,
    properties: {
      ...params.properties,
      $environment: environment,
    },
  });
}

export async function shutdownPostHog() {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
