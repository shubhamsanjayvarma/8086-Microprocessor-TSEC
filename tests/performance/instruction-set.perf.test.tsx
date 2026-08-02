import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import InstructionSetModal from "../../src/components/InstructionSetModal";

describe("InstructionSetModal - Space & Time Complexity", () => {
  afterEach(() => {
    cleanup();
  });

  it("Time Complexity: Render and filter 100 times rapidly", () => {
    render(
      <InstructionSetModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectExample={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /Search instruction, opcode/i,
    );
    const filters = ["MOV", "ADD", "JMP", "INT", "NOP", ""];

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      fireEvent.change(searchInput, {
        target: { value: filters[i % filters.length] },
      });
    }
    const end = performance.now();

    // 100 renders/filters can be slow in jsdom, allowing up to 10000ms
    expect(end - start).toBeLessThan(10000);
  }, 15000);

  it("Space Complexity: Mount and unmount modal 50 times without DOM node leak", () => {
    for (let i = 0; i < 50; i++) {
      const { unmount } = render(
        <InstructionSetModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectExample={vi.fn()}
        />,
      );
      unmount();
      // Ensure the modal container is actually removed
      expect(document.querySelector(".yj-instruction-modal")).toBeNull();
    }
  }, 30000);
});
