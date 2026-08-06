import { useState, useEffect, useRef } from "react";
import {
  FileCode,
  AlertCircle,
  Info,
  HelpCircle,
  Sun,
  Moon,
  Download,
  Copy,
  Check,
  Cpu,
  Play,
  Pause,
  SkipForward,
  Code2,
  Square,
  Terminal,
} from "lucide-react";
import { compile8086 } from "./utils/compiler";
import type { CompilerResult, ParsedInstruction } from "./utils/compiler";
import { Emulator, initialCPUState, cloneCPUState } from "./utils/emulator";
import type { CPUState } from "./utils/emulator";
import { examples } from "./utils/examples";
import { Logger } from "./utils/logger";
import { GlassButton } from "./components/ui/glass-button";
import InstructionSetModal from "./components/InstructionSetModal";
import { highlight8086Assembly } from "./utils/syntaxHighlighter";
import GlowHorizonDemo from "./components/ui/glow-horizon-demo";
import DeveloperProfiles from "./components/ui/developer-profiles";
import { ThemeToggleFAB } from "./components/ui/theme-toggle-fab";
import { HoverButton } from "./components/ui/hover-glow-button";
import "./App.css";

export type ViewMode = "compiler" | "landing";

export interface AppProps {
  initialViewMode?: ViewMode;
}

export default function App({ initialViewMode = "landing" }: AppProps = {}) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [code, setCode] = useState<string>(examples[0].code);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number>(0);
  const [compilerResult, setCompilerResult] = useState<CompilerResult | null>(
    null,
  );

  // CPU state
  const [cpuState, setCpuState] = useState<CPUState>(initialCPUState());
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runSpeed] = useState<number>(1000); // steps per second
  const [, setStatusText] = useState<string>("Ready to Compile");

  // Input field state for runtime INT 21H / input
  const [runtimeInput, setRuntimeInput] = useState<string>("");

  // Memory view options
  const [memStartAddressHex, setMemStartAddressHex] = useState<string>("00000");
  const [editingMemAddr, setEditingMemAddr] = useState<number | null>(null);
  const [editingMemVal, setEditingMemVal] = useState<string>("");

  // Dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  // Instruction Set Modal toggle
  const [isInstructionSetOpen, setIsInstructionSetOpen] =
    useState<boolean>(false);
  // Interactive Tutorial state (Steps 1 to 4)
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  // Copy success notification
  const [copied, setCopied] = useState<boolean>(false);

  const [editorScrollTop, setEditorScrollTop] = useState<number>(0);

  const emulatorRef = useRef<Emulator | null>(null);
  const timerRef = useRef<number | null>(null);
  const highlightLayerRef = useRef<HTMLPreElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setEditorScrollTop(target.scrollTop);
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = target.scrollTop;
      highlightLayerRef.current.scrollLeft = target.scrollLeft;
    }
  };

  const updateActiveLineFromTextarea = (textarea: HTMLTextAreaElement) => {
    const textBeforeCursor = textarea.value.substring(
      0,
      textarea.selectionStart,
    );
    const lineNo = textBeforeCursor.split("\n").length - 1;
    setCurrentLineIndex(lineNo);
  };

  const handleLineClick = (lineIndex: number) => {
    if (!textareaRef.current) return;
    const lines = code.split("\n");
    let startOffset = 0;
    for (let i = 0; i < lineIndex; i++) {
      startOffset += lines[i].length + 1;
    }
    const endOffset = startOffset + lines[lineIndex].length;

    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(startOffset, endOffset);
    setCurrentLineIndex(lineIndex);
  };

  // Keyboard shortcut listener: Alt+Shift+E to focus editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        const textarea = document.querySelector(
          ".yj-code-textarea",
        ) as HTMLTextAreaElement;
        textarea?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const handleStartTutorial = () => {
    setViewMode("compiler");
    setTutorialStep(1);
  };

  const handleNextTutorialStep = () => {
    if (tutorialStep === null) return;
    if (tutorialStep >= 9) {
      setTutorialStep(null);
    } else {
      setTutorialStep(tutorialStep + 1);
    }
  };

  // Keyboard shortcut listener for tutorial & editor focus
  useEffect(() => {
    if (tutorialStep !== null) {
      const handleTutorialKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "Escape" || e.key === "Esc") {
          setTutorialStep(null);
        } else {
          handleNextTutorialStep();
        }
      };
      window.addEventListener("keydown", handleTutorialKeyDown, true);
      return () =>
        window.removeEventListener("keydown", handleTutorialKeyDown, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialStep]);

  // Spotlight position updater
  useEffect(() => {
    if (tutorialStep === null) {
      setSpotlightRect(null);
      return;
    }

    const updateSpotlight = () => {
      const selectors: Record<number, string> = {
        1: ".yj-editor-workspace",
        2: ".yj-tutorial-step-compile",
        3: ".yj-tutorial-step-run",
        4: ".yj-tutorial-step-step",
        5: ".yj-tutorial-step-stop",
        6: ".yj-top-tables-row",
        7: ".yj-flags-card",
        8: ".yj-memory-card",
        9: ".yj-editor-side-tools",
      };
      const targetEl = document.querySelector(selectors[tutorialStep]);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        setSpotlightRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    return () => window.removeEventListener("resize", updateSpotlight);
  }, [tutorialStep, viewMode]);

  // Auto-compile on mount
  useEffect(() => {
    handleCompile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompile = () => {
    setIsRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const result = compile8086(code);
    setCompilerResult(result);

    if (result.errors.length > 0) {
      setStatusText("Compilation Failed");
      setCurrentLineIndex(-1);
      Logger.error("Compilation Failed", { errors: result.errors });
      return;
    }

    // Set initial memory values from compiled variables
    const initialMem = new Map<number, number[]>();
    result.variables.forEach((variable) => {
      initialMem.set(variable.offset, variable.values);
    });

    const emulator = new Emulator(result.instructions, initialMem);
    emulatorRef.current = emulator;
    setCpuState(cloneCPUState(emulator.state));
    setStatusText("Compilation Successful. Ready to Run.");

    // Highlight the first instruction
    updateCurrentInstructionHighlight(
      emulator.state.registers.IP,
      result.instructions,
    );
  };

  const updateCurrentInstructionHighlight = (
    ip: number,
    instructions: ParsedInstruction[],
  ) => {
    const activeInst = instructions.find((inst) => inst.byteOffset === ip);
    if (activeInst) {
      setCurrentLineIndex(activeInst.lineNo - 1);
    } else {
      setCurrentLineIndex(-1);
    }
  };
  // Expose emulator for testing
  useEffect(() => {
    (window as any).emulator = emulatorRef.current;
    (window as any).forceUpdateCpu = () => {
      if (emulatorRef.current) setCpuState({ ...emulatorRef.current.state });
    };
  }, [compilerResult]);

  const handleStep = () => {
    if (
      !emulatorRef.current ||
      (compilerResult && compilerResult.errors.length > 0)
    ) {
      handleCompile();
      return;
    }

    if (emulatorRef.current.state.halted) {
      setStatusText("CPU Halted. Click Reset to run again.");
      setIsRunning(false);
      return;
    }

    try {
      const executedInst = emulatorRef.current.step();
      setCpuState(cloneCPUState(emulatorRef.current.state));

      if (executedInst) {
        setStatusText(`Executed: ${executedInst.originalLine.trim()}`);
      }
    } catch (err) {
      Logger.fatal("Emulator crashed during step execution", err);
      setStatusText("Emulator Crashed. Check logs.");
      setIsRunning(false);
      return;
    }

    if (emulatorRef.current.state.halted) {
      setStatusText("CPU Halted.");
      setIsRunning(false);
    } else {
      updateCurrentInstructionHighlight(
        emulatorRef.current.state.registers.IP,
        compilerResult?.instructions || [],
      );
    }
  };

  // Run emulation continuously
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isRunning) {
      const intervalMs = Math.max(10, 1000 / runSpeed);
      timerRef.current = window.setInterval(() => {
        if (emulatorRef.current && !emulatorRef.current.state.halted) {
          handleStep();
        } else {
          setIsRunning(false);
        }
      }, intervalMs);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, runSpeed, compilerResult]);

  const handleReset = () => {
    setIsRunning(false);
    handleCompile();
  };

  // Format helper for register display (Hex, 2 digits for 8-bit, 4 digits for 16-bit)
  const fmtHex = (val: number, digits: 2 | 4 = 4) => {
    return (val & (digits === 2 ? 0xff : 0xffff))
      .toString(16)
      .padStart(digits, "0")
      .toUpperCase();
  };

  // Save edited memory byte cell back to CPU state
  const saveMemoryEdit = (address: number) => {
    if (!emulatorRef.current) return;
    const parsedVal = parseInt(editingMemVal, 16);
    if (!isNaN(parsedVal)) {
      emulatorRef.current.state.memory[address] = parsedVal & 0xff;
      setCpuState(cloneCPUState(emulatorRef.current.state));
    }
    setEditingMemAddr(null);
  };

  // Render 8 rows x 16 columns of memory hex cells (128 bytes total)
  const render16ColMemoryCells = () => {
    const baseAddr = parseInt(memStartAddressHex, 16) || 0;
    const rows = [];
    const colsPerRow = 16;
    const totalRows = 8;

    for (let r = 0; r < totalRows; r++) {
      const rowStartAddr = (baseAddr + r * colsPerRow) & 0xfffff;
      const cells = [];

      for (let c = 0; c < colsPerRow; c++) {
        const cellAddr = (rowStartAddr + c) & 0xfffff;
        const val = cpuState.memory[cellAddr] || 0;
        const isEditing = editingMemAddr === cellAddr;

        cells.push(
          <span
            key={`cell-${cellAddr}`}
            className={`mem-matrix-cell ${isEditing ? "editing" : ""}`}
            onDoubleClick={() => {
              setEditingMemAddr(cellAddr);
              setEditingMemVal(val.toString(16).padStart(2, "0").toUpperCase());
            }}
            title={`Addr: 0x${cellAddr.toString(16).padStart(5, "0").toUpperCase()}`}
          >
            {isEditing ? (
              <input
                className="mem-matrix-input"
                value={editingMemVal}
                onChange={(e) => setEditingMemVal(e.target.value)}
                onBlur={() => saveMemoryEdit(cellAddr)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveMemoryEdit(cellAddr);
                  if (e.key === "Escape") setEditingMemAddr(null);
                }}
                autoFocus
                maxLength={2}
              />
            ) : (
              val.toString(16).padStart(2, "0").toUpperCase()
            )}
          </span>,
        );
      }

      rows.push(
        <div key={`row-${r}`} className="mem-matrix-row">
          {cells}
        </div>,
      );
    }

    return rows;
  };

  // Download code as .asm file
  const handleDownloadAsm = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "program.asm";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Next sample code
  const handleNextSample = () => {
    const nextIdx = (selectedExampleIndex + 1) % examples.length;
    setSelectedExampleIndex(nextIdx);
    setCode(examples[nextIdx].code);
    setIsRunning(false);
  };

  // Handle Input Submit
  const handleInputSubmit = () => {
    if (!runtimeInput) return;
    if (emulatorRef.current) {
      emulatorRef.current.provideInput(runtimeInput);
      setCpuState(cloneCPUState(emulatorRef.current.state));
    }
    setRuntimeInput("");
  };

  return (
    <div
      className={`yj-app-wrapper ${isDarkMode ? "dark-theme" : "light-theme"}`}
    >
      {/* NO NAVBAR OR FAB IN COMPILER VIEW */}

      {/* VIEW MODE 1: LANDING PAGE */}
      {viewMode === "landing" ? (
        <div style={{ background: "var(--glow-bg)", position: "relative" }}>
          {/* Subtle Grid Grounding */}
          <div className="glow-grid-bg absolute inset-0 z-0 opacity-40 pointer-events-none" />
          {/* Hero section */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <GlowHorizonDemo isDarkMode={isDarkMode} />
            {/* CTA button overlaid on hero */}
            <div
              style={{
                position: "absolute",
                bottom: "15%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                zIndex: 20,
              }}
            >
              <HoverButton
                onClick={() => setViewMode("compiler")}
                glowColor="var(--glow-card-hover-border)"
                backgroundColor="var(--glow-card-bg)"
                textColor="var(--glow-text-primary)"
                hoverTextColor="var(--glow-text-primary)"
                className="w-auto text-xl font-bold border-2 border-[var(--glow-card-hover-border)] shadow-[0_0_30px_var(--glow-card-hover-border)] backdrop-blur-md rounded-full hover:scale-[1.03] active:scale-95"
                style={{ padding: "16px 40px" }}
              >
                Try Compiler
              </HoverButton>
            </div>
          </div>
          {/* Developer profiles section */}
          <DeveloperProfiles />

          {/* Floating Theme Toggle */}
          <ThemeToggleFAB
            isDarkMode={isDarkMode}
            toggle={() => setIsDarkMode(!isDarkMode)}
          />
        </div>
      ) : (
        /* VIEW MODE 2: COMPILER / EMULATOR DASHBOARD */
        <div className="yj-compiler-main" style={{ position: "relative" }}>
          {/* Subtle Grid Grounding */}
          <div className="glow-grid-bg absolute inset-0 z-0 opacity-40 pointer-events-none" />

          {/* TOP NAVIGATION BAR */}
          <div
            className="yj-top-navbar"
            style={{
              position: "relative",
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              marginBottom: "8px",
            }}
          >
            <div
              onClick={() => setViewMode("landing")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <img
                src={isDarkMode ? "/logo.jpg" : "/logo.png"}
                alt="TSEC Logo"
                style={{
                  height: "32px",
                  width: "32px",
                  borderRadius: "4px",
                  objectFit: "contain",
                }}
              />
              <div
                className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--yj-primary)] to-[var(--yj-primary-hover)]"
                style={{
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontFamily: '"Orbitron", sans-serif',
                }}
              >
                TSEC 8086 COMPILER
              </div>
            </div>
            <div className="yj-app-options-row">
              <GlassButton
                size="icon"
                className="yj-nav-icon-btn"
                title="Help / Tutorial"
                onClick={handleStartTutorial}
              >
                <HelpCircle size={18} />
              </GlassButton>
              <GlassButton
                size="icon"
                className="yj-nav-icon-btn active"
                title="Terminal / Console"
                onClick={() => {}}
              >
                <Terminal size={18} />
              </GlassButton>
              <GlassButton
                size="icon"
                className="yj-nav-icon-btn"
                title="Info / Landing Page"
                onClick={() => setViewMode("landing")}
              >
                <Info size={18} />
              </GlassButton>
              <GlassButton
                size="icon"
                className="yj-nav-icon-btn"
                title="Instruction Set Options & CPU Reference"
                onClick={() => setIsInstructionSetOpen(true)}
              >
                <Cpu size={18} />
              </GlassButton>
              <GlassButton
                size="icon"
                className="yj-nav-icon-btn"
                title="Toggle Light/Dark Theme"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </GlassButton>
            </div>
          </div>

          <div
            className="yj-compiler-grid"
            style={{ position: "relative", zIndex: 10 }}
          >
            {/* LEFT COLUMN: CODE EDITOR & INPUT / OUTPUT */}
            <div className="yj-col-left">
              {/* Header row */}
              <div
                className="yj-editor-container yj-io-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  flex: 1,
                }}
              >
                <div
                  className="yj-editor-header yj-card-table-header"
                  style={{ padding: "8px 16px" }}
                >
                  <div className="yj-editor-header-left">
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        letterSpacing: "1px",
                      }}
                    >
                      Code Editor
                    </span>
                  </div>

                  <div
                    className="yj-editor-header-right"
                    style={{
                      display: "flex",
                      gap: "20px",
                      alignItems: "center",
                    }}
                  >
                    {/* Action Buttons Row */}
                    <div
                      className="yj-action-row"
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <GlassButton
                        size="icon"
                        className="yj-btn-compile-primary yj-tutorial-step-compile"
                        onClick={handleCompile}
                        title="Compile Code"
                        style={{
                          background:
                            "color-mix(in srgb, var(--yj-primary) 80%, transparent)",
                          color: "#fff",
                          border:
                            "1px solid color-mix(in srgb, var(--yj-primary) 50%, transparent)",
                          borderRadius: "50%",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Code2 size={18} />
                      </GlassButton>
                      <GlassButton
                        size="icon"
                        className={`yj-btn-action yj-tutorial-step-run ${isRunning ? "active" : ""}`}
                        onClick={() => setIsRunning(!isRunning)}
                        disabled={compilerResult?.errors.length ? true : false}
                        title={isRunning ? "Pause Execution" : "Run Code"}
                        style={{
                          background:
                            "color-mix(in srgb, var(--yj-input-bg) 70%, transparent)",
                          color: "var(--yj-text-main)",
                          border: "1px solid var(--yj-border)",
                          borderRadius: "50%",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isRunning ? <Pause size={18} /> : <Play size={18} />}
                      </GlassButton>
                      <GlassButton
                        size="icon"
                        className="yj-btn-action yj-tutorial-step-step"
                        onClick={handleStep}
                        disabled={
                          isRunning ||
                          (compilerResult?.errors.length ? true : false)
                        }
                        title="Next Instruction (Step)"
                        style={{
                          background:
                            "color-mix(in srgb, var(--yj-input-bg) 70%, transparent)",
                          color: "var(--yj-text-main)",
                          border: "1px solid var(--yj-border)",
                          borderRadius: "50%",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SkipForward size={18} />
                      </GlassButton>
                      <GlassButton
                        size="icon"
                        className="yj-btn-action yj-tutorial-step-stop"
                        onClick={handleReset}
                        title="Stop Execution / Reset"
                        style={{
                          background:
                            "color-mix(in srgb, var(--yj-input-bg) 70%, transparent)",
                          color: "var(--yj-text-main)",
                          border: "1px solid var(--yj-border)",
                          borderRadius: "50%",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Square size={18} />
                      </GlassButton>
                    </div>
                  </div>
                </div>

                {/* Code Editor Box with sidebar action tools */}
                <div
                  className="yj-editor-box"
                  style={{
                    border: "none",
                    borderRadius: 0,
                    boxShadow: "none",
                    flex: 1,
                  }}
                >
                  <div className="yj-editor-inner">
                    {/* Line numbers gutter */}
                    <div className="yj-line-gutter">
                      {code.split("\n").map((_, idx) => (
                        <div
                          key={idx}
                          className={`yj-line-no ${currentLineIndex === idx ? "active-line" : ""}`}
                          onClick={() => handleLineClick(idx)}
                          title={`Click to select line ${idx + 1}`}
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>

                    {/* Main Syntax Highlighted Workspace */}
                    <div className="yj-editor-workspace">
                      {currentLineIndex >= 0 && (
                        <div
                          className="yj-active-line-highlight"
                          style={{
                            top: `${currentLineIndex * 22 + 12 - editorScrollTop}px`,
                          }}
                        />
                      )}
                      <pre
                        ref={highlightLayerRef}
                        className="yj-code-highlight-layer"
                        dangerouslySetInnerHTML={{
                          __html: highlight8086Assembly(code) || " ",
                        }}
                      />
                      <textarea
                        ref={textareaRef}
                        className="yj-code-textarea yj-code-textarea-overlay"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          updateActiveLineFromTextarea(e.target);
                        }}
                        onKeyUp={(e) =>
                          updateActiveLineFromTextarea(e.currentTarget)
                        }
                        onClick={(e) =>
                          updateActiveLineFromTextarea(e.currentTarget)
                        }
                        onSelect={(e) =>
                          updateActiveLineFromTextarea(e.currentTarget)
                        }
                        onScroll={handleEditorScroll}
                        placeholder="; Write 8086 Assembly code here..."
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {/* Right-side icon bar inside editor box */}
                  <div className="yj-editor-side-tools">
                    <button
                      className="yj-side-icon-btn"
                      onClick={handleDownloadAsm}
                      title="Download .asm File"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      className="yj-side-icon-btn"
                      onClick={handleNextSample}
                      title="Load Next Sample Code"
                    >
                      <FileCode size={18} />
                    </button>
                    <button
                      className="yj-side-icon-btn"
                      onClick={handleCopyCode}
                      title="Copy Code"
                    >
                      {copied ? (
                        <Check size={18} color="#228b22" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Assembler Listing section if errors exist */}
              {compilerResult && compilerResult.errors.length > 0 && (
                <div className="yj-error-box">
                  {compilerResult.errors.map((err, i) => (
                    <div key={i} className="yj-error-line">
                      <AlertCircle size={14} /> Line {err.lineNo}: {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: EXAMPLE, INPUT, OUTPUT, FLAGS, MEMORY, REGISTERS */}
            <div className="yj-col-right">
              {/* 1. EXECUTION & CONSOLE CARD */}
              <div className="yj-io-card">
                <div className="yj-card-table-header">
                  <span>Execution & Console</span>
                  <div className="yj-example-inline">
                    <span className="text-dim">Example: </span>
                    <select
                      value={selectedExampleIndex}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setSelectedExampleIndex(idx);
                        setCode(examples[idx].code);
                        setIsRunning(false);
                      }}
                      className="yj-example-select"
                    >
                      {examples.map((ex, idx) => (
                        <option key={idx} value={idx}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="yj-io-card-body">
                  {/* Input Section */}
                  <div className="yj-input-section">
                    <span className="yj-input-label">Input</span>
                    <div className="yj-input-box-wrapper">
                      <input
                        className="yj-input-field"
                        value={runtimeInput}
                        onChange={(e) => setRuntimeInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleInputSubmit()
                        }
                        placeholder={
                          cpuState?.awaitingInput
                            ? "Awaiting input..."
                            : "Enter input string or values..."
                        }
                        autoFocus={cpuState?.awaitingInput}
                        style={
                          cpuState?.awaitingInput
                            ? { border: "2px solid var(--accent)" }
                            : undefined
                        }
                      />
                      <GlassButton
                        size="icon"
                        className="yj-input-submit-btn"
                        onClick={handleInputSubmit}
                        title="Submit Input"
                        style={{
                          borderRadius: "50%",
                          background:
                            "color-mix(in srgb, var(--yj-primary) 80%, transparent)",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={18} />
                      </GlassButton>
                    </div>
                  </div>

                  {/* Output Section */}
                  <div className="yj-output-section">
                    <span className="yj-output-label">Output</span>
                    <div className="yj-output-box">
                      {cpuState.consoleOutput ? (
                        <pre className="yj-output-text">
                          {cpuState.consoleOutput}
                        </pre>
                      ) : (
                        <span className="text-dim italic">
                          Runtime output will appear here...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. FLAGS CARD ROW */}
              <div className="yj-flags-card">
                <div className="yj-flags-header">
                  <span>Flags</span>
                </div>
                <div className="yj-flags-table">
                  <div className="yj-flags-head-row">
                    <span>OF</span>
                    <span>DF</span>
                    <span>IF</span>
                    <span>TF</span>
                    <span>SF</span>
                    <span>ZF</span>
                    <span>AF</span>
                    <span>PF</span>
                    <span>CF</span>
                  </div>
                  <div className="yj-flags-val-row">
                    <span className={cpuState.flags.OF ? "flag-on" : ""}>
                      {cpuState.flags.OF ? 1 : 0}
                    </span>
                    <span className={cpuState.flags.DF ? "flag-on" : ""}>
                      {cpuState.flags.DF ? 1 : 0}
                    </span>
                    <span className={cpuState.flags.IF ? "flag-on" : ""}>
                      {cpuState.flags.IF ? 1 : 0}
                    </span>
                    <span className="flag-off">0</span>
                    <span className={cpuState.flags.SF ? "flag-on" : ""}>
                      {cpuState.flags.SF ? 1 : 0}
                    </span>
                    <span className={cpuState.flags.ZF ? "flag-on" : ""}>
                      {cpuState.flags.ZF ? 1 : 0}
                    </span>
                    <span className={cpuState.flags.AF ? "flag-on" : ""}>
                      {cpuState.flags.AF ? 1 : 0}
                    </span>
                    <span className={cpuState.flags.PF ? "flag-on" : ""}>
                      {cpuState.flags.PF ? 1 : 0}
                    </span>
                    <span className={cpuState.flags.CF ? "flag-on" : ""}>
                      {cpuState.flags.CF ? 1 : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. MEMORY CARD */}
              <div className="yj-memory-card">
                <div className="yj-card-table-header">
                  <span>Memory Matrix</span>
                  <div className="yj-start-addr-wrapper">
                    <span className="yj-addr-lbl">Start Addr</span>
                    <input
                      className="yj-start-addr-input"
                      value={memStartAddressHex}
                      onChange={(e) =>
                        setMemStartAddressHex(
                          e.target.value
                            .replace(/[^0-9a-fA-F]/g, "")
                            .slice(0, 5),
                        )
                      }
                      maxLength={5}
                    />
                    <GlassButton
                      size="icon"
                      className="yj-btn-set"
                      onClick={() =>
                        setMemStartAddressHex(
                          memStartAddressHex.padStart(5, "0"),
                        )
                      }
                      style={{
                        borderRadius: "50%",
                        background:
                          "color-mix(in srgb, var(--yj-primary) 80%, transparent)",
                        fontSize: "0.75rem",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      SET
                    </GlassButton>
                  </div>
                </div>
                <div className="yj-memory-card-body">
                  <div className="yj-mem-matrix">
                    {render16ColMemoryCells()}
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW OF 3 TABLES: REG, SEGMENTS, POINTERS */}
              <div className="yj-top-tables-row">
                {/* 1. REG TABLE (Reg / H / L) */}
                <div className="yj-card-table">
                  <div className="yj-card-table-header-3col">
                    <span>Reg</span>
                    <span>H</span>
                    <span>L</span>
                  </div>
                  <div className="yj-card-table-body">
                    <div className="yj-table-row">
                      <span className="yj-cell-lbl">A</span>
                      <span className="yj-cell-val">
                        {fmtHex((cpuState.registers.AX >> 8) & 0xff, 2)}
                      </span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.AX & 0xff, 2)}
                      </span>
                    </div>
                    <div className="yj-table-row">
                      <span className="yj-cell-lbl">B</span>
                      <span className="yj-cell-val">
                        {fmtHex((cpuState.registers.BX >> 8) & 0xff, 2)}
                      </span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.BX & 0xff, 2)}
                      </span>
                    </div>
                    <div className="yj-table-row">
                      <span className="yj-cell-lbl">C</span>
                      <span className="yj-cell-val">
                        {fmtHex((cpuState.registers.CX >> 8) & 0xff, 2)}
                      </span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.CX & 0xff, 2)}
                      </span>
                    </div>
                    <div className="yj-table-row">
                      <span className="yj-cell-lbl">D</span>
                      <span className="yj-cell-val">
                        {fmtHex((cpuState.registers.DX >> 8) & 0xff, 2)}
                      </span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.DX & 0xff, 2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. SEGMENTS TABLE */}
                <div className="yj-card-table">
                  <div className="yj-card-table-header">
                    <span>Segments</span>
                  </div>
                  <div className="yj-card-table-body">
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">SS</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.SS, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">DS</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.DS, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">ES</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.ES, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">CS</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.CS, 4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. POINTERS TABLE */}
                <div className="yj-card-table">
                  <div className="yj-card-table-header">
                    <span>Pointers</span>
                  </div>
                  <div className="yj-card-table-body">
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">SP</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.SP, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">BP</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.BP, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">SI</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.SI, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col">
                      <span className="yj-cell-lbl">DI</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.DI, 4)}
                      </span>
                    </div>
                    <div className="yj-table-row-2col yj-ip-row">
                      <span className="yj-cell-lbl">IP</span>
                      <span className="yj-cell-val">
                        {fmtHex(cpuState.registers.IP, 4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COMPILER FOOTER */}
          <div
            className="yj-compiler-footer"
            style={{
              textAlign: "center",
              padding: "12px",
              fontSize: "12px",
              color: "var(--yj-text-dim)",
              fontFamily: "monospace",
              letterSpacing: "0.5px",
            }}
          >
            © Reserved | Developed by •{" "}
            <a
              href="https://github.com/shubhamsanjayvarma"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--yj-primary)", textDecoration: "none" }}
              className="hover:underline"
            >
              Shubham Varma
            </a>{" "}
            •{" "}
            <a
              href="https://github.com/pratikforge"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--yj-primary)", textDecoration: "none" }}
              className="hover:underline"
            >
              Pratik Yadav
            </a>{" "}
            •{" "}
            <a
              href="https://github.com/tiwaripiyush140-glitch"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--yj-primary)", textDecoration: "none" }}
              className="hover:underline"
            >
              Piyush Tiwari
            </a>{" "}
            •{" "}
            <a
              href="https://github.com/tarakdesai19"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--yj-primary)", textDecoration: "none" }}
              className="hover:underline"
            >
              Tarak Desai
            </a>
          </div>
        </div>
      )}

      {/* INTERACTIVE GUIDED TUTORIAL OVERLAY */}
      {tutorialStep !== null && (
        <div className="yj-tutorial-overlay" onClick={handleNextTutorialStep}>
          {spotlightRect && (
            <div
              className="yj-tutorial-spotlight"
              style={{
                top: spotlightRect.top - 6,
                left: spotlightRect.left - 6,
                width: spotlightRect.width + 12,
                height: spotlightRect.height + 12,
              }}
            />
          )}
          <div
            className={`yj-tutorial-popover step-${tutorialStep}`}
            onClick={handleNextTutorialStep}
          >
            <div className="yj-tutorial-header">
              <span className="yj-tutorial-title">
                Step {tutorialStep} of 9
              </span>
              <div className="yj-tutorial-header-actions">
                <span className="yj-tutorial-step-hint">Press Any Key →</span>
                <button
                  className="yj-tutorial-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTutorialStep(null);
                  }}
                  title="Close Tutorial (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="yj-tutorial-divider" />
            <div className="yj-tutorial-body">
              {tutorialStep === 1 && (
                <>
                  <p>
                    <strong>Code Editor:</strong> Write & edit 8086 Assembly
                    code here.
                  </p>
                  <div className="yj-hotkey-badge">
                    <span className="yj-kbd">Alt+Shift+E</span> to focus editor.
                  </div>
                </>
              )}
              {tutorialStep === 2 && (
                <p>
                  <strong>Compile Button:</strong> Assembles code and checks for
                  syntax errors.
                </p>
              )}
              {tutorialStep === 3 && (
                <p>
                  <strong>Run / Pause Button:</strong> Executes assembly code
                  continuously.
                </p>
              )}
              {tutorialStep === 4 && (
                <p>
                  <strong>Step Button:</strong> Executes code line-by-line for
                  step debugging.
                </p>
              )}
              {tutorialStep === 5 && (
                <p>
                  <strong>Stop Button:</strong> Halts execution & resets CPU
                  register state.
                </p>
              )}
              {tutorialStep === 6 && (
                <p>
                  <strong>Registers & Pointers:</strong> Displays real-time AX,
                  BX, CX, DX, IP, SP, BP, SI, DI values.
                </p>
              )}
              {tutorialStep === 7 && (
                <p>
                  <strong>CPU Flags:</strong> Tracks Overflow, Direction,
                  Interrupt, Sign, Zero, Carry flags.
                </p>
              )}
              {tutorialStep === 8 && (
                <p>
                  <strong>RAM Memory Matrix:</strong> Inspect and edit 16-column
                  memory hex bytes.
                </p>
              )}
              {tutorialStep === 9 && (
                <p>
                  <strong>Download & Tools:</strong> Download assembly code or
                  copy workspace snippet.
                </p>
              )}
            </div>
            <div className="yj-tutorial-footer">
              <span>
                Press <strong>ANY key</strong> or{" "}
                <strong>click anywhere</strong> to continue • Press{" "}
                <strong>ESC</strong> to exit
              </span>
            </div>
          </div>
        </div>
      )}
      {/* INSTRUCTION SET MODAL */}
      <InstructionSetModal
        isOpen={isInstructionSetOpen}
        onClose={() => setIsInstructionSetOpen(false)}
        onSelectExample={(exampleCode) => {
          setCode(exampleCode);
          setViewMode("compiler");
        }}
      />
    </div>
  );
}
