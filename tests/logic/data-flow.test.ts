import { describe, it, expect, beforeEach } from "vitest";
import { Emulator } from "../../src/utils/emulator";
import { compile8086 } from "../../src/utils/compiler";

describe("Milestone 3: Data Flow & State Mutation Integrity", () => {
  describe("3.1 Compiler -> Emulator Contract", () => {
    it("instruction map is keyed by byteOffset", () => {
      const { instructions } = compile8086("MOV AX, 1\nADD AX, 2");
      const emu = new Emulator(instructions);

      // First instruction at byteOffset 0x0100
      expect(emu["instructionMap"].get(0x0100)).toBeDefined();
      expect(emu["instructionMap"].get(0x0100)?.op).toBe("MOV");

      // Second instruction at byteOffset 0x0103 (MOV AX, imm16 is 3 bytes)
      expect(emu["instructionMap"].get(0x0103)).toBeDefined();
      expect(emu["instructionMap"].get(0x0103)?.op).toBe("ADD");
    });

    it("initial memory mapping is correct", () => {
      const { instructions, variables } = compile8086(`
        V1 DB 10, 20
        V2 DW 0x1234
      `);
      const initialMem = new Map<number, number[]>();
      variables.forEach((v) => initialMem.set(v.offset, v.values));
      const emu = new Emulator(instructions, initialMem);

      const dsOffset = 0x0700 * 16;
      // V1 offset is 0x0100, length 2 bytes
      expect(emu.state.memory[dsOffset + 0x0100]).toBe(10);
      expect(emu.state.memory[dsOffset + 0x0101]).toBe(20);

      // V2 offset is 0x0102, length 2 bytes (little endian)
      expect(emu.state.memory[dsOffset + 0x0102]).toBe(0x34);
      expect(emu.state.memory[dsOffset + 0x0103]).toBe(0x12);
    });

    it("Pass 2 correctly converts label operands to immediate", () => {
      const { instructions } = compile8086(`
        MOV AX, MSG
        MSG DB 'Hi'
      `);

      // Pass 2 should have changed MSG label to an immediate value containing its offset
      const movInst = instructions.find((i) => i.op === "MOV")!;
      expect(movInst.src?.type).toBe("immediate");
      // The offset of MSG is 0x0103 (since MOV AX, imm16 is 3 bytes and starts at 0x0100)
      expect(movInst.src?.immValue).toBe(0x0103);
    });
  });

  describe("3.2 Emulator State Isolation", () => {
    it("mutations in one emulator do not affect another", () => {
      const { instructions } = compile8086("MOV AX, 0xFFFF");
      const emu1 = new Emulator(instructions);
      const emu2 = new Emulator(instructions);

      emu1.step();

      expect(emu1.state.registers.AX).toBe(0xffff);
      expect(emu2.state.registers.AX).toBe(0); // Should be unchanged

      // Test memory isolation
      emu1.state.memory[0] = 0xaa;
      expect(emu2.state.memory[0]).toBe(0);
    });

    it("JSON deep clone bug verification (App.tsx L80 pattern)", () => {
      // In App.tsx, JSON.parse(JSON.stringify(state)) is used.
      // This test verifies the bug that Uint8Array gets serialized as a plain object.
      const emu = new Emulator([]);
      emu.state.memory[0] = 42;

      const clonedState = JSON.parse(JSON.stringify(emu.state));

      // In JavaScript, JSON.stringify of Uint8Array turns it into an object like {"0": 42, ...}
      expect(clonedState.memory instanceof Uint8Array).toBe(false);
      expect(typeof clonedState.memory).toBe("object");
      expect(clonedState.memory["0"]).toBe(42);
    });
  });

  describe("3.3 setRegValue() / getRegValue() Round-Trip", () => {
    let emu: Emulator;
    beforeEach(() => {
      emu = new Emulator([]);
    });

    it("writes to AH and AL are combined into AX", () => {
      emu["setRegValue"]("AH", 0x12);
      emu["setRegValue"]("AL", 0x34);
      expect(emu["getRegValue"]("AX")).toBe(0x1234);
    });

    it("writes to AX correctly split into AH and AL", () => {
      emu["setRegValue"]("AX", 0x5678);
      expect(emu["getRegValue"]("AH")).toBe(0x56);
      expect(emu["getRegValue"]("AL")).toBe(0x78);
    });

    it("throws error on unknown register", () => {
      expect(() => emu["getRegValue"]("UNKNOWN")).toThrow("Unknown register");
      expect(() => emu["setRegValue"]("UNKNOWN", 1)).toThrow(
        "Unknown register",
      );
    });
  });

  describe("3.4 setOperandValue() / getOperandValue() Round-Trip", () => {
    let emu: Emulator;
    beforeEach(() => {
      emu = new Emulator([]);
    });

    it("writes 16-bit to memory correctly (little endian)", () => {
      emu["setRegValue"]("BX", 0);
      const operand = {
        type: "memory",
        memAddress: { baseReg: "BX", displacement: 0, sizeOverride: 16 },
      };

      emu["setOperandValue"](operand, 0xabcd);

      const addr = emu["getPhysicalAddress"]("DS", 0);
      // Little endian: memory[addr] = CD, memory[addr+1] = AB
      expect(emu.state.memory[addr]).toBe(0xcd);
      expect(emu.state.memory[addr + 1]).toBe(0xab);

      // Read back
      expect(emu["getOperandValue"](operand)).toBe(0xabcd);
    });

    it("writes 8-bit to memory correctly", () => {
      emu["setRegValue"]("SI", 5);
      const operand = {
        type: "memory",
        memAddress: { indexReg: "SI", displacement: 0, sizeOverride: 8 },
      };

      const addr = emu["getPhysicalAddress"]("DS", 5);
      emu.state.memory[addr + 1] = 0xff; // adjacent byte
      emu["setOperandValue"](operand, 0x12);

      expect(emu.state.memory[addr]).toBe(0x12);
      expect(emu.state.memory[addr + 1]).toBe(0xff); // adjacent byte untouched

      expect(emu["getOperandValue"](operand)).toBe(0x12);
    });

    it("throws when writing to immediate operand", () => {
      const operand = { type: "immediate", immValue: 5 };
      expect(() => emu["setOperandValue"](operand, 10)).toThrow(
        "Cannot write to immediate value",
      );
    });
  });
});
