import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("String Primitives Emulator Tests", () => {
  let emu: Emulator;

  const runCode = (code: string) => {
    const compiled = compile8086(code);
    expect(compiled.errors).toHaveLength(0);
    emu = new Emulator(compiled.instructions);
    // Setup initial segments
    emu.state.registers.DS = 0x0700;
    emu.state.registers.ES = 0x0800;

    // Safety break to prevent infinite loops during test failure
    let count = 0;
    while (!emu.state.halted && count < 1000) {
      emu.step();
      count++;
    }
    return emu.state;
  };

  it("MOVSB copies byte from DS:SI to ES:DI and increments both (DF=0)", () => {
    const code = `
      MOV SI, 10h
      MOV DI, 20h
      CLD
      MOVSB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.registers.ES = 0x0000;
    // Set memory
    emu.state.memory[0x10] = 0x41;

    while (!emu.state.halted) emu.step();

    expect(emu.state.memory[0x20]).toBe(0x41);
    expect(emu.state.registers.SI).toBe(0x11);
    expect(emu.state.registers.DI).toBe(0x21);
  });

  it("MOVSW copies word from DS:SI to ES:DI and increments both by 2 (DF=0)", () => {
    const code = `
      MOV SI, 10h
      MOV DI, 20h
      CLD
      MOVSW
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.registers.ES = 0x0000;
    // Set memory little-endian 0x1234
    emu.state.memory[0x10] = 0x34;
    emu.state.memory[0x11] = 0x12;

    while (!emu.state.halted) emu.step();

    expect(emu.state.memory[0x20]).toBe(0x34);
    expect(emu.state.memory[0x21]).toBe(0x12);
    expect(emu.state.registers.SI).toBe(0x12);
    expect(emu.state.registers.DI).toBe(0x22);
  });

  it("MOVSB decrements SI and DI when DF=1", () => {
    const code = `
      MOV SI, 10h
      MOV DI, 20h
      STD
      MOVSB
      HLT
    `;
    const state = runCode(code);
    expect(state.registers.SI).toBe(0x0f);
    expect(state.registers.DI).toBe(0x1f);
    expect(state.flags.DF).toBe(true);
  });

  it("LODSB loads byte from DS:SI into AL", () => {
    const code = `
      MOV SI, 10h
      CLD
      LODSB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.memory[0x10] = 0x42;
    while (!emu.state.halted) emu.step();

    expect(emu.state.registers.AX & 0xff).toBe(0x42);
    expect(emu.state.registers.SI).toBe(0x11);
  });

  it("STOSW stores AX into ES:DI", () => {
    const code = `
      MOV DI, 20h
      MOV AX, 0ABCDh
      CLD
      STOSW
      HLT
    `;
    const state = runCode(code);
    // ES starts at 0x0800 by default in runCode, so physical is 0x8000 + 0x20 = 0x8020
    expect(state.memory[0x8020]).toBe(0xcd);
    expect(state.memory[0x8021]).toBe(0xab);
    expect(state.registers.DI).toBe(0x22);
  });

  it("CMPSB sets ZF=1 when bytes are equal", () => {
    const code = `
      MOV SI, 10h
      MOV DI, 20h
      CLD
      CMPSB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.registers.ES = 0x0000;
    emu.state.memory[0x10] = 0x41;
    emu.state.memory[0x20] = 0x41;
    while (!emu.state.halted) emu.step();

    expect(emu.state.flags.ZF).toBe(true);
  });

  it("SCASB compares AL with ES:DI byte", () => {
    const code = `
      MOV AL, 41h
      MOV DI, 20h
      CLD
      SCASB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.ES = 0x0000;
    emu.state.memory[0x20] = 0x41;
    while (!emu.state.halted) emu.step();

    expect(emu.state.flags.ZF).toBe(true);
    expect(emu.state.registers.DI).toBe(0x21);
  });

  it("REP MOVSB copies CX bytes from source to destination", () => {
    const code = `
      MOV SI, 10h
      MOV DI, 20h
      MOV CX, 5
      CLD
      REP MOVSB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.registers.ES = 0x0000;
    emu.state.memory.set([1, 2, 3, 4, 5], 0x10);
    while (!emu.state.halted) emu.step();

    expect(Array.from(emu.state.memory.slice(0x20, 0x25))).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(emu.state.registers.CX).toBe(0);
    expect(emu.state.registers.SI).toBe(0x15);
    expect(emu.state.registers.DI).toBe(0x25);
  });

  it("REPE CMPSB stops early on mismatch", () => {
    const code = `
      MOV SI, 10h
      MOV DI, 20h
      MOV CX, 5
      CLD
      REPE CMPSB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.DS = 0x0000;
    emu.state.registers.ES = 0x0000;
    emu.state.memory.set([1, 2, 3, 4, 5], 0x10);
    emu.state.memory.set([1, 2, 9, 4, 5], 0x20); // Mismatch at 3rd byte
    while (!emu.state.halted) emu.step();

    expect(emu.state.flags.ZF).toBe(false);
    expect(emu.state.registers.CX).toBe(2); // Started at 5, checked 3 bytes, 2 left
    expect(emu.state.registers.SI).toBe(0x13);
  });

  it("REPNE SCASB stops when match found", () => {
    const code = `
      MOV DI, 20h
      MOV CX, 5
      MOV AL, 3
      CLD
      REPNE SCASB
      HLT
    `;
    const c = compile8086(code);
    emu = new Emulator(c.instructions);
    emu.state.registers.ES = 0x0000;
    emu.state.memory.set([1, 2, 3, 4, 5], 0x20); // Match at 3rd byte
    while (!emu.state.halted) emu.step();

    expect(emu.state.flags.ZF).toBe(true);
    expect(emu.state.registers.CX).toBe(2);
    expect(emu.state.registers.DI).toBe(0x23);
  });
});
