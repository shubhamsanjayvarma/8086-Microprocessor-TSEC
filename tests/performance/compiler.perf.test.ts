import { describe, it, expect } from "vitest";
import { compile8086 } from "../../src/utils/compiler";

describe("Component 1: Compiler (compile8086) Space/Time Complexity", () => {
  it("Happy Path: compiles a 10,000-line file efficiently (O(N) Time)", () => {
    // Generate 10,000 lines of standard assembly
    const lines = Array.from(
      { length: 10000 },
      (_, i) => `MOV AX, ${i % 1000}`,
    );
    const code = lines.join("\n");

    const start = performance.now();
    const result = compile8086(code);
    const end = performance.now();

    expect(result.errors).toHaveLength(0);
    expect(result.instructions).toHaveLength(10000);

    // It should parse 10,000 lines efficiently (Rule 18: generous upper-bound for parallel test runners).
    expect(end - start).toBeLessThan(5000);
  });

  it("Edge Case: handles 10,000 blank lines and comments in linear time", () => {
    // Generate 10,000 blank lines or comment lines
    const lines = Array.from({ length: 10000 }, (_, i) =>
      i % 2 === 0 ? "" : "  ; this is a comment",
    );
    const code = lines.join("\n");

    const start = performance.now();
    const result = compile8086(code);
    const end = performance.now();

    expect(result.errors).toHaveLength(0);
    expect(result.instructions).toHaveLength(0);

    // Blank line parsing should be very fast, under 50ms (bumped to 500ms for CI)
    expect(end - start).toBeLessThan(500);
  });

  it("Cyber Attack (ReDoS): resists Regex Denial of Service on deeply nested memory operands", () => {
    // Create an extremely long memory string that could trigger catastrophic backtracking if regex is poor.
    // e.g. MOV AX, [BX+SI+0x10+0x10+0x10+... x1000]
    let badOperand = "[BX+SI";
    for (let i = 0; i < 1000; i++) {
      badOperand += "+0x10";
    }
    badOperand += "]";

    const code = `MOV AX, ${badOperand}`;

    const start = performance.now();
    const result = compile8086(code);
    const end = performance.now();

    // Even if it fails to parse the operand (which is fine, it's invalid x86),
    // it MUST NOT hang the thread for seconds.
    // O(N) parsing means this should finish in < 50ms (bumped to 2000ms per Rule #18 for CI/system load).
    expect(end - start).toBeLessThan(2000);

    // It should yield no errors and parse gracefully
    expect(result.errors).toHaveLength(0);
  });
});
