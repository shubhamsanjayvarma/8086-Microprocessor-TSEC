import { render, fireEvent, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../../src/App";

describe("Interactive Tutorial - Performance", () => {
  it("Performance: Starting tutorial renders efficiently", async () => {
    const { container, getByTitle } = render(
      <App initialViewMode="compiler" />,
    );

    const tutorialBtn = getByTitle("Help / Tutorial");

    const start = performance.now();
    await act(async () => {
      fireEvent.click(tutorialBtn);
    });
    const end = performance.now();

    expect(end - start).toBeLessThan(1000);
    expect(container.querySelector(".yj-tutorial-popover")).not.toBeNull();
  });
});
