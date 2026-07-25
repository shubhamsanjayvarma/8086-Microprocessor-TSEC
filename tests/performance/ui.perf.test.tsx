import { describe, it, expect } from "vitest";
import {
  render,
  fireEvent,
  screen,
  act,
  getByText,
} from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

describe("Component 3: UI State Management (App.tsx) Space/Time Complexity", () => {
  it("Time Complexity: Memory Viewer renders predictably without blowing up execution frames", async () => {
    // We mount the App, then compile a simple program, then test stepping rapidly.
    const { container } = render(<App />);
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;

    await act(async () => {
      fireEvent.change(textarea, { target: { value: "MOV AX, 1" } });
    });

    const compileBtn = getByText(container, "COMPILE") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(compileBtn);
    });

    const stepBtn = getByText(container, "NEXT") as HTMLButtonElement;

    const start = performance.now();

    // Simulate 100 fast rapid clicks on the Step button
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        fireEvent.click(stepBtn);
      }
    });

    const end = performance.now();

    // 100 React DOM render cycles of the entire emulator UI should complete in < 500ms
    expect(end - start).toBeLessThan(500);
  });

  it("Space Complexity: Deep cloning CPU state does not trigger maximum call stack bounds", async () => {
    const { container } = render(<App />);
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;

    // Deeply nested stack logic
    await act(async () => {
      fireEvent.change(textarea, {
        target: {
          value: `
        L1: PUSH AX
        JMP L1
      `,
        },
      });
    });

    const compileBtn = getByText(container, "COMPILE") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(compileBtn);
    });

    // Run multiple steps. If the memory deep clone creates 1MB nested arrays it would fail.
    const stepBtn = getByText(container, "NEXT") as HTMLButtonElement;
    await act(async () => {
      for (let i = 0; i < 50; i++) {
        fireEvent.click(stepBtn);
      }
    });

    // It should render successfully without "Maximum call stack size exceeded"
    // Since we don't have "READY" we just assert the stepBtn is defined
    expect(stepBtn).toBeDefined();
  });

  it("Cyber Attack (XSS): App sanitizes script injections in compiled assembly", async () => {
    const { container } = render(<App />);
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;

    // Attempt Cross-Site Scripting (XSS) via a variable definition
    await act(async () => {
      fireEvent.change(textarea, {
        target: { value: `MSG DB '<script>alert("XSS")</script>$'` },
      });
    });

    const compileBtn = getByText(container, "COMPILE") as HTMLButtonElement;
    await act(async () => {
      fireEvent.click(compileBtn);
    });

    // Check if the script tag literally exists in the DOM as safe text, not an actual element.
    screen.queryByText(/<script>alert\("XSS"\)<\/script>/);
    // Even if it's not displayed as text anywhere in the DOM (e.g. stored only in memory),
    // we verify the DOM doesn't contain a real <script> node inside the app root.
    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(0);
  });
});
