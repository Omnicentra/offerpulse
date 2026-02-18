/**
 * Centralized logging utility for OfferPulse
 * Provides structured logging with different levels
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };

    console.error(this.formatMessage("error", message, errorContext));

    // In production, you might want to send errors to a service like Sentry
    if (this.isProduction) {
      // TODO: Integrate with error tracking service (Sentry, Bugsnag, etc.)
    }
  }

  /**
   * Log job execution
   */
  job(jobName: string, status: "started" | "completed" | "failed", context?: LogContext): void {
    const emoji = {
      started: "▶️",
      completed: "✅",
      failed: "❌",
    };

    this.info(`${emoji[status]} Job ${jobName} ${status}`, context);
  }

  /**
   * Log API request
   */
  api(method: string, path: string, status: number, duration?: number): void {
    const emoji = status >= 500 ? "🔴" : status >= 400 ? "🟡" : "🟢";
    this.info(`${emoji} ${method} ${path} - ${status}`, { duration });
  }

  /**
   * Log scraping activity
   */
  scrape(url: string, status: "started" | "completed" | "failed", context?: LogContext): void {
    const emoji = {
      started: "🕷️",
      completed: "✅",
      failed: "❌",
    };

    this.info(`${emoji} Scrape ${url} ${status}`, context);
  }
}

// Export singleton instance
export const logger = new Logger();
