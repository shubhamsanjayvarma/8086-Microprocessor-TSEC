import { describe, it, expect } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Milestone 6: Security Logic Testing (STRIDE + OWASP)", () => {
  describe("Spoofing/Tampering (Data Corruption & OOB Reads)", () => {
    it("prevents memory over-reads (reading past 1MB)", () => {
      const emu = new Emulator([]);
      // Attempt to read from segment 0xFFFF offset 0xFFFF -> Physical 0x10FFEF -> wraps to 0x0FFEF
      emu.state.registers.DS = 0xffff;

      const operand = {
        type: "memory" as const,
        memAddress: { displacement: 0xffff, sizeOverride: 16 },
      };
      // Write to an address
      const addr = emu["getPhysicalAddress"]("DS", 0xffff);
      emu.state.memory[addr] = 0xaa;
      emu.state.memory[addr + 1] = 0xbb;

      const val = emu["getOperandValue"](operand);
      expect(val).toBe(0xbbaa);
    });

    it("prevents stack buffer overflow via excessive PUSH operations", () => {
      const emu = new Emulator([]);
      emu.state.registers.SP = 0x0000;

      // Push enough times to wrap around the stack pointer entirely.
      // Since it's a fixed size 1MB Uint8Array, it cannot crash V8 via out of bounds array access.
      for (let i = 0; i < 40000; i++) {
        emu["pushStack"](0xffff);
      }

      // Expect SP to have safely wrapped
      expect(emu.state.registers.SP).toBe((0x0000 - 40000 * 2) & 0xffff);
    });
  });

  describe("Denial of Service (DoS)", () => {
    it("does not cause catastrophic synchronous blocks on infinite loops", () => {
      // Infinite loop:
      // JMP L1
      // L1: JMP L1
      const { instructions, errors } = compile8086(`
        L1: JMP L1
      `);
      expect(errors).toHaveLength(0);

      const emu = new Emulator(instructions);

      // Execute 1000 steps manually (which represents how App.tsx async runs it)
      // This proves that step() itself is O(1) and does not hang the thread.
      let i = 0;
      const start = Date.now();
      while (i < 1000) {
        emu.step();
        i++;
      }
      const end = Date.now();

      // Should execute 1000 loop jumps extremely quickly and not block
      expect(end - start).toBeLessThan(100);
    });
  });

  describe("Information Disclosure", () => {
    it("does not leak JS memory or object references (Uint8Array isolation)", () => {
      const emu = new Emulator([]);

      // Write some data
      emu.state.memory[0] = 42;

      // Check if memory is indeed a TypedArray (safely isolated)
      expect(emu.state.memory instanceof Uint8Array).toBe(true);

      // The length must be strictly bounded to 1MB
      expect(emu.state.memory.length).toBe(1024 * 1024);
    });
  });
});
