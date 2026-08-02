import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";
import { Logger } from "../../src/utils/logger";
import * as React from "react";

// A component that intentionally throws an error
const ProblematicComponent = () => {
  throw new Error("Simulated React Rendering Error");
};

describe("Milestone 7: ErrorBoundary Logic", () => {
  beforeEach(() => {
    Logger.clear();
    vi.spyOn(console, "error").mockImplementation(() => {}); // Suppress React error logs in test
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Safe Content</div>
      </ErrorBoundary>,
    );
    expect(getByText("Safe Content")).toBeDefined();
  });

  it("catches errors and renders fallback UI", () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>,
    );

    // Should display the error UI
    expect(getByText(/Fatal Crash/i)).toBeDefined();
    expect(
      getByText(/The 8086 Emulator encountered a critical error/i),
    ).toBeDefined();
  });

  it("logs the error to the Logger utility as FATAL", () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>,
    );

    const logs = Logger.getLogs();
    const fatalLogs = logs.filter((l) => l.level === "FATAL");
    expect(fatalLogs.length).toBeGreaterThan(0);
    expect(fatalLogs[0].context?.errorMessage).toBe(
      "Simulated React Rendering Error",
    );
  });

  it("allows reloading the page via the 'Reload Application' button", () => {
    const locationReloadSpy = vi
      .spyOn(window.location, "reload")
      .mockImplementation(() => {});

    const { getByText } = render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>,
    );

    const reloadBtn = getByText("Reload Application");
    fireEvent.click(reloadBtn);
    expect(locationReloadSpy).toHaveBeenCalled();
  });
});
