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
});
