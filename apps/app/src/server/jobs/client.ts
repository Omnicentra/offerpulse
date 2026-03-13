import { env } from "@/env";
import { Inngest } from "inngest";
import { logger } from "@offerpulse/lib";

if (!env.INNGEST_EVENT_KEY) {
  logger.warn("INNGEST_EVENT_KEY is not set. Background jobs will not work in production.");
}

// Create Inngest client
export const inngest = new Inngest({
  id: "offerpulse",
  eventKey: env.INNGEST_EVENT_KEY,
});

// Export event types for type safety
export const events = {
  "competitor/capture": {} as { competitorId: string; workspaceId: string },
  "competitor/schedule": {} as Record<string, never>,
  "change/detected": {} as {
    changeEventId?: string;
    competitorId: string;
    workspaceId: string;
    snapshotId?: string;
    changeData?: Record<string, { previous?: unknown; current?: unknown }>;
  },
  "snapshot/batch-capture": {} as {
    workspaceId: string;
    frequency: "1h" | "6h" | "daily";
  },
  "recommendation/generated": {} as {
    recommendationId: string;
    competitorId: string;
    workspaceId: string;
  },
  "pulse/generate": {} as { workspaceId: string; weekOf: string },
  "workspace/schedule-captures": {} as { workspaceId: string },
  "shopify/store.sync": {} as { workspaceId: string },
};
