import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { Logger } from "../../src/utils/logger";

// A malicious or broken component that throws a runtime error
const CrashingComponent = () => {
  throw new Error("Simulated React Rendering Crash");
};

describe("QA Testing - Error Boundary", () => {
  beforeEach(() => {
    Logger.clear();
    // Suppress console.error so the simulated crash doesn't clutter the test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("QA Test - Should intercept crash and display the Fatal Crash UI with download options", () => {
    // 1. Render the application wrapped in the Error Boundary
    render(
      <ErrorBoundary>
        <CrashingComponent />
      </ErrorBoundary>,
    );

    // 2. Verify the Error Boundary caught the crash and rendered the safe fallback UI
    expect(screen.getByText("Fatal Crash")).toBeDefined();
    expect(
      screen.getByText("The 8086 Emulator encountered a critical error."),
    ).toBeDefined();

    // 3. Verify the user has the ability to interact with the Download and Reload endpoints
    const downloadBtn = screen.getByText("Download Crash Report");
    const reloadBtn = screen.getByText("Reload Application");

    expect(downloadBtn).toBeDefined();
    expect(reloadBtn).toBeDefined();

    // 4. Verify the Logger caught the crash
    const logs = Logger.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].level).toBe("FATAL");
    expect(logs[0].message).toBe("Unhandled UI crash");
    expect(logs[0].context.errorMessage).toBe(
      "Simulated React Rendering Crash",
    );
  });
});
