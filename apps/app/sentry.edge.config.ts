// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { logger } from "@offerpulse/lib";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.DOPPLER_ENVIRONMENT ?? process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 0.1,
  enableLogs: true,
  sendDefaultPii: true,
});

logger.setErrorReporter(({ message, error, args }) => {
  if (error) {
    Sentry.captureException(error, {
      extra: { message, args },
    });
    return;
  }

  Sentry.captureMessage(message, {
    level: "error",
  });
});