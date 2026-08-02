import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("String Primitives Performance Tests", () => {
  it("REP STOSB with CX=50000 completes within 3000ms", () => {
    const code = `
      MOV DI, 0000h
      MOV CX, 50000
      MOV AL, 0xFF
      CLD
      REP STOSB
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);
    emu.state.registers.ES = 0x1000;
    // 0x1000 * 16 = 0x10000

    const start = performance.now();
    while (!emu.state.halted) {
      emu.step();
    }
    const end = performance.now();

    // Check it wrote 50000 bytes
    expect(emu.state.memory[0x10000]).toBe(0xff);
    expect(emu.state.memory[0x10000 + 49999]).toBe(0xff);
    expect(emu.state.registers.CX).toBe(0);

    // Rule 18: Generous CI upper bounds
    expect(end - start).toBeLessThan(3000);
  });

  it("REP MOVSB with CX=10000 completes within 3000ms", () => {
    const code = `
      MOV SI, 0000h
      MOV DI, 0000h
      MOV CX, 10000
      CLD
      REP MOVSB
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x1000;
    emu.state.registers.ES = 0x2000;

    // Fill source
    for (let i = 0; i < 10000; i++) {
      emu.state.memory[0x10000 + i] = i % 256;
    }

    const start = performance.now();
    while (!emu.state.halted) {
      emu.step();
    }
    const end = performance.now();

    expect(emu.state.memory[0x20000 + 500]).toBe(500 % 256);
    expect(emu.state.registers.CX).toBe(0);

    // Rule 18: Generous CI upper bounds
    expect(end - start).toBeLessThan(3000);
  });
});
