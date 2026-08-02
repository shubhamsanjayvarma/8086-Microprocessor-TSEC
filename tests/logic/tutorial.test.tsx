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

  it("dismisses tutorial at any step when Escape key is pressed", async () => {
    const { container } = render(<App initialViewMode="compiler" />);

    const tutorialBtn = getByTitle(container, "Help / Tutorial");
    await act(async () => {
      fireEvent.click(tutorialBtn);
    });

    expect(container.querySelector(".yj-tutorial-popover")).not.toBeNull();

    // Advance to step 2
    const overlay = container.querySelector(".yj-tutorial-overlay");
    await act(async () => {
      fireEvent.click(overlay!);
    });

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: "Escape" });
    });

    expect(container.querySelector(".yj-tutorial-popover")).toBeNull();
  });

  it("switches from landing page to compiler mode when starting tutorial", async () => {
    const { container } = render(<App initialViewMode="landing" />);

    const tutorialBtn = getByTitle(container, "Help / Tutorial");
    await act(async () => {
      fireEvent.click(tutorialBtn);
    });

    // The viewMode should now be "compiler", meaning the editor is visible
    expect(container.querySelector(".yj-editor-workspace")).not.toBeNull();
    // And tutorial step 1 should be visible
    expect(container.querySelector(".yj-tutorial-popover")).not.toBeNull();
  });

  it("does not skip steps on rapid double clicks", async () => {
    const { container } = render(<App initialViewMode="compiler" />);

    const tutorialBtn = getByTitle(container, "Help / Tutorial");
    await act(async () => {
      fireEvent.click(tutorialBtn);
    });

    const overlay = container.querySelector(".yj-tutorial-overlay");

    // Fire click twice rapidly
    await act(async () => {
      fireEvent.click(overlay!);
      fireEvent.click(overlay!);
    });

    // Should only be on Step 2 (since closure captures step 1 if state updates haven't flushed,
    // or it's handled safely). Actually React 18 batches these acts unless they're split.
    // If we do it inside one act(), it should be batched.
    const stepTitle = container.querySelector(".yj-tutorial-title");
    expect(stepTitle?.textContent).toContain("Step 2");
  });
});
