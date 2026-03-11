import * as Sentry from "@sentry/nextjs";
import { logger } from "@offerpulse/lib";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.DOPPLER_ENVIRONMENT ?? process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 0.1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
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
