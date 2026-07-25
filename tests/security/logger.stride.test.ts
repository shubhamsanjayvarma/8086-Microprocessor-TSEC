import { describe, it, expect, beforeEach } from "vitest";
import { Logger } from "../../src/utils/logger";

describe("Logger Security & Cyber Attack Validation (STRIDE)", () => {
  beforeEach(() => {
    Logger.clear();
  });

  it("STRIDE - Information Disclosure: Sensitive keys should be redacted automatically", () => {
    const errorWithSecrets = {
      message: "Connection failed",
      apiKey: "sk-1234567890abcdef",
      password: "supersecretpassword123",
      sessionToken: "xyz789",
    };

    Logger.error("Database connection error", errorWithSecrets);
    const logs = Logger.getLogs();
    const logStr = JSON.stringify(logs);

    // Verify secret values are redacted
    expect(logStr).not.toContain("sk-1234567890abcdef");
    expect(logStr).not.toContain("supersecretpassword123");
    expect(logStr).toContain("[REDACTED]");
  });

  it("OWASP A03 - Log Injection: Should sanitize newline characters from malicious strings", () => {
    // An attacker might try to inject fake log entries by sending messages with newlines
    const maliciousPayload =
      "Failed to load user profile\n[FATAL] 2026-01-01 Admin logged in successfully";

    Logger.warn(maliciousPayload);
    const logs = Logger.getLogs();

    // The logger should replace newlines so it appears as a single line
    expect(logs[0].message).not.toContain("\n");
    expect(logs[0].message).toContain("Failed to load user profile");
    expect(logs[0].message).toContain("[FATAL]");
  });

  it("STRIDE - Denial of Service (DoS): O(1) buffer guardrail prevents memory exhaustion", () => {
    const start = performance.now();

    // Attempting to flood the logger with a massive amount of events
    for (let i = 0; i < 100000; i++) {
      Logger.info("Flooding the log buffer");
    }

    const end = performance.now();

    const logs = Logger.getLogs();

    // Memory constraint check: buffer must remain strictly at 1000
    expect(logs.length).toBe(1000);

    // Performance constraint check: Evicting elements should be highly performant (e.g., using modulo array indexing instead of shift)
    // 100,000 logs should be processed very fast, set upperbound to 1000ms for CI per Rule #18
    expect(end - start).toBeLessThan(1000);
  });
});
