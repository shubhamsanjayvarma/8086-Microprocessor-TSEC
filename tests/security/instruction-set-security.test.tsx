import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import InstructionSetModal from "../../src/components/InstructionSetModal";

describe("Instruction Set Security & Hardening Tests (STRIDE & OWASP)", () => {
  afterEach(() => {
    cleanup();
  });

  it("STRIDE Denial of Service (ReDoS): handles nested regex special characters in search without thread freeze or error", () => {
    render(
      <InstructionSetModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectExample={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search instruction, opcode/i,
    );

    const redosPayloads = [
      "((a+)+)+$",
      "([a-zA-Z0-9_-]+)*@([a-zA-Z0-9_-]+)+",
      "?=.*[a-z]^.{1,1000000}$",
      "\\\\\\\\\\\\\\\\\\\\",
    ];

    const startTime = performance.now();
    redosPayloads.forEach((payload) => {
      fireEvent.change(searchInput, { target: { value: payload } });
    });
    const endTime = performance.now();

    // Verify search completed rapidly (under 3000ms bounds per Rule 18 for CI runners)
    expect(endTime - startTime).toBeLessThan(3000);
    expect(
      screen.getByText(/No instructions match your search/i),
    ).toBeDefined();
  });

  it("OWASP Injection / XSS: renders malicious search input safely as plain text without dynamic script execution", () => {
    const xssPayload =
      "<script>alert('xss')</script><img src=x onerror=alert(1)>";

    render(
      <InstructionSetModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectExample={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search instruction, opcode/i,
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: xssPayload } });

    expect(searchInput.value).toBe(xssPayload);
    // Verify no unexpected HTML node rendering
    expect(document.querySelector("script")).toBeNull();
  });
});
