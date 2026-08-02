import { describe, it, expect, beforeEach } from "vitest";
import { Logger } from "../../src/utils/logger";

describe("Milestone 7: Logger Security", () => {
  beforeEach(() => {
    Logger.clear();
  });

  it("Information Disclosure: Does not crash or leak sensitive system info when logging deeply nested/circular objects", () => {
    // Attack vector: Prototype pollution / deep object
    const maliciousObj: any = { password: "secret_password_123" };
    maliciousObj.self = maliciousObj; // Circular reference

    // Should handle it gracefully without exceeding call stack
    expect(() => {
      Logger.error("Error occurred with data", maliciousObj);
    }).not.toThrow();

    const logsJson = Logger.exportLogs();

    // The circular reference should be handled (usually omitted or stringified safely)
    // It should not have crashed `exportLogs()`
    expect(typeof logsJson).toBe("string");

    // Sensitive data in logs should be scrubbed
    // The logger correctly redacts the password field.
    expect(logsJson).toContain("[REDACTED]");
    expect(logsJson).not.toContain("secret_password_123");
  });
});
