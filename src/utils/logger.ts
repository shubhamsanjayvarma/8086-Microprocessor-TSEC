type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
}

const MAX_LOGS = 1000;
const REDACTED_KEYS = new Set([
  "apikey",
  "password",
  "sessiontoken",
  "token",
  "secret",
]);

export class Logger {
  private static buffer: LogEntry[] = new Array(MAX_LOGS);
  private static head = 0;
  private static count = 0;

  private static sanitizeMessage(msg: string): string {
    return msg.replace(/\n|\r/g, "\\n");
  }

  private static safeStringify(obj: any): string {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        return "[REDACTED]";
      }
      if (typeof value === "object" && value !== null) {
        if (cache.has(value)) {
          return "[Circular]";
        }
        cache.add(value);
      }
      return value;
    });
  }

  private static log(level: LogLevel, message: string, context?: any) {
    const sanitizedMsg = this.sanitizeMessage(message);

    let safeContext: any = undefined;
    if (context !== undefined) {
      if (context instanceof Error) {
        safeContext = { errorMessage: context.message, stack: context.stack };
      } else {
        try {
          safeContext = JSON.parse(this.safeStringify(context));
        } catch {
          safeContext = "[Unserializable Context]";
        }
      }
    }

    if (level === "FATAL" || level === "ERROR") {
      safeContext = safeContext || {};
      safeContext.userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
      safeContext.timestamp = new Date().toISOString();
      if (typeof performance !== "undefined" && (performance as any).memory) {
        safeContext.memory = (performance as any).memory.usedJSHeapSize;
      }
    }

    const entry: LogEntry = {
      level,
      message: sanitizedMsg,
      context: safeContext,
      timestamp: new Date().toISOString(),
    };

    // Circular buffer push
    this.buffer[this.head] = entry;
    this.head = (this.head + 1) % MAX_LOGS;
    if (this.count < MAX_LOGS) {
      this.count++;
    }
  }

  static info(message: string, context?: any) {
    this.log("INFO", message, context);
  }

  static warn(message: string, context?: any) {
    this.log("WARN", message, context);
  }

  static error(message: string, context?: any) {
    this.log("ERROR", message, context);
  }

  static fatal(message: string, context?: any) {
    this.log("FATAL", message, context);
  }

  static getLogs(): LogEntry[] {
    const result: LogEntry[] = [];
    if (this.count < MAX_LOGS) {
      for (let i = 0; i < this.count; i++) {
        result.push(this.buffer[i]);
      }
    } else {
      for (let i = 0; i < MAX_LOGS; i++) {
        result.push(this.buffer[(this.head + i) % MAX_LOGS]);
      }
    }
    return result;
  }

  static exportLogs(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }

  static clear() {
    this.head = 0;
    this.count = 0;
    this.buffer = new Array(MAX_LOGS);
  }
}
