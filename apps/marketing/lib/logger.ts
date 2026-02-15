/**
 * Logger matching @offerpulse/lib logger API for use in marketing app.
 * Debug logs only run in development.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogConfig {
  emoji: string;
  color: string;
  label: string;
}

const LOG_CONFIGS: Record<LogLevel, LogConfig> = {
  debug: {
    emoji: "🔍",
    color: "\x1b[36m",
    label: "DEBUG",
  },
  info: {
    emoji: "ℹ️",
    color: "\x1b[32m",
    label: "INFO",
  },
  warn: {
    emoji: "⚠️",
    color: "\x1b[33m",
    label: "WARN",
  },
  error: {
    emoji: "❌",
    color: "\x1b[31m",
    label: "ERROR",
  },
};

const RESET_COLOR = "\x1b[0m";

function stringifyArg(arg: unknown): string {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack ?? ""}`;
  }
  if (Array.isArray(arg)) {
    return `[\n  ${arg.map((item) => stringifyArg(item)).join(",\n  ")}\n]`;
  }
  if (typeof arg === "object") {
    try {
      const result = JSON.stringify(arg, null, 2);
      if (result === "{}") return "[Empty Object]";
      return result;
    } catch {
      return "[Complex Object]";
    }
  }
  return JSON.stringify(arg);
}

function formatMessage(
  level: LogLevel,
  message: string,
  ...args: unknown[]
): string {
  const { emoji, color, label } = LOG_CONFIGS[level];
  const timestamp = new Date().toISOString();
  const formattedArgs = args.length > 0 ? args.map(stringifyArg).join(" ") : "";
  return `${color}${emoji} [${label}] ${timestamp}${RESET_COLOR} ${message} ${formattedArgs}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
      console.log(formatMessage("debug", message, ...args));
    }
  },

  info(message: string, ...args: unknown[]) {
    console.log(formatMessage("info", message, ...args));
  },

  warn(message: string, ...args: unknown[]) {
    console.warn(formatMessage("warn", message, ...args));
  },

  error(message: string, ...args: unknown[]) {
    console.error(formatMessage("error", message, ...args));
  },
};
