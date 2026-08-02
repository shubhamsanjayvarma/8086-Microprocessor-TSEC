import { describe, it, expect } from "vitest";
import { highlight8086Assembly } from "../../src/utils/syntaxHighlighter";

describe("highlight8086Assembly - Space & Time Complexity", () => {
  it("Time Complexity: O(N) linear scaling for 10,000 line assembly file", () => {
    const singleLine = "START: MOV AX, 0100H ; Initialize AX\n";
    const largeCode = singleLine.repeat(10000);

    const start = performance.now();
    const result = highlight8086Assembly(largeCode);
    const end = performance.now();

    const duration = end - start;

    expect(result.length).toBeGreaterThan(10000);
    // Even in CI, 10000 lines should be parsed well within 1500ms
    expect(duration).toBeLessThan(1500);
  });

  it("Space Complexity: 1,000 iterations without unbounded growth", () => {
    const code = 'START: MOV AX, "time: 12:00"\nINC AX ; loop';

    // Warmup
    highlight8086Assembly(code);

    const startMem = process.memoryUsage().heapUsed;

    for (let i = 0; i < 1000; i++) {
      highlight8086Assembly(code);
    }

    const endMem = process.memoryUsage().heapUsed;
    const diff = (endMem - startMem) / 1024 / 1024; // MB

    // Allow up to 15MB of garbage allocation before GC
    expect(diff).toBeLessThan(15);
  });

  it("Denial of Service (STRIDE): Pathological regex input (ReDoS protection)", () => {
    // ReDoS usually happens with nested quantifiers in regex
    const pathologicalString = '"' + "a".repeat(50000) + 'b"';
    const pathologicalLabels = "a".repeat(50000) + ":";
    const pathologicalCode =
      pathologicalLabels + " MOV AX, " + pathologicalString;

    const start = performance.now();
    const result = highlight8086Assembly(pathologicalCode);
    const end = performance.now();

    const duration = end - start;

    // Should process linearly without exponential hang
    expect(duration).toBeLessThan(2000);
    expect(result).toContain('<span class="hl-string">');
  });
});
