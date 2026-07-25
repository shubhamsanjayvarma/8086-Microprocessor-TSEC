import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Milestone 2: Emulator Instruction Correctness", () => {
  const compileAndRun = (code: string) => {
    const { instructions, variables, errors } = compile8086(code);
    expect(errors).toHaveLength(0);
    const initialMem = new Map<number, number[]>();
    variables.forEach((v) => initialMem.set(v.offset, v.values));
    const emu = new Emulator(instructions, initialMem);
    let steps = 0;
    while (!emu.state.halted && steps < 100) {
      emu.step();
      steps++;
    }
    return emu;
  };

  describe("2.1 Data Movement", () => {
    it("executes MOV with correct sizes", () => {
      const emu = compileAndRun(`
        MOV AX, 0x1234
        MOV AH, 0x56
        MOV BL, 0x78
      `);
      expect(emu.state.registers.AX).toBe(0x5634); // AH changed to 0x56, AL preserved as 0x34
      expect(emu.state.registers.BX).toBe(0x0078);
    });

    it("executes XCHG correctly", () => {
      const emu = compileAndRun(`
        MOV AX, 0x1111
        MOV BX, 0x2222
        XCHG AX, BX
      `);
      expect(emu.state.registers.AX).toBe(0x2222);
      expect(emu.state.registers.BX).toBe(0x1111);
    });

    it("executes LEA correctly with memory operands", () => {
      const emu = compileAndRun(`
        MOV BX, 0x10
        MOV SI, 0x05
        LEA DX, [BX+SI+0x05]
      `);
      expect(emu.state.registers.DX).toBe(0x001a); // 10 + 5 + 5 = 26 (0x1A)
    });

    it("executes LEA correctly with labels", () => {
      const emu = compileAndRun(`
        JMP START
        MSG DB 'Hello', 0
        START:
        LEA DX, MSG
      `);
      expect(emu.state.registers.DX).toBeGreaterThan(0); // Offset should be resolved
    });
  });

  describe("2.2 Arithmetic with Flag Verification", () => {
    it("ADD sets OF, SF, and clears ZF on signed overflow", () => {
      const emu = compileAndRun(`
        MOV AX, 0x7FFF
        ADD AX, 1
      `);
      expect(emu.state.registers.AX).toBe(0x8000);
      expect(emu.state.flags.OF).toBe(true);
      expect(emu.state.flags.SF).toBe(true);
      expect(emu.state.flags.ZF).toBe(false);
    });

    it("ADD sets CF and ZF on unsigned carry + zero", () => {
      const emu = compileAndRun(`
        MOV AX, 0xFFFF
        ADD AX, 1
      `);
      expect(emu.state.registers.AX).toBe(0x0000);
      expect(emu.state.flags.CF).toBe(true);
      expect(emu.state.flags.ZF).toBe(true);
    });

    it("SUB sets CF (borrow) when subtracting larger number", () => {
      const emu = compileAndRun(`
        MOV AX, 0x0000
        SUB AX, 1
      `);
      expect(emu.state.registers.AX).toBe(0xffff);
      expect(emu.state.flags.CF).toBe(true);
      expect(emu.state.flags.SF).toBe(true);
    });

    it("ADC includes carry from previous ADD", () => {
      const emu = compileAndRun(`
        MOV AX, 0xFFFF
        ADD AX, 1
        MOV BX, 1
        ADC BX, 1
      `); // CF is true from ADD. ADC should add 1 + 1 + CF(1) = 3
      expect(emu.state.registers.BX).toBe(3);
    });

    it("SBB includes borrow from previous SUB", () => {
      const emu = compileAndRun(`
        MOV AX, 0
        SUB AX, 1
        MOV BX, 5
        SBB BX, 1
      `); // CF is true from SUB. SBB should sub 5 - 1 - CF(1) = 3
      expect(emu.state.registers.BX).toBe(3);
    });

    it("CMP sets flags without modifying destination", () => {
      const emu = compileAndRun(`
        MOV AX, 5
        CMP AX, 10
      `);
      expect(emu.state.registers.AX).toBe(5);
      expect(emu.state.flags.CF).toBe(true); // 5 - 10 needs borrow
      expect(emu.state.flags.SF).toBe(true);
    });

    it("INC updates ZF and OF but NOT CF", () => {
      const emu = compileAndRun(`
        MOV AX, 0xFFFF
        INC AX
      `);
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.flags.ZF).toBe(true);
      expect(emu.state.flags.CF).toBe(false); // CF shouldn't change
    });

    it("DEC updates SF", () => {
      const emu = compileAndRun(`
        MOV AX, 0x0000
        DEC AX
      `);
      expect(emu.state.registers.AX).toBe(0xffff);
      expect(emu.state.flags.SF).toBe(true);
    });

    it("MUL (16-bit) handles overflow to DX", () => {
      const emu = compileAndRun(`
        MOV AX, 0x1000
        MOV BX, 0x0010
        MUL BX
      `); // 0x1000 * 0x10 = 0x10000 -> DX=1, AX=0
      expect(emu.state.registers.AX).toBe(0x0000);
      expect(emu.state.registers.DX).toBe(0x0001);
      expect(emu.state.flags.CF).toBe(true);
      expect(emu.state.flags.OF).toBe(true);
    });

    it("DIV (16-bit) computes quotient and remainder", () => {
      const emu = compileAndRun(`
        MOV AX, 0x0017
        MOV DX, 0x0000
        MOV BX, 0x0005
        DIV BX
      `); // 23 / 5 -> quotient 4, remainder 3
      expect(emu.state.registers.AX).toBe(4);
      expect(emu.state.registers.DX).toBe(3);
    });
  });

  describe("2.3 Bitwise Operations", () => {
    it("AND clears CF and OF", () => {
      const emu = compileAndRun(`
        MOV AX, 0xFF00
        MOV BX, 0x00FF
        AND AX, BX
      `);
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.flags.ZF).toBe(true);
      expect(emu.state.flags.CF).toBe(false);
      expect(emu.state.flags.OF).toBe(false);
    });

    it("OR operation", () => {
      const emu = compileAndRun(`
        MOV AX, 0xF0
        MOV BX, 0x0F
        OR AX, BX
      `);
      expect(emu.state.registers.AX).toBe(0xff);
    });

    it("XOR self zeroes register", () => {
      const emu = compileAndRun(`
        MOV AX, 0x1234
        XOR AX, AX
      `);
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.flags.ZF).toBe(true);
    });

    it("NOT inverts bits", () => {
      const emu = compileAndRun(`
        MOV AX, 0x0000
        NOT AX
      `);
      expect(emu.state.registers.AX).toBe(0xffff);
    });

    it("TEST sets flags without modifying", () => {
      const emu = compileAndRun(`
        MOV AX, 0x1234
        TEST AX, 0x1234
      `);
      expect(emu.state.registers.AX).toBe(0x1234);
      expect(emu.state.flags.ZF).toBe(false);
    });

    it("SHL shifts bits left and sets CF", () => {
      const emu = compileAndRun(`
        MOV AX, 0x8000
        MOV CX, 1
        SHL AX, CX
      `); // MSB is 1, so CF should be true. Result should be 0.
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.flags.CF).toBe(true);
    });

    it("SHR shifts bits right and sets CF", () => {
      const emu = compileAndRun(`
        MOV AX, 0x0001
        MOV CX, 1
        SHR AX, CX
      `); // LSB is 1, so CF should be true. Result should be 0.
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.flags.CF).toBe(true);
    });

    it("SAR preserves sign bit", () => {
      const emu = compileAndRun(`
        MOV AX, 0x8000
        MOV CX, 1
        SAR AX, CX
      `); // Sign bit should be preserved, so result is 0xC000
      expect(emu.state.registers.AX).toBe(0xc000);
      expect(emu.state.flags.CF).toBe(false);
    });
  });

  describe("2.4 Control Flow", () => {
    it("JMP unconditionally branches", () => {
      const emu = compileAndRun(`
        JMP SKIP
        MOV AX, 1
        SKIP:
        MOV BX, 1
      `);
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.registers.BX).toBe(1);
    });

    it("JE jumps if ZF is true", () => {
      const emu = compileAndRun(`
        MOV AX, 5
        CMP AX, 5
        JE EQUAL
        MOV BX, 1
        EQUAL:
        MOV CX, 1
      `);
      expect(emu.state.registers.BX).toBe(0);
      expect(emu.state.registers.CX).toBe(1);
    });

    it("JL jumps if SF != OF", () => {
      const emu = compileAndRun(`
        MOV AX, 0x0005
        CMP AX, 0x000A
        JL LESS
        MOV BX, 1
        LESS:
        MOV CX, 1
      `); // 5 - 10 = -5, SF=true, OF=false (SF!=OF)
      expect(emu.state.registers.BX).toBe(0);
      expect(emu.state.registers.CX).toBe(1);
    });

    it("LOOP decrements CX and jumps if CX != 0", () => {
      const emu = compileAndRun(`
        MOV CX, 3
        START:
        INC AX
        LOOP START
      `);
      expect(emu.state.registers.AX).toBe(3);
      expect(emu.state.registers.CX).toBe(0);
    });
  });

  describe("2.5 Interrupts", () => {
    it("INT 21h AH=02h outputs character", () => {
      const emu = compileAndRun(`
        MOV AH, 02h
        MOV DL, 65
        INT 21h
      `);
      expect(emu.state.consoleOutput).toBe("A");
    });

    it("INT 21h AH=09h outputs string until $", () => {
      const emu = compileAndRun(`
        JMP START
        MSG DB 'Hello World!$', 0
        START:
        MOV AH, 09h
        LEA DX, MSG
        INT 21h
      `);
      expect(emu.state.consoleOutput).toBe("Hello World!");
    });

    it("INT 21h AH=09h missing $ terminator prevents infinite loop", () => {
      const emu = compileAndRun(`
        JMP START
        MSG DB 'Unterminated string'
        START:
        MOV AH, 09h
        LEA DX, MSG
        INT 21h
      `);
      // It should read until memory boundary, but NOT loop forever
      expect(emu.state.consoleOutput.length).toBeGreaterThan(19);
      expect(emu.state.consoleOutput).toContain("Unterminated string");
    });

    it("INT 3 triggers breakpoint", () => {
      const emu = compileAndRun(`
        MOV AX, 1
        INT 3
        MOV BX, 1
      `);
      expect(emu.state.registers.AX).toBe(1);
      expect(emu.state.registers.BX).toBe(0); // Halted before this executed
      expect(emu.state.halted).toBe(true);
      expect(emu.state.consoleOutput).toContain("Breakpoint hit");
    });
  });
});
