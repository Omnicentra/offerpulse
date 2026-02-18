import { Inngest } from "inngest";

if (!process.env.INNGEST_EVENT_KEY) {
  console.warn("INNGEST_EVENT_KEY is not set. Background jobs will not work in production.");
}

// Create Inngest client
export const inngest = new Inngest({
  id: "offerpulse",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// Export event types for type safety
export const events = {
  "competitor/capture": {} as { competitorId: string; workspaceId: string },
  "competitor/schedule": {} as Record<string, never>,
  "change/detected": {} as {
    changeEventId: string;
    competitorId: string;
    workspaceId: string;
  },
  "recommendation/generated": {} as {
    recommendationId: string;
    competitorId: string;
    workspaceId: string;
  },
  "pulse/generate": {} as { workspaceId: string; weekOf: string },
};
