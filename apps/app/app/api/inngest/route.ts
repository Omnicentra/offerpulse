import { serve } from "inngest/next";
import { inngest } from "@/server/jobs/client";
import {
  captureSnapshotJob,
  scheduleCapturesJob,
  detectChangesJob,
  generateRecommendationsJob,
  sendAlertsJob,
  generateWeeklyPulseJob,
} from "@/server/jobs/functions";

// Create and configure the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    captureSnapshotJob,
    scheduleCapturesJob,
    detectChangesJob,
    generateRecommendationsJob,
    sendAlertsJob,
    generateWeeklyPulseJob,
  ],
  servePath: "/api/inngest",
  // Enable Inngest Dev Server in development
  streamingHeaders: true,
});
