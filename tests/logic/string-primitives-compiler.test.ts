import { describe, it, expect } from "vitest";
import { compile8086 } from "../../src/utils/compiler";

describe("String Primitives Compiler Tests", () => {
  it("parses MOVSB as zero-operand instruction", () => {
    const code = `
      CLD
      MOVSB
    `;
    const result = compile8086(code);
    expect(result.errors).toHaveLength(0);
    expect(result.instructions[0].op).toBe("CLD");
    expect(result.instructions[0].dest).toBeUndefined();
    expect(result.instructions[1].op).toBe("MOVSB");
    expect(result.instructions[1].dest).toBeUndefined();
  });

  it("parses REP MOVSB as prefixed instruction", () => {
    const code = "REP MOVSB";
    const result = compile8086(code);
    expect(result.errors).toHaveLength(0);
    expect(result.instructions[0].op).toBe("MOVSB");
    expect(result.instructions[0].prefix).toBe("REP");
  });

  it("parses REPE CMPSB as prefixed instruction", () => {
    const code = "REPE CMPSB";
    const result = compile8086(code);
    expect(result.errors).toHaveLength(0);
    expect(result.instructions[0].op).toBe("CMPSB");
    expect(result.instructions[0].prefix).toBe("REPE");
  });

  it("parses REPNE SCASB as prefixed instruction", () => {
    const code = "REPNE SCASB";
    const result = compile8086(code);
    expect(result.errors).toHaveLength(0);
    expect(result.instructions[0].op).toBe("SCASB");
    expect(result.instructions[0].prefix).toBe("REPNE");
  });

  it("REP with invalid instruction produces error", () => {
    const code = "REP MOV AX, BX";
    const result = compile8086(code);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/Invalid use of REP prefix/i);
  });

  it("parses DUP directive correctly in DB and DW", () => {
    const code = `
      buf1 DB 4 DUP(0)
      buf2 DB 3 DUP('A')
      buf3 DW 2 DUP(1234h)
    `;
    const result = compile8086(code);
    expect(result.errors).toHaveLength(0);
    expect(result.variables.get("BUF1")?.values).toEqual([0, 0, 0, 0]);
    expect(result.variables.get("BUF2")?.values).toEqual([65, 65, 65]);
    expect(result.variables.get("BUF3")?.values).toEqual([
      0x34, 0x12, 0x34, 0x12,
    ]);
  });
});
