import { describe, it, expect } from "vitest";
import { compile8086 } from "../../src/utils/compiler";

describe("8086 Compiler", () => {
  describe("Functional Tests", () => {
    it("compiles MOV AX, 0x1234 correctly", () => {
      const result = compile8086("MOV AX, 0x1234");
      expect(result.errors).toHaveLength(0);
      expect(result.instructions).toHaveLength(1);
      expect(result.instructions[0].op).toBe("MOV");
      expect(result.instructions[0].dest?.value).toBe("AX");
      expect(result.instructions[0].src?.immValue).toBe(0x1234);
    });

    it("compiles data transfer instructions", () => {
      const code = `
        MOV AX, BX
        PUSH AX
        POP CX
        XCHG AL, AH
        LEA SI, [BX + DI + 4]
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.instructions.map((i) => i.op)).toEqual([
        "MOV",
        "PUSH",
        "POP",
        "XCHG",
        "LEA",
      ]);
    });

    it("compiles arithmetic instructions", () => {
      const code = `
        ADD AX, 5
        SUB CX, DX
        MUL BX
        DIV CX
        INC AX
        DEC BX
        CMP AL, 0
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.instructions.map((i) => i.op)).toEqual([
        "ADD",
        "SUB",
        "MUL",
        "DIV",
        "INC",
        "DEC",
        "CMP",
      ]);
    });

    it("compiles logic instructions", () => {
      const code = `
        AND AX, BX
        OR CX, 0xFF
        XOR DX, DX
        NOT AX
        TEST AL, BL
        SHL AX, 1
        SHR BX, CL
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.instructions.map((i) => i.op)).toEqual([
        "AND",
        "OR",
        "XOR",
        "NOT",
        "TEST",
        "SHL",
        "SHR",
      ]);
    });

    it("compiles control flow instructions", () => {
      const code = `
        START:
          JMP END
          JE START
          JNE START
          JG START
          JL START
          LOOP START
        END:
          NOP
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.labels.get("START")).toBeDefined();
      expect(result.labels.get("END")).toBeDefined();
    });

    it("compiles system instructions", () => {
      const code = `
        NOP
        HLT
        INT 21H
        INT 3
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.instructions.map((i) => i.op)).toEqual([
        "NOP",
        "HLT",
        "INT",
        "INT",
      ]);
      expect(result.instructions[2].dest?.immValue).toBe(0x21);
      expect(result.instructions[3].dest?.immValue).toBe(3);
    });

    it("handles directives and data definitions", () => {
      const code = `
        ORG 100h
        msg DB 'Hello', 0
        arr DW 1, 2, 3
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.variables.has("MSG")).toBe(true);
      expect(result.variables.has("ARR")).toBe(true);
      expect(result.variables.get("MSG")?.values).toEqual([
        "H".charCodeAt(0),
        "e".charCodeAt(0),
        "l".charCodeAt(0),
        "l".charCodeAt(0),
        "o".charCodeAt(0),
        0,
      ]);
      expect(result.variables.get("ARR")?.values).toEqual([1, 0, 2, 0, 3, 0]);
    });

    it("handles memory addressing modes", () => {
      const code = `
        MOV AX, [BX]
        MOV AX, [BP+SI+5]
        MOV AL, BYTE PTR [DI]
        MOV AX, CS:[BX]
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);

      const op1 = result.instructions[0].src?.memAddress;
      expect(op1?.baseReg).toBe("BX");

      const op2 = result.instructions[1].src?.memAddress;
      expect(op2?.baseReg).toBe("BP");
      expect(op2?.indexReg).toBe("SI");
      expect(op2?.displacement).toBe(5);

      const op3 = result.instructions[2].src?.memAddress;
      expect(op3?.sizeOverride).toBe(8);

      const op4 = result.instructions[3].src?.memAddress;
      expect(op4?.segmentOverride).toBe("CS");
    });

    it("resolves labels across forward and backward references", () => {
      const code = `
        JMP FORWARD
        BACKWARD:
          NOP
        FORWARD:
          JMP BACKWARD
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.instructions[0].dest?.immValue).toBe(
        result.labels.get("FORWARD"),
      );
      expect(result.instructions[2].dest?.immValue).toBe(
        result.labels.get("BACKWARD"),
      );
    });
  });

  describe("Edge Case & Failure Tests", () => {
    it("handles empty or whitespace-only input gracefully", () => {
      const result = compile8086("   \n  \t  \n");
      expect(result.errors).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
    });

    it("handles comment-only input gracefully", () => {
      const result = compile8086("; this is a comment\n   ; another comment");
      expect(result.errors).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
    });

    it("reports error on undefined label reference", () => {
      const result = compile8086("JMP UNKNOWN_LABEL");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        "Undefined jump target label: UNKNOWN_LABEL",
      );
    });

    it("reports error on duplicate label definition", () => {
      const code = `
        START: NOP
        START: HLT
      `;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        "Duplicate symbol definition: START",
      );
    });

    it("handles extremely long label names without crashing", () => {
      const longLabel = "A".repeat(1000);
      const code = `${longLabel}: NOP\n JMP ${longLabel}`;
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.labels.has(longLabel)).toBe(true);
    });

    it("handles invalid ORG displacement value", () => {
      const result = compile8086("ORG INVALID");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        "Invalid ORG displacement value",
      );
    });

    it("handles invalid numeric initializer in DB", () => {
      const result = compile8086("VAR DB 1, INVALID, 3");
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain("Invalid numeric initializer");
    });

    it("compiles thousands of instructions without timeout", () => {
      const code = "NOP\n".repeat(5000);
      const result = compile8086(code);
      expect(result.errors).toHaveLength(0);
      expect(result.instructions).toHaveLength(5000);
    }, 10000);
  });
});
