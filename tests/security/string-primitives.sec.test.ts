import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("String Primitives Security & Memory Bound Tests", () => {
  it("REP STOSB with CX=0xFFFF should halt when exceeding maxCycles, preventing DOS", () => {
    const code = `
      MOV CX, 0FFFFh
      CLD
      REP STOSB
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);
    // Lower maxCycles specifically for testing this boundary
    emu.maxCycles = 1000;

    while (!emu.state.halted) {
      emu.step();
    }

    // It should have halted due to cycle limit, not completing the 0xFFFF loop
    expect(emu.state.consoleOutput).toContain("Exceeded Max Cycle Limit");
    expect(emu.state.cycles).toBeGreaterThanOrEqual(1000);
    // CX should not be 0, as it was interrupted
    expect(emu.state.registers.CX).toBeGreaterThan(0);
  });

  it("Memory boundary wraps around correctly at 1MB instead of throwing out of bounds array errors", () => {
    const code = `
      MOV DI, 0FFFFh
      MOV AX, 000Fh
      MOV ES, AX   ; ES:DI = 000F:0FFFF -> Physical 0FFFF + 000F0 = 100EF0 (wrapping check)
                   ; Let's use ES = FFFFh, DI = 0010h -> FFFF0 + 0010 = 100000 (wraps to 0)
      MOV AX, 0FFFFh
      MOV ES, AX
      MOV DI, 0010h
      MOV AL, 99h
      STOSB
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);

    while (!emu.state.halted) {
      emu.step();
    }

    // 0xFFFF0 + 0x0010 = 0x100000, which wraps to 0x00000 in 20-bit address space
    expect(emu.state.memory[0]).toBe(0x99);
  });
});
