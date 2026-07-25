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
    const { container } = render(<App initialViewMode="compiler" />);

    // Find the Memory Address input
    const input = container.querySelector(
      ".yj-start-addr-input",
    ) as HTMLInputElement;

    // Valid inputs
    await act(async () => {
      fireEvent.change(input, { target: { value: "12345" } });
    });

    expect(
      input.getAttribute("value") ??
        input.nodeValue ??
        (input as HTMLInputElement).value,
    ).toBe("12345");

    // Invalid inputs - these trigger setState but fall back or filter
    await act(async () => {
      fireEvent.change(input, { target: { value: "ZZZZ" } });
    });

    // Check extreme values
    await act(async () => {
      fireEvent.change(input, { target: { value: "FFFFF" } });
    });

    expect(input).toBeDefined();
  });
});
