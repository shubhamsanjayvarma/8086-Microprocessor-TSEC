import { describe, it, expect } from "vitest";
import {
  Emulator,
  cloneCPUState,
  initialCPUState,
} from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Lab Scale Performance & Crash Resilience", () => {
  it("clones CPU state efficiently without JSON.stringify overhead", () => {
    const state = initialCPUState();
    state.memory[0x7000] = 0xab;
    state.registers.AX = 0x1234;

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      const cloned = cloneCPUState(state);
      expect(cloned.registers.AX).toBe(0x1234);
      expect(cloned.memory[0x7000]).toBe(0xab);
    }
    const duration = performance.now() - start;

    // 100 clones should take well under 5000ms with Uint8Array.slice() (Rule 18)
    expect(duration).toBeLessThan(5000);
  });

  it("prevents infinite loops by halting after maxCycles limit", () => {
    // Infinite loop using label: JMP START
    const code = `
START:
      MOV AX, 1
      JMP START
    `;
    const result = compile8086(code);
    expect(result.errors).toHaveLength(0);

    const emulator = new Emulator(result.instructions);
    emulator.maxCycles = 50; // Set low maxCycles limit for test

    let steps = 0;
    while (!emulator.state.halted && steps < 100) {
      emulator.step();
      steps++;
    }

    expect(emulator.state.halted).toBe(true);
    expect(emulator.state.cycles).toBe(50);
  });

  it("isolates memory modifications in cloned CPU states", () => {
    const original = initialCPUState();
    const cloned = cloneCPUState(original);

    cloned.memory[0x100] = 0xff;
    cloned.registers.AX = 0x9999;

    expect(original.memory[0x100]).toBe(0x00);
    expect(original.registers.AX).toBe(0x0000);
  });
});
