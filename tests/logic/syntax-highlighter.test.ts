import { describe, it, expect } from "vitest";
import { highlight8086Assembly } from "../../src/utils/syntaxHighlighter";

describe("highlight8086Assembly - Syntax Highlighter Tokenizer", () => {
  it("highlights mnemonics with hl-mnemonic class", () => {
    const code = "MOV AX, BX";
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-mnemonic">MOV</span>');
  });

  it("highlights registers with hl-register class", () => {
    const code = "MOV AX, BX";
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-register">AX</span>');
    expect(result).toContain('<span class="hl-register">BX</span>');
  });

  it("highlights hex numbers and numbers with hl-number class", () => {
    const code = "MOV AX, 0100H";
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-number">0100H</span>');
  });

  it("highlights comments with hl-comment class", () => {
    const code = "; This is a comment";
    const result = highlight8086Assembly(code);
    expect(result).toContain(
      '<span class="hl-comment">; This is a comment</span>',
    );
  });

  it("highlights strings with hl-string class", () => {
    const code = 'MSG DB "Hello World$"';
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-string">"Hello World$"</span>');
  });

  it("highlights directives with hl-directive class", () => {
    const code = ".MODEL SMALL";
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-directive">.MODEL</span>');
    expect(result).toContain('<span class="hl-directive">SMALL</span>');
  });

  it("highlights labels with hl-label class", () => {
    const code = "START:\n  MOV AX, 1";
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-label">START:</span>');
  });

  it("SECURITY / XSS: escapes HTML special characters before wrapping tokens", () => {
    const maliciousCode = '<script>alert("xss")</script>';
    const result = highlight8086Assembly(maliciousCode);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("does not treat semicolon inside string literal as a comment", () => {
    const code = 'MOV AX, "hello ; world"';
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-string">"hello ; world"</span>');
    expect(result).not.toContain('<span class="hl-comment">');
  });

  it("detects labels correctly without highlighting colons inside strings", () => {
    const code = 'START: MOV AX, "time: 12:00"';
    const result = highlight8086Assembly(code);
    expect(result).toContain('<span class="hl-label">START:</span>');
    expect(result).toContain('<span class="hl-string">"time: 12:00"</span>');
    expect(result).not.toContain('<span class="hl-label">time:</span>');
  });

  it("highlights various hex and decimal formats correctly", () => {
    const formats = ["0FFH", "0x1A", "1234", "0"];
    formats.forEach((fmt) => {
      const code = `MOV AX, ${fmt}`;
      const result = highlight8086Assembly(code);
      expect(result).toContain(`<span class="hl-number">${fmt}</span>`);
    });
  });

  it("handles mixed-case and lowercase mnemonics correctly", () => {
    const cases = ["mov", "Mov", "mOv", "MOV"];
    cases.forEach((c) => {
      const result = highlight8086Assembly(`${c} AX, BX`);
      expect(result).toContain(`<span class="hl-mnemonic">${c}</span>`);
    });
  });

  it("handles empty input without crashing", () => {
    expect(highlight8086Assembly("")).toBe("");
  });

  it("preserves empty lines without crashing", () => {
    const code = "MOV AX, BX\n\n\nMOV CX, DX";
    const result = highlight8086Assembly(code);
    expect(result.split("\n").length).toBe(4);
    expect(result).toContain(
      '<span class="hl-mnemonic">MOV</span> <span class="hl-register">CX</span>',
    );
  });

  it("detects all standard 8086 registers", () => {
    const code =
      "AX AH AL BX BH BL CX CH CL DX DH DL SI DI BP SP IP CS DS SS ES FLAGS";
    const result = highlight8086Assembly(code);
    const registers = code.split(" ");
    registers.forEach((reg) => {
      expect(result).toContain(`<span class="hl-register">${reg}</span>`);
    });
  });

  it("detects standard directives", () => {
    const code =
      ".MODEL .DATA .CODE .STACK DB DW DD DUP EQU ORG END PROC ENDP SMALL TINY MEDIUM COMPACT LARGE HUGE";
    const result = highlight8086Assembly(code);
    const directives = code.split(" ");
    directives.forEach((dir) => {
      expect(result).toContain(`<span class="hl-directive">${dir}</span>`);
    });
  });
});
