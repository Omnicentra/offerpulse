type LogLevel = "debug" | "info" | "warn" | "error" | "trpc";

interface LogConfig {
  emoji: string;
  color: string;
  label: string;
}

interface ErrorReportPayload {
  message: string;
  error?: Error;
  args: unknown[];
}

type ErrorReporter = (payload: ErrorReportPayload) => void;

const LOG_CONFIGS: Record<LogLevel, LogConfig> = {
  trpc: {
    emoji: "",
    color: "\x1b[35m", // Purple
    label: "TRPC",
  },
  debug: {
    emoji: "🔍",
    color: "\x1b[36m", // Cyan
    label: "DEBUG",
  },
  info: {
    emoji: "ℹ️",
    color: "\x1b[32m", // Green
    label: "INFO",
  },
  warn: {
    emoji: "⚠️",
    color: "\x1b[33m", // Yellow
    label: "WARN",
  },
  error: {
    emoji: "❌",
    color: "\x1b[31m", // Red
    label: "ERROR",
  },
};

const RESET_COLOR = "\x1b[0m";
let errorReporter: ErrorReporter | null = null;

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

  // Format any additional arguments
  const formattedArgs = args.length > 0 ? args.map(stringifyArg).join(" ") : "";

  return `${color}${emoji} [${label}] ${timestamp}${RESET_COLOR} ${message} ${formattedArgs}`;
}

export const logger = {
  trpc(message: string, ...args: unknown[]) {
    console.log(formatMessage("trpc", message, ...args));
  },
  debug(message: string, ...args: unknown[]) {
    const dev = process.env.NODE_ENV === "development";
    const debugEnabled = process.env.LOG_LEVEL === "debug";
    if (dev || debugEnabled) {
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
    const err = args.find((arg): arg is Error => arg instanceof Error);
    errorReporter?.({
      message,
      error: err,
      args,
    });
  },

  /**
   * Group related logs together
   */
  group(label: string, fn: () => void) {
    if (process.env.NODE_ENV === "development") {
      console.group(`📎 ${label}`);
      fn();
      console.groupEnd();
    }
  },

  /**
   * Log performance measurements
   */
  time(label: string) {
    if (process.env.NODE_ENV === "development") {
      console.time(`⏱️ ${label}`);
      return () => console.timeEnd(`⏱️ ${label}`);
    }
    return () => void 0;
  },

  setErrorReporter(reporter: ErrorReporter | null) {
    errorReporter = reporter;
  },
};

export type Logger = typeof logger;