import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Keyboard Input Emulator Tests (INT 21H)", () => {
  it("AH=01h halts for input, reads one char into AL, echoes it, and resumes", () => {
    const code = `
      MOV AH, 01h
      INT 21h
      MOV BL, AL
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);

    // Initial step should halt and wait for input
    emu.step();
    emu.step(); // Steps on INT 21H

    expect(emu.state.awaitingInput).toBe(true);
    expect(emu.state.halted).toBe(false);

    // Provide 'A' (65)
    emu.provideInput("A");

    expect(emu.state.awaitingInput).toBe(false);
    expect(emu.state.registers.AX & 0xff).toBe(65);
    expect(emu.state.consoleOutput).toContain("A"); // Echo

    // Finish execution
    while (!emu.state.halted) emu.step();
    expect(emu.state.registers.BX & 0xff).toBe(65);
  });

  it("AH=0Ah halts for input, reads string into buffer, and resumes", () => {
    const code = `
      ; Set DS:DX to 0000:0010
      MOV DX, 0010h
      MOV AH, 0Ah
      INT 21h
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;

    // Setup buffer at 0010h
    // Byte 0: Max length (e.g. 5)
    emu.state.memory[0x10] = 5;

    // Execute until input
    while (!emu.state.awaitingInput && !emu.state.halted) {
      emu.step();
    }

    expect(emu.state.awaitingInput).toBe(true);

    // Provide "Hello"
    emu.provideInput("Hi!"); // 3 chars

    expect(emu.state.awaitingInput).toBe(false);

    // Check buffer
    // Byte 1: Actual length read (3)
    // Byte 2-4: 'H', 'i', '!'
    expect(emu.state.memory[0x11]).toBe(3);
    expect(emu.state.memory[0x12]).toBe("H".charCodeAt(0));
    expect(emu.state.memory[0x13]).toBe("i".charCodeAt(0));
    expect(emu.state.memory[0x14]).toBe("!".charCodeAt(0));
    // Byte 5 should be CR (0x0D) according to DOS specs
    expect(emu.state.memory[0x15]).toBe(0x0d);

    // Finish execution
    while (!emu.state.halted) emu.step();
  });

  it("AH=0Ah truncates input if longer than max buffer length", () => {
    const code = `
      MOV DX, 0010h
      MOV AH, 0Ah
      INT 21h
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.memory[0x10] = 3; // Max length 3

    while (!emu.state.awaitingInput && !emu.state.halted) emu.step();

    // Provide 5 chars "Hello" -> should truncate to 2 chars + CR = 3 chars max limit?
    // Wait, DOS spec: Byte 0 is max bytes including CR or not?
    // Spec: Byte 0 = max chars to read (including CR if room, but actually max chars before auto-beep/stop).
    // Let's say if max=3, we read 2 chars + CR.
    emu.provideInput("Hello");

    expect(emu.state.memory[0x11]).toBe(2);
    expect(emu.state.memory[0x12]).toBe("H".charCodeAt(0));
    expect(emu.state.memory[0x13]).toBe("e".charCodeAt(0));
    expect(emu.state.memory[0x14]).toBe(0x0d);
  });
});
