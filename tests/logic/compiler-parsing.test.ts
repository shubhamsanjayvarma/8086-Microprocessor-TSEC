import { describe, it, expect } from "vitest";
import {
  parseNumber,
  parseOperand,
  parseMemoryOperand,
  compile8086,
} from "../../src/utils/compiler";

describe("Milestone 1: Compiler Parsing Logic Correctness", () => {
  describe("1.1 parseNumber() - Numeric Literal Parsing", () => {
    it("parses character literals", () => {
      expect(parseNumber("'A'")).toBe(65);
      expect(parseNumber("'$'")).toBe(36);
    });

    it("returns null for empty char literals", () => {
      expect(parseNumber("''")).toBeNull();
    });

    it("parses hex suffix", () => {
      expect(parseNumber("0FFh")).toBe(255);
      expect(parseNumber("1234H")).toBe(0x1234);
    });

    it("parses binary suffix", () => {
      expect(parseNumber("10101010b")).toBe(170);
      expect(parseNumber("11B")).toBe(3);
    });

    it("parses octal suffix", () => {
      expect(parseNumber("77o")).toBe(63);
      expect(parseNumber("10O")).toBe(8);
    });

    it("parses hex prefix", () => {
      expect(parseNumber("0x1A")).toBe(26);
      expect(parseNumber("0xFFFF")).toBe(65535);
    });

    it("parses decimal integers", () => {
      expect(parseNumber("42")).toBe(42);
      expect(parseNumber("1000")).toBe(1000);
    });

    it("handles negative decimals", () => {
      expect(parseNumber("-5")).toBe(-5);
    });

    it("returns null for invalid inputs", () => {
      expect(parseNumber("not_a_number")).toBeNull();
      expect(parseNumber("0xGGGG")).toBeNull();
    });

    it("returns parsed value for very large numbers (integer overflow behavior)", () => {
      expect(parseNumber("999999999999")).toBe(999999999999);
    });
  });

  describe("1.2 parseOperand() - Operand Type Discrimination", () => {
    it("identifies 16-bit registers", () => {
      expect(parseOperand("AX")).toEqual({
        type: "register",
        value: "AX",
        regSize: 16,
      });
      expect(parseOperand("si")).toEqual({
        type: "register",
        value: "SI",
        regSize: 16,
      });
    });

    it("identifies 8-bit registers", () => {
      expect(parseOperand("AL")).toEqual({
        type: "register",
        value: "AL",
        regSize: 8,
      });
      expect(parseOperand("ah")).toEqual({
        type: "register",
        value: "AH",
        regSize: 8,
      });
    });

    it("identifies memory operands", () => {
      expect(parseOperand("[BX+SI+4]")).toEqual({
        type: "memory",
        value: "[BX+SI+4]",
        memAddress: { baseReg: "BX", indexReg: "SI", displacement: 4 },
      });
    });

    it("identifies immediate values", () => {
      expect(parseOperand("1234h")).toEqual({
        type: "immediate",
        value: "1234h",
        immValue: 0x1234,
      });
    });

    it("identifies labels", () => {
      expect(parseOperand("SOME_LABEL")).toEqual({
        type: "label",
        value: "SOME_LABEL",
      });
    });

    it("strips OFFSET keyword and resolves as label", () => {
      expect(parseOperand("offset MSG")).toEqual({
        type: "label",
        value: "MSG",
      });
      expect(parseOperand("OFFSET variable1")).toEqual({
        type: "label",
        value: "variable1",
      });
    });
  });

  describe("1.3 parseMemoryOperand() - Memory Addressing Modes", () => {
    it("parses simple base register", () => {
      expect(parseMemoryOperand("[BX]")).toEqual({
        type: "memory",
        value: "[BX]",
        memAddress: { baseReg: "BX", indexReg: undefined, displacement: 0 },
      });
    });

    it("parses base, index, and negative displacement", () => {
      expect(parseMemoryOperand("[BP+DI-3]")).toEqual({
        type: "memory",
        value: "[BP+DI-3]",
        memAddress: { baseReg: "BP", indexReg: "DI", displacement: -3 },
      });
    });

    it("parses explicit size overrides", () => {
      expect(parseMemoryOperand("BYTE PTR [SI]")).toEqual({
        type: "memory",
        value: "BYTE PTR [SI]",
        memAddress: {
          baseReg: undefined,
          indexReg: "SI",
          displacement: 0,
          sizeOverride: 8,
        },
      });
      expect(parseMemoryOperand("WORD PTR [DI]")).toEqual({
        type: "memory",
        value: "WORD PTR [DI]",
        memAddress: {
          baseReg: undefined,
          indexReg: "DI",
          displacement: 0,
          sizeOverride: 16,
        },
      });
    });

    it("parses explicit segment overrides", () => {
      expect(parseMemoryOperand("ES:[BX]")).toEqual({
        type: "memory",
        value: "ES:[BX]",
        memAddress: {
          baseReg: "BX",
          indexReg: undefined,
          displacement: 0,
          segmentOverride: "ES",
        },
      });
      expect(parseMemoryOperand("cs:[bp+2]")).toEqual(
        expect.objectContaining({
          type: "memory",
          value: "cs:[bp+2]",
          memAddress: expect.objectContaining({
            baseReg: "BP",
            indexReg: undefined,
            displacement: 2,
            segmentOverride: "CS",
          }),
        }),
      );
    });

    it("parses labels in memory displacement", () => {
      expect(parseMemoryOperand("[BX+SI+LABEL]")).toEqual({
        type: "memory",
        value: "[BX+SI+LABEL]",
        memAddress: {
          baseReg: "BX",
          indexReg: "SI",
          displacement: 0,
          labelRef: "LABEL",
        },
      });
      expect(parseMemoryOperand("[VAR_NAME]")).toEqual({
        type: "memory",
        value: "[VAR_NAME]",
        memAddress: {
          baseReg: undefined,
          indexReg: undefined,
          displacement: 0,
          labelRef: "VAR_NAME",
        },
      });
    });

    it("returns null for unmatched brackets", () => {
      expect(parseMemoryOperand("[BX")).toBeNull();
      expect(parseMemoryOperand("BX]")).toBeNull();
    });
  });

  describe("1.4 Size Inference Logic", () => {
    it("infers 16-bit memory size from 16-bit source register", () => {
      const { instructions, errors } = compile8086("MOV [BX], CX");
      expect(errors).toHaveLength(0);
      expect(instructions[0].dest?.memAddress?.sizeOverride).toBe(16);
    });

    it("infers 8-bit memory size from 8-bit source register", () => {
      const { instructions, errors } = compile8086("MOV [DI], AL");
      expect(errors).toHaveLength(0);
      expect(instructions[0].dest?.memAddress?.sizeOverride).toBe(8);
    });

    it("infers 16-bit memory size from 16-bit dest register", () => {
      const { instructions, errors } = compile8086("MOV AX, [SI]");
      expect(errors).toHaveLength(0);
      expect(instructions[0].src?.memAddress?.sizeOverride).toBe(16);
    });

    it("infers 8-bit memory size from 8-bit dest register", () => {
      const { instructions, errors } = compile8086("MOV AL, [SI]");
      expect(errors).toHaveLength(0);
      expect(instructions[0].src?.memAddress?.sizeOverride).toBe(8);
    });

    it("does NOT override explicit size overrides", () => {
      const { instructions, errors } = compile8086("MOV BYTE PTR [SI], AL");
      expect(errors).toHaveLength(0);
      expect(instructions[0].dest?.memAddress?.sizeOverride).toBe(8);
    });
  });
});
