import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import App from "../../src/App";
import * as React from "react";

describe("Milestone 5: Inter-Module Contract Testing", () => {
  describe("5.1 & 5.2 Error Propagation & UI Sync", () => {
    it("shows compilation errors on invalid code", async () => {
      const { container } = render(<App />);

      const textarea = container.querySelector(
        ".code-textarea",
      ) as HTMLTextAreaElement;

      await act(async () => {
        fireEvent.change(textarea, {
          target: { value: "JMP UNDEFINED_LABEL" },
        });
      });

      // Click compile
      const compileBtn = container.querySelector(
        ".btn-compile",
      ) as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(compileBtn);
      });

      // Should show error in status
      const statusText = container.querySelector(".status-text");
      expect(statusText?.textContent).toContain("Compilation Failed");

      // Should list error details
      const errorList = container.querySelector(".error-list");
      expect(errorList).toBeDefined();
      expect(errorList?.textContent).toContain("Undefined jump target label");
    });

    it("syncs registers to UI correctly after stepping", async () => {
      const { container } = render(<App />);

      const textarea = container.querySelector(
        ".code-textarea",
      ) as HTMLTextAreaElement;

      // Simple code to modify AX
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "MOV AX, 0x1234" } });
      });

      const compileBtn = container.querySelector(
        ".btn-compile",
      ) as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(compileBtn);
      });

      // Step once
      const stepBtn = container.querySelector(".btn-step") as HTMLButtonElement;
      await act(async () => {
        fireEvent.click(stepBtn);
      });

      // AX should be updated in the UI
      const axVal = screen.getByText("0x1234");
      expect(axVal).toBeDefined();
    });
  });
});
