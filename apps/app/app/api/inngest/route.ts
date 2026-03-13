import { serve } from "inngest/next";
import * as Sentry from "@sentry/nextjs";
import { inngest } from "@/src/server/jobs/client";
import {
  captureSnapshotJob,
  batchCaptureSnapshotsJob,
  scheduleCapturesJob,
  detectChangesJob,
  generateRecommendationsJob,
  sendAlertsJob,
  sendCaptureNotificationJob,
  generateWeeklyPulseJob,
  syncShopifyStoreJob,
  scheduleShopifySyncsJob,
  pruneStoreHistoryJob,
} from "@/src/server/jobs/functions";

// Create and configure the Inngest serve handler
const inngestHandlerOptions: any = {
  client: inngest,
  functions: [
    captureSnapshotJob,
    batchCaptureSnapshotsJob,
    scheduleCapturesJob,
    detectChangesJob,
    generateRecommendationsJob,
    sendAlertsJob,
    sendCaptureNotificationJob,
    generateWeeklyPulseJob,
    syncShopifyStoreJob,
    scheduleShopifySyncsJob,
    pruneStoreHistoryJob,
  ],
  servePath: "/api/inngest",
  onError: async ({ error, functionId, event, step }: any) => {
    Sentry.withScope((scope) => {
      scope.setTag("inngest_function", functionId ?? "unknown");
      if (step?.id) scope.setTag("inngest_step", step.id);
      if (event?.name) scope.setTag("inngest_event", event.name);
      if (event?.id) scope.setContext("event", { id: event.id });
      Sentry.captureException(error);
    });
  },
};

export const { GET, POST, PUT } = serve(inngestHandlerOptions);
