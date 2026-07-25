import { describe, it, expect, beforeEach } from "vitest";
import { Logger } from "../../src/utils/logger";

describe("Logger Utility", () => {
  beforeEach(() => {
    Logger.clear();
  });

  it("should store log entries with appropriate levels", () => {
    Logger.info("Test info message");
    Logger.warn("Test warn message");
    Logger.error("Test error message");

    const logs = Logger.getLogs();
    expect(logs.length).toBe(3);
    expect(logs[0].level).toBe("INFO");
    expect(logs[1].level).toBe("WARN");
    expect(logs[2].level).toBe("ERROR");
    expect(logs[0].message).toBe("Test info message");
  });

  it("should limit the buffer size to 1000 to prevent memory leaks", () => {
    for (let i = 0; i < 1050; i++) {
      Logger.info(`Log message ${i}`);
    }

    const logs = Logger.getLogs();
    expect(logs.length).toBe(1000);
    // The oldest 50 messages should be evicted. The first message should be index 50.
    expect(logs[0].message).toBe("Log message 50");
    expect(logs[999].message).toBe("Log message 1049");
  });

  it("should capture environmental details during a FATAL error", () => {
    Logger.fatal("App crashed", new Error("Something went wrong"));

    const logs = Logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe("FATAL");
    expect(logs[0].context).toBeDefined();
    expect(logs[0].context?.userAgent).toBeDefined();
    expect(logs[0].context?.timestamp).toBeDefined();
    expect(logs[0].context?.errorMessage).toBe("Something went wrong");
  });

  it("should allow exporting logs to a JSON string without circular reference errors", () => {
    // Create a circular object to ensure logger gracefully degrades instead of throwing
    const circularObj: any = { a: 1 };
    circularObj.self = circularObj;

    Logger.error("Logging circular object", circularObj);

    const logsJson = Logger.exportLogs();
    expect(typeof logsJson).toBe("string");
    // Ensure the export doesn't crash
    const parsedLogs = JSON.parse(logsJson);
    expect(parsedLogs.length).toBe(1);
  });
});
