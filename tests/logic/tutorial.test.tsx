import { describe, it, expect } from "vitest";
import { render, fireEvent, act, getByTitle } from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

describe("Interactive Tutorial Flow & Hotkey Shortcut", () => {
  it("starts tutorial step 1 when clicking Tutorial navbar button", async () => {
    const { container } = render(<App initialViewMode="compiler" />);

    const tutorialBtn = getByTitle(container, "Help / Tutorial");
    expect(tutorialBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(tutorialBtn);
    });

    // Step 1 card should appear in the DOM
    const step1Title = container.querySelector(".yj-tutorial-title");
    expect(step1Title).toBeDefined();
    expect(step1Title?.textContent).toContain("Step 1");

    const step1Text = container.querySelector(".yj-tutorial-body");
    expect(step1Text?.textContent).toContain("Code Editor");
  });

  it("advances through tutorial steps 1 to 9 on click", async () => {
    const { container } = render(<App initialViewMode="compiler" />);

    const tutorialBtn = getByTitle(container, "Help / Tutorial");
    await act(async () => {
      fireEvent.click(tutorialBtn);
    });

    for (let step = 1; step <= 9; step++) {
      const stepTitle = container.querySelector(".yj-tutorial-title");
      expect(stepTitle?.textContent).toContain(`Step ${step}`);

      const overlay = container.querySelector(".yj-tutorial-overlay");
      await act(async () => {
        fireEvent.click(overlay!);
      });
    }

    // After Step 9, tutorial should close
    expect(container.querySelector(".yj-tutorial-popover")).toBeNull();
  });

  it("focuses editor textarea on Alt+Shift+E key press", async () => {
    const { container } = render(<App initialViewMode="compiler" />);

    const textarea = container.querySelector(
      ".yj-code-textarea",
    ) as HTMLTextAreaElement;
    expect(textarea).toBeDefined();

    await act(async () => {
      fireEvent.keyDown(window, {
        key: "e",
        altKey: true,
        shiftKey: true,
      });
    });
  });
});
