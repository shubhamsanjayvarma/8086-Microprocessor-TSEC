import { describe, it, expect } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

describe("Milestone 6: App State & Data Flow Security", () => {
  it("XSS Protection: Escapes malicious inputs in code editor preventing execution in error logs", async () => {
    const { container, getByTitle } = render(
      <App initialViewMode="compiler" />,
    );
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;
    const compileBtn = getByTitle("Compile Code");

    // Inject an XSS payload disguised as a label
    const maliciousCode = `JMP <img src=x onerror=alert(1)>`;

    await act(async () => {
      fireEvent.change(textarea, { target: { value: maliciousCode } });
    });

    await act(async () => {
      fireEvent.click(compileBtn);
    });

    const errorBox = container.querySelector(".yj-error-box");
    // Verify error box exists
    expect(errorBox).not.toBeNull();

    // Verify it doesn't render actual image tags
    const imgTags = errorBox?.querySelectorAll("img");
    expect(imgTags?.length).toBe(0);

    // Verify payload is rendered safely
    expect(errorBox?.textContent).toContain("<img src=x onerror=alert(1)>");

    cleanup();
  });

  it("Denial of Service: Does not crash on exceedingly large code blocks", async () => {
    const { container, getByTitle } = render(
      <App initialViewMode="compiler" />,
    );
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;
    const compileBtn = getByTitle("Compile Code");

    const largeInput = "NOP\n".repeat(20000); // 20k lines

    await act(async () => {
      fireEvent.change(textarea, { target: { value: largeInput } });
    });

    const start = performance.now();
    await act(async () => {
      fireEvent.click(compileBtn);
    });
    const end = performance.now();

    // The UI should survive and compile it within reasonable time without crashing the main thread
    expect(end - start).toBeLessThan(10000);

    cleanup();
  }, 20000);
});
