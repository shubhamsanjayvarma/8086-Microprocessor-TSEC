import { describe, it, expect } from "vitest";
import { highlight8086Assembly } from "../../src/utils/syntaxHighlighter";

describe("highlight8086Assembly - Codebase Security Review (STRIDE & OWASP)", () => {
  it("Tampering (XSS): Neutralizes script injection", () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const result = highlight8086Assembly(maliciousInput);

    // Prove the system rejects the attack
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("Information Disclosure: Does not evaluate embedded variables", () => {
    // Attempting to inject process.env or similar variable evaluation
    const input = "MOV AX, ${process.env.SECRET}";
    const result = highlight8086Assembly(input);

    expect(result).toContain("${process.env.SECRET}");
    expect(result).not.toContain("undefined");
  });

  it("Injection (OWASP): Prevents breaking out of HTML attributes", () => {
    // Attempting to break out of a hypothetical attribute or span
    const injection = '"; onmouseover="alert(1)';
    const result = highlight8086Assembly(injection);

    // The quotes should be highlighted as strings safely inside a span
    // Since it's innerHTML, the quote is a text node, not an attribute break
    expect(result).not.toContain("<script>");
    expect(result).toContain('<span class="hl-string">"; onmouseover="</span>');
  });
});
