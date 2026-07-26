import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import InstructionSetModal from "../../src/components/InstructionSetModal";

describe("InstructionSetModal Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <InstructionSetModal
        isOpen={false}
        onClose={vi.fn()}
        onSelectExample={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header, tabs, and instructions when isOpen is true", () => {
    render(
      <InstructionSetModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectExample={vi.fn()}
      />,
    );

    expect(screen.getByText("8086 Assembly Instruction Set")).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Search instruction, opcode/i),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Data Transfer" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Arithmetic" })).toBeDefined();
  });

  it("filters instructions by category tab", () => {
    render(
      <InstructionSetModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectExample={vi.fn()}
      />,
    );

    const arithmeticTab = screen.getByRole("button", { name: "Arithmetic" });
    fireEvent.click(arithmeticTab);

    // ADD should be visible, MOV should not
    expect(screen.getByText("ADD")).toBeDefined();
    expect(screen.queryByText("MOV")).toBeNull();
  });

  it("filters instructions by search query", () => {
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
    fireEvent.change(searchInput, { target: { value: "XCHG" } });

    expect(screen.getByText("XCHG")).toBeDefined();
    expect(screen.queryByText("ADD")).toBeNull();
  });

  it("calls onSelectExample when clicking Insert Example button", () => {
    const onSelectExampleMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <InstructionSetModal
        isOpen={true}
        onClose={onCloseMock}
        onSelectExample={onSelectExampleMock}
      />,
    );

    // Search for MOV
    const searchInput = screen.getByPlaceholderText(
      /Search instruction, opcode/i,
    );
    fireEvent.change(searchInput, { target: { value: "MOV" } });

    const insertBtns = screen.getAllByText("Insert Example");
    expect(insertBtns.length).toBeGreaterThan(0);

    fireEvent.click(insertBtns[0]);
    expect(onSelectExampleMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("triggers onClose when clicking close button or pressing ESC key", () => {
    const onCloseMock = vi.fn();

    render(
      <InstructionSetModal
        isOpen={true}
        onClose={onCloseMock}
        onSelectExample={vi.fn()}
      />,
    );

    const closeBtn = screen.getByTitle("Close instruction reference");
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });
});
