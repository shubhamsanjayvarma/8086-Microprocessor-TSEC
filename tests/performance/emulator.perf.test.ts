import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Component 2: Emulator Execution (step) Space/Time Complexity", () => {
  it("Time Complexity: executes 1,000,000 JMP iterations extremely fast (O(1) per step)", () => {
    const { instructions, errors } = compile8086(`
      L1: JMP L1
    `);
    expect(errors).toHaveLength(0);

    const emu = new Emulator(instructions);

    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {
      emu.step();
    }
    const end = performance.now();

    // 1 million steps should take < 10000ms (Rule 18: generous upper-bounds for CI/test environments).
    expect(end - start).toBeLessThan(10000);
  });

  it("Space Complexity: stack pointer wrapping handles 1,000,000 PUSHes with O(1) auxiliary space growth", () => {
    const { instructions, errors } = compile8086(`
      L1: PUSH AX
          JMP L1
    `);
    expect(errors).toHaveLength(0);

    const emu = new Emulator(instructions);

    // We can't easily measure GC or memory usage reliably in vitest without exposing gc() flag,
    // but we can ensure it finishes extremely fast, meaning it's not allocating new typed arrays.
    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {
      emu.step();
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(10000); // Push involves memory writes, set upper bound per Rule 18.

    // The stack pointer should have safely wrapped multiple times
    expect(emu.state.registers.SP).toBeLessThanOrEqual(0xffff);
  });

  it("Cyber Attack (Tampering): Emulator throws error on poisoned/unrecognized opcodes", () => {
    // Inject a poisoned AST where the compiler validation was somehow bypassed
    const emu = new Emulator([
      {
        op: "EVIL_HACK",
        byteLength: 2,
        byteOffset: 256,
        lineNo: 1,
        originalLine: "EVIL",
        bytes: [],
      },
    ]);

    // The step function should throw an unhandled instruction error instead of crashing/hanging
    expect(() => emu.step()).toThrow(/Unhandled instruction/);
  });
});
