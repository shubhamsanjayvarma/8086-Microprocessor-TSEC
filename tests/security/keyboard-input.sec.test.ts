import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Keyboard Input Security Tests", () => {
  it("AH=0Ah prevents buffer overflow by strictly truncating input to the specified max length", () => {
    const code = `
      MOV DX, 0010h
      MOV AH, 0Ah
      INT 21h
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;

    // Set max buffer length to 5
    emu.state.memory[0x10] = 5;

    // Set canary values after buffer to detect overflow
    emu.state.memory[0x16] = 0xaa; // Immediately after buffer
    emu.state.memory[0x17] = 0xbb;

    while (!emu.state.awaitingInput && !emu.state.halted) emu.step();

    // Provide string much larger than 5 bytes
    emu.provideInput("This is a very long string that will overflow");

    // Finish execution
    while (!emu.state.halted) emu.step();

    // Buffer should be truncated:
    // Byte 0 (Max Length): 5
    // Byte 1 (Actual Length Read): 4
    // Byte 2-5: "This"
    // Byte 6 (0x16 in memory): Should be CR (0x0D) because max length is 5, meaning 4 chars + 1 CR.
    // Wait, the test provides 0x10.
    // 0x10: 5 (max)
    // 0x11: 4 (actual length)
    // 0x12: 'T'
    // 0x13: 'h'
    // 0x14: 'i'
    // 0x15: 's'
    // 0x16: 0x0D (CR)
    // 0x17: 0xBB (Canary - untouched)

    expect(emu.state.memory[0x11]).toBe(4);
    expect(emu.state.memory[0x12]).toBe("T".charCodeAt(0));
    expect(emu.state.memory[0x15]).toBe("s".charCodeAt(0));
    expect(emu.state.memory[0x16]).toBe(0x0d); // CR at the end of buffer

    // Canary should remain intact
    expect(emu.state.memory[0x17]).toBe(0xbb);
  });

  it("AH=01h ignores extra characters securely without affecting subsequent state", () => {
    const code = `
      MOV AH, 01h
      INT 21h
      HLT
    `;
    const c = compile8086(code);
    const emu = new Emulator(c.instructions);

    while (!emu.state.awaitingInput && !emu.state.halted) emu.step();

    // Provide multiple characters when only 1 is expected
    emu.provideInput("ABCDE");

    while (!emu.state.halted) emu.step();

    // AL should only contain 'A'
    expect(emu.state.registers.AX & 0xff).toBe("A".charCodeAt(0));
    // Nothing should overflow into AH
    expect((emu.state.registers.AX >> 8) & 0xff).toBe(0x01);
  });
});
