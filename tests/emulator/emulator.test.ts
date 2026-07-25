import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("8086 Emulator", () => {
  describe("Functional Tests", () => {
    it("executes MOV correctly", () => {
      const { instructions } = compile8086("MOV AX, 5");
      const emu = new Emulator(instructions);
      emu.step();
      expect(emu.state.registers.AX).toBe(5);
    });

    it("executes ADD and updates flags correctly", () => {
      const { instructions } = compile8086("MOV AX, 0xFFFF\nADD AX, 1");
      const emu = new Emulator(instructions);
      emu.step(); // MOV AX, 0xFFFF
      emu.step(); // ADD AX, 1
      expect(emu.state.registers.AX).toBe(0);
      expect(emu.state.flags.ZF).toBe(true);
      expect(emu.state.flags.CF).toBe(true);
    });

    it("executes PUSH and POP correctly", () => {
      const { instructions } = compile8086(
        "MOV AX, 0x1234\nPUSH AX\nMOV AX, 0\nPOP BX",
      );
      const emu = new Emulator(instructions);
      emu.step(); // MOV
      emu.step(); // PUSH
      const spAfterPush = emu.state.registers.SP;
      expect(spAfterPush).toBe(0xfffc);

      emu.step(); // MOV
      emu.step(); // POP
      expect(emu.state.registers.SP).toBe(0xfffe);
      expect(emu.state.registers.BX).toBe(0x1234);
    });

    it("executes conditional jumps correctly", () => {
      const { instructions } = compile8086(`
        MOV AX, 5
        CMP AX, 5
        JE EQUAL
        MOV BX, 1
      EQUAL:
        MOV CX, 1
      `);
      const emu = new Emulator(instructions);
      emu.step(); // MOV AX, 5
      emu.step(); // CMP AX, 5
      expect(emu.state.flags.ZF).toBe(true);
      emu.step(); // JE EQUAL (should jump)
      emu.step(); // MOV CX, 1
      expect(emu.state.registers.BX).toBe(0);
      expect(emu.state.registers.CX).toBe(1);
    });

    it("executes LOOP correctly", () => {
      const { instructions } = compile8086(`
        MOV CX, 3
      START:
        INC AX
        LOOP START
      `);
      const emu = new Emulator(instructions);
      emu.step(); // MOV CX, 3
      emu.step(); // INC AX (AX=1)
      emu.step(); // LOOP (CX=2)
      emu.step(); // INC AX (AX=2)
      emu.step(); // LOOP (CX=1)
      emu.step(); // INC AX (AX=3)
      emu.step(); // LOOP (CX=0, no jump)
      expect(emu.state.registers.AX).toBe(3);
      expect(emu.state.registers.CX).toBe(0);
    });

    it("executes INT 21h AH=02h (char output)", () => {
      const { instructions } = compile8086("MOV AH, 02h\nMOV DL, 65\nINT 21h");
      const emu = new Emulator(instructions);
      emu.step();
      emu.step();
      emu.step();
      expect(emu.state.consoleOutput).toBe("A");
    });

    it("executes INT 21h AH=09h (string output)", () => {
      const { instructions, variables } = compile8086(`
        JMP START
        msg DB 'Hi$', 0
      START:
        MOV AH, 09h
        LEA DX, msg
        INT 21h
      `);
      const emu = new Emulator(
        instructions,
        new Map([[variables.get("MSG")!.offset, variables.get("MSG")!.values]]),
      );
      emu.step(); // JMP START
      emu.step(); // MOV AH, 09h
      emu.step(); // LEA DX, msg
      emu.step(); // INT 21h
      expect(emu.state.consoleOutput).toBe("Hi");
    });

    it("executes INT 21h AH=4Ch (halt)", () => {
      const { instructions } = compile8086("MOV AH, 4Ch\nINT 21h\nINC AX");
      const emu = new Emulator(instructions);
      emu.step();
      emu.step();
      expect(emu.state.halted).toBe(true);
      emu.step(); // Should not execute INC AX
      expect(emu.state.registers.AX).toBe(0x4c00); // AX is just AH=4C, AL=00
    });

    it("handles 20-bit physical address calculation", () => {
      const emu = new Emulator([]);
      emu.state.registers.DS = 0x1234;
      const addr = emu.getPhysicalAddress("DS", 0x5678);
      // 0x12340 + 0x5678 = 0x179B8
      expect(addr).toBe(0x179b8);
    });
  });

  describe("Edge Case & Failure Tests", () => {
    it("halts on division by zero", () => {
      const { instructions } = compile8086("MOV AX, 10\nMOV BX, 0\nDIV BX");
      const emu = new Emulator(instructions);
      emu.step();
      emu.step();
      emu.step();
      expect(emu.state.halted).toBe(true);
      expect(emu.state.consoleOutput).toContain("Division by Zero");
    });

    it("handles stack wrapping below 0 (stack overflow)", () => {
      const emu = new Emulator([]);
      emu.state.registers.SP = 0;
      emu.pushStack(0x1234);
      expect(emu.state.registers.SP).toBe(0xfffe);
    });

    it("handles stack wrapping above 0xFFFF (stack underflow)", () => {
      const emu = new Emulator([]);
      emu.state.registers.SP = 0xfffe;
      emu.popStack();
      expect(emu.state.registers.SP).toBe(0);
    });

    it("handles register wrapping on increment/decrement", () => {
      const { instructions } = compile8086(
        "MOV AX, 0xFFFF\nINC AX\nMOV BX, 0\nDEC BX",
      );
      const emu = new Emulator(instructions);
      emu.step();
      emu.step();
      expect(emu.state.registers.AX).toBe(0);
      emu.step();
      emu.step();
      expect(emu.state.registers.BX).toBe(0xffff);
    });

    it("halts when IP advances past loaded program", () => {
      const { instructions } = compile8086("NOP\nNOP");
      const emu = new Emulator(instructions);
      emu.step();
      emu.step();
      expect(emu.state.halted).toBe(false);
      emu.step(); // No instruction at IP
      expect(emu.state.halted).toBe(true);
    });

    it("enforces execution step limit without hanging (mocked driver)", () => {
      const { instructions } = compile8086("START: JMP START");
      const emu = new Emulator(instructions);
      let steps = 0;
      while (!emu.state.halted && steps < 1000) {
        emu.step();
        steps++;
      }
      expect(steps).toBe(1000);
    });
  });
});
