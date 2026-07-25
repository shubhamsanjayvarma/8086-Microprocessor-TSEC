import { describe, it, expect, beforeEach } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Milestone 4: Memory Safety & Boundary Analysis", () => {
  let emu: Emulator;

  beforeEach(() => {
    emu = new Emulator([]);
  });

  describe("4.1 Physical Address Wrapping", () => {
    it("wraps around 1MB boundary", () => {
      emu.state.registers.DS = 0xffff;
      // getPhysicalAddress = (segment * 16 + offset) & 0xFFFFF
      const addr = emu["getPhysicalAddress"]("DS", 0xffff);

      // 0xFFFF * 16 + 0xFFFF = 0xFFFF0 + 0xFFFF = 0x10FFEF
      // 0x10FFEF & 0xFFFFF = 0x0FFEF
      expect(addr).toBe(0x0ffef);
    });
  });

  describe("4.2 Stack Boundary", () => {
    it("wraps SP correctly on underflow (push at SP=0)", () => {
      emu.state.registers.SP = 0x0000;
      emu["pushStack"](0x1234);
      expect(emu.state.registers.SP).toBe(0xfffe);
    });

    it("wraps SP correctly on overflow (pop at SP=0xFFFE)", () => {
      emu.state.registers.SP = 0xfffe;
      emu.state.memory[(emu.state.registers.SS * 16 + 0xfffe) & 0xfffff] = 0x34;
      emu.state.memory[(emu.state.registers.SS * 16 + 0xffff) & 0xfffff] = 0x12;

      const val = emu["popStack"]();
      expect(val).toBe(0x1234);
      expect(emu.state.registers.SP).toBe(0x0000); // 0xFFFE + 2 = 0x10000 -> 0x0000
    });

    it("handles 40,000 pushes without crashing", () => {
      // 40,000 pushes is 80,000 bytes. Stack is typically around 64KB (65536 bytes).
      // This will wrap around the stack segment multiple times.
      expect(() => {
        for (let i = 0; i < 40000; i++) {
          emu["pushStack"](0xaaaa);
        }
      }).not.toThrow();
    });
  });

  describe("4.3 INT 21h AH=09h - String Read Boundary", () => {
    it("stops reading string at memory boundary if no $ terminator", () => {
      // Place DX at the very end of memory
      emu.state.registers.DS = 0xf000;
      emu.state.registers.DX = 0xffff; // Physical = 0xFFFFF

      // Memory array size is 1MB (1,048,576). 0xFFFFF is 1,048,575 (last index)
      emu.state.memory[0xfffff] = 65; // 'A'

      // Put an INT 21h instruction in the emulator to run it
      const { instructions } = compile8086("INT 21h");
      emu.state.registers.AX = 0x0900; // AH = 0x09
      emu["instructionMap"].set(emu.state.registers.IP, instructions[0]);

      // Execute INT 21h
      expect(() => {
        emu.state.consoleOutput = "";
        emu.step();
      }).not.toThrow();

      // Should read just the 'A' and stop when reaching end of memory bounds
      expect(emu.state.consoleOutput).toBe("A");
    });
  });
});
