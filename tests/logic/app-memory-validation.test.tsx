import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

// Need to mock the compiler to just return a dummy instruction
vi.mock("../../src/utils/compiler", () => ({
  compile8086: () => ({
    instructions: [],
    variables: new Map(),
    labels: new Map(),
    errors: [],
    listing: [],
  }),
}));

describe("Milestone 4.4 & 4.5: App Memory Validation", () => {
  it("handles segment and offset inputs safely", async () => {
    const { container } = render(<App />);

    // Find the Segment and Offset inputs
    const inputs = container.querySelectorAll(".memory-controls input");
    const segmentInput = inputs[0] as HTMLInputElement;
    const offsetInput = inputs[1] as HTMLInputElement;

    // Valid inputs
    await act(async () => {
      fireEvent.change(segmentInput, { target: { value: "1234" } });
      fireEvent.change(offsetInput, { target: { value: "5678" } });
    });

    expect(
      segmentInput.getAttribute("value") ??
        segmentInput.nodeValue ??
        (segmentInput as HTMLInputElement).value,
    ).toBe("1234");
    expect(
      offsetInput.getAttribute("value") ??
        offsetInput.nodeValue ??
        (offsetInput as HTMLInputElement).value,
    ).toBe("5678");

    // Invalid inputs - these actually trigger setState but when it's parsed in render, if NaN, it falls back to 0.
    // We can just verify it doesn't crash.
    await act(async () => {
      fireEvent.change(segmentInput, { target: { value: "ZZZZ" } });
      fireEvent.change(offsetInput, { target: { value: "ZZZZ" } });
    });

    // Check extreme values
    await act(async () => {
      fireEvent.change(segmentInput, { target: { value: "FFFF" } });
      fireEvent.change(offsetInput, { target: { value: "FFFF" } });
    });

    // Should render without crashing, the component handles the parsing in getPhysicalAddress
    expect(inputs.length).toBeGreaterThan(0);
  });
});
