import { describe, it, expect, beforeEach } from "vitest";
import { Logger } from "../../src/utils/logger";

describe("Milestone 7: Logger Performance", () => {
  beforeEach(() => {
    Logger.clear();
  });

  it("Time Complexity: Appending 10,000 logs should be extremely fast (O(1) push/shift)", () => {
    const start = performance.now();

    for (let i = 0; i < 10000; i++) {
      Logger.info(`Log message ${i}`);
    }

    const end = performance.now();

    // Despite array resizing/shifting when exceeding MAX_LOGS (1000),
    // it should be fast. (Bound set to 1000ms for CI per Rule 18)
    expect(end - start).toBeLessThan(1000);
    expect(Logger.getLogs().length).toBe(1000); // Bounded at 1000
  });

  it("Space Complexity: Log buffer size does not exceed MAX_LOGS", () => {
    for (let i = 0; i < 2000; i++) {
      Logger.warn("Spam");
    }

    // Instead of memory checks which can be flaky in jsdom/V8, we assert the strict length constraint
    expect(Logger.getLogs().length).toBeLessThanOrEqual(1000);
  });
});
