import { serve } from "inngest/next";
import { inngest } from "@/src/server/jobs/client";
import {
  captureSnapshotJob,
  scheduleCapturesJob,
  detectChangesJob,
  generateRecommendationsJob,
  sendAlertsJob,
  generateWeeklyPulseJob,
} from "@/src/server/jobs/functions";

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
});
