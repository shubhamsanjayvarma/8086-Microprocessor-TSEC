import { describe, it, expect } from "vitest";
import { render, fireEvent, act, getByText } from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

describe("Milestone 5: Inter-Module Contract Testing", () => {
  describe("5.1 & 5.2 Error Propagation & UI Sync", () => {
    it("shows compilation errors on invalid code", async () => {
      const { container } = render(<App />);

      const textarea = container.querySelector(
        ".yj-code-textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: "JMP UNDEFINED_LABEL" },
        });
      });

      // Click compile
      const compileBtn = getByText(container, "COMPILE") as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(compileBtn);
      });

      // Should list error details in yj-error-box
      const errorList = container.querySelector(".yj-error-box");
      expect(errorList).toBeDefined();
      expect(errorList?.textContent).toContain("Undefined jump target label");
    });

    it("syncs registers to UI correctly after stepping", async () => {
      const { container } = render(<App />);

      const textarea = container.querySelector(
        ".yj-code-textarea",
      ) as HTMLTextAreaElement;

      // Simple code to modify AX
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "MOV AX, 0x1234" } });
      });

      const compileBtn = getByText(container, "COMPILE") as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(compileBtn);
      });

      // Step once
      const stepBtn = getByText(container, "NEXT") as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(stepBtn);
      });

      // AX should be updated in the UI (H: 12, L: 34)
      const axValH = getByText(container, "12");
      const axValL = getByText(container, "34");
      expect(axValH).toBeDefined();
      expect(axValL).toBeDefined();
    });
  });
});
