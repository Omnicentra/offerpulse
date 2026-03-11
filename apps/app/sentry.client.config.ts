import * as Sentry from "@sentry/nextjs";
import { logger } from "@offerpulse/lib";
import { env } from "./env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.NEXT_PUBLIC_ENVIRONMENT ?? env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1,
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
