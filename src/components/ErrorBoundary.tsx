import React, { Component, ErrorInfo, ReactNode } from "react";
import { Logger } from "../utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.fatal("Unhandled UI crash", {
      errorMessage: error.message,
      stack: error.stack,
      errorInfo,
    });
  }

  private downloadLogs = () => {
    const logs = Logger.exportLogs();
    const blob = new Blob([logs], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `8086-crash-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1a1a2e",
            color: "#e94560",
            fontFamily: "monospace",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <h1>Fatal Crash</h1>
          <p>The 8086 Emulator encountered a critical error.</p>
          <button
            onClick={this.downloadLogs}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#e94560",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Download Crash Report
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "transparent",
              color: "#0f3460",
              border: "1px solid #0f3460",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
