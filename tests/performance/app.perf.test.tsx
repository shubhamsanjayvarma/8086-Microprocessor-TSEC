import { describe, it, expect } from "vitest";
import { render, fireEvent, act, cleanup } from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

describe("Milestone 6: App State & Data Flow Performance", () => {
  it("Space Complexity: UI does not leak DOM nodes on repeated re-renders", async () => {
    const { container, getByTitle } = render(
      <App initialViewMode="compiler" />,
    );
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;
    const compileBtn = getByTitle("Compile Code");

    const getNodes = () => container.getElementsByTagName("*").length;
    const initialNodes = getNodes();

    // Trigger state changes 20 times
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        fireEvent.change(textarea, { target: { value: `MOV AX, ${i}` } });
      });
      await act(async () => {
        fireEvent.click(compileBtn);
      });
    }

    const finalNodes = getNodes();
    // DOM size should be stable after repeated compilations
    expect(finalNodes).toBeLessThanOrEqual(initialNodes + 20); // Small margin for error list items

    cleanup();
  }, 30000);

  it("Time Complexity: Rapid typing is responsive (O(1) updates)", async () => {
    const { container } = render(<App initialViewMode="compiler" />);
    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;

    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: `MOV AX, ${i}\n`.repeat(10) },
        });
      });
    }
    const end = performance.now();

    // 50 state updates on editor should take < 20000ms even in jsdom
    expect(end - start).toBeLessThan(20000);
    cleanup();
  }, 30000);
});
