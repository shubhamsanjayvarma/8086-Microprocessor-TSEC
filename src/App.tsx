import { useState, useEffect, useRef } from "react";
import {
  FileCode,
  Terminal,
  AlertCircle,
  Info,
  HelpCircle,
  Sun,
  Moon,
  Download,
  Copy,
  Check,
  Accessibility,
} from "lucide-react";
import { compile8086 } from "./utils/compiler";
import type { CompilerResult, ParsedInstruction } from "./utils/compiler";
import { Emulator, initialCPUState } from "./utils/emulator";
import type { CPUState } from "./utils/emulator";
import { examples } from "./utils/examples";
import { Logger } from "./utils/logger";
import "./App.css";

type ViewMode = "compiler" | "landing";

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>("compiler");
  const [code, setCode] = useState<string>(examples[0].code);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number>(0);
  const [compilerResult, setCompilerResult] = useState<CompilerResult | null>(
    null,
  );

  // CPU state
  const [cpuState, setCpuState] = useState<CPUState>(initialCPUState());
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runSpeed] = useState<number>(5); // steps per second
  const [, setStatusText] = useState<string>("Ready to Compile");

  // Input field state for runtime INT 21H / input
  const [runtimeInput, setRuntimeInput] = useState<string>("");

  // Memory view options
  const [memStartAddressHex, setMemStartAddressHex] = useState<string>("00000");
  const [editingMemAddr, setEditingMemAddr] = useState<number | null>(null);
  const [editingMemVal, setEditingMemVal] = useState<string>("");

  // Accessibility mode toggle
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);
  // Dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  // Copy success notification
  const [copied, setCopied] = useState<boolean>(false);

  const emulatorRef = useRef<Emulator | null>(null);
  const timerRef = useRef<number | null>(null);

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
    setCpuState(JSON.parse(JSON.stringify(emulator.state)));
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
      setCpuState(JSON.parse(JSON.stringify(emulatorRef.current.state)));

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
      setCpuState(JSON.parse(JSON.stringify(emulatorRef.current.state)));
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
      // Append input string to console or memory buffer
      emulatorRef.current.state.consoleOutput += runtimeInput + "\n";
      setCpuState(JSON.parse(JSON.stringify(emulatorRef.current.state)));
    }
    setRuntimeInput("");
  };

  return (
    <div
      className={`yj-app-wrapper ${isDarkMode ? "dark-theme" : "light-theme"}`}
    >
      {/* TOP HEADER NAVBAR */}
      <header className="yj-navbar">
        <div className="yj-navbar-left">
          <span
            className="yj-logo-text"
            onClick={() =>
              setViewMode(viewMode === "compiler" ? "landing" : "compiler")
            }
          >
            8086 Compiler
          </span>
        </div>

        <div className="yj-navbar-right">
          <button
            className="yj-nav-icon-btn"
            title="Help / Tutorial"
            onClick={() =>
              alert(
                "8086 Online Emulator Tutorial:\n1. Write or edit 8086 Assembly in Code Editor.\n2. Click COMPILE to assemble.\n3. Click RUN for automatic execution or NEXT for single stepping.\n4. Observe Registers, Flags, and Memory in real-time.",
              )
            }
          >
            <HelpCircle size={18} />
          </button>

          <button
            className={`yj-nav-icon-btn ${viewMode === "compiler" ? "active" : ""}`}
            title="Compiler View"
            onClick={() => setViewMode("compiler")}
          >
            <Terminal size={18} />
          </button>

          <button
            className={`yj-nav-icon-btn ${viewMode === "landing" ? "active" : ""}`}
            title="Info / Landing Page"
            onClick={() => setViewMode("landing")}
          >
            <Info size={18} />
          </button>

          <button
            className="yj-nav-icon-btn"
            title="Toggle Light/Dark Theme"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* VIEW MODE 1: LANDING PAGE */}
      {viewMode === "landing" ? (
        <div className="yj-landing-container">
          <section className="yj-hero-card">
            <div className="yj-hero-img-col">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80"
                alt="8086 Microprocessor"
                className="yj-hero-img"
              />
            </div>
            <div className="yj-hero-text-col">
              <h2>Online 8086 EMULATOR</h2>
              <p>Platform and Device Independent!</p>
              <p>Now run 8086 based assembly programs right in browser.</p>
              <p>
                Open Source :{" "}
                <a
                  href="https://github.com/shubhamsanjayvarma/8086-Microprocessor-TSEC"
                  target="_blank"
                  rel="noreferrer"
                >
                  Github Repository
                </a>
              </p>
              <p>Made Using React, TypeScript and Vite.</p>
              <div className="yj-hero-btns">
                <button
                  className="yj-btn-gold"
                  onClick={() => setViewMode("compiler")}
                >
                  TRY ONLINE 8086 COMPILER
                </button>
                <button
                  className="yj-btn-outlined"
                  onClick={() => {
                    const el = document.querySelector(".yj-features-grid");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  INSTRUCTION SET
                </button>
              </div>
            </div>
          </section>

          <div className="yj-features-grid">
            <div className="yj-feature-box">
              <h3>Multiple Themes</h3>
              <p>
                We know that programmers love the dark theme. Toggle between
                Bright and Dark Theme using the theme button in Navbar.
              </p>
            </div>
            <div className="yj-feature-box">
              <h3>Access To 1 MB Memory</h3>
              <p>
                The Emulator supports complete 1 MB Memory, which can be
                accessed from the memory table.
              </p>
            </div>
            <div className="yj-feature-box">
              <h3>Validated Jump and Call using Labels</h3>
              <p>
                As Jumps and calls only allows valid labels, it does not permit
                any jumps to incorrect position.
              </p>
            </div>
            <div className="yj-feature-box">
              <h3>Selected Interrupts</h3>
              <p>
                Being an Emulator, this does not have 'true' memory so it
                supports select few interrupts.
              </p>
            </div>
            <div className="yj-feature-box">
              <h3>Line by Line Execution</h3>
              <p>
                Supports running all instructions automatically, or manual line
                by line execution. You can also stop the automatic execution
                with a simple button click.
              </p>
            </div>
            <div className="yj-feature-box">
              <h3>Check Registers and Flags in Real Time</h3>
              <p>
                Updates Flags and registers along with the execution, so can
                check the state of Emulator easily, all in a single view.
              </p>
            </div>
          </div>

          <section className="yj-contributors-section">
            <h2>Contributors</h2>
            <div className="yj-contributors-grid">
              <a
                href="https://github.com/shubhamsanjayvarma"
                target="_blank"
                rel="noreferrer"
                className="yj-contributor-card"
              >
                <img
                  src="https://github.com/shubhamsanjayvarma.png"
                  alt="Shubham Varma"
                />
                <span>Shubham Varma</span>
              </a>
              <a
                href="https://github.com/pratikforge"
                target="_blank"
                rel="noreferrer"
                className="yj-contributor-card"
              >
                <img
                  src="https://github.com/pratikforge.png"
                  alt="Pratik Yadav"
                />
                <span>Pratik Yadav</span>
              </a>
              <a
                href="https://github.com/tiwaripiyush140-glitch"
                target="_blank"
                rel="noreferrer"
                className="yj-contributor-card"
              >
                <img
                  src="https://github.com/tiwaripiyush140-glitch.png"
                  alt="Piyush Tiwari"
                />
                <span>Piyush Tiwari</span>
              </a>
              <a
                href="https://github.com/tarakdesai19"
                target="_blank"
                rel="noreferrer"
                className="yj-contributor-card"
              >
                <img
                  src="https://github.com/tarakdesai19.png"
                  alt="Tarak Desai"
                />
                <span>Tarak Desai</span>
              </a>
            </div>
          </section>

          <footer className="yj-footer">
            © Reserved | Developed by •{" "}
            <a href="https://github.com/shubhamsanjayvarma">Shubham Varma</a> •{" "}
            <a href="https://github.com/pratikforge">Pratik Yadav</a> •{" "}
            <a href="https://github.com/tiwaripiyush140-glitch">
              Piyush Tiwari
            </a>{" "}
            • <a href="https://github.com/tarakdesai19">Tarak Desai</a>
          </footer>
        </div>
      ) : (
        /* VIEW MODE 2: COMPILER / EMULATOR DASHBOARD */
        <div className="yj-compiler-main">
          <div className="yj-compiler-grid">
            {/* LEFT COLUMN: CODE EDITOR & INPUT / OUTPUT */}
            <div className="yj-col-left">
              {/* Header row: Code Editor title + Accessibility Mode Toggle */}
              <div className="yj-editor-header">
                <h2 className="yj-section-title">Code Editor</h2>
                <div className="yj-accessibility-toggle">
                  <Accessibility size={16} />
                  <span className="yj-toggle-label">Accessibility Mode</span>
                  <button
                    className={`yj-switch ${accessibilityMode ? "on" : "off"}`}
                    onClick={() => setAccessibilityMode(!accessibilityMode)}
                  >
                    <span className="yj-switch-knob"></span>
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="yj-action-row">
                <button className="yj-btn-compile-gold" onClick={handleCompile}>
                  COMPILE
                </button>
                <button
                  className={`yj-btn-action ${isRunning ? "active" : ""}`}
                  onClick={() => setIsRunning(!isRunning)}
                  disabled={compilerResult?.errors.length ? true : false}
                >
                  {isRunning ? "PAUSE" : "RUN"}
                </button>
                <button
                  className="yj-btn-action"
                  onClick={handleStep}
                  disabled={
                    isRunning || (compilerResult?.errors.length ? true : false)
                  }
                >
                  NEXT
                </button>
                <button className="yj-btn-action" onClick={handleReset}>
                  STOP
                </button>
              </div>

              {/* Code Editor Box with sidebar action tools */}
              <div className="yj-editor-box">
                <div className="yj-editor-inner">
                  {/* Line numbers gutter */}
                  <div className="yj-line-gutter">
                    {code.split("\n").map((_, idx) => (
                      <div
                        key={idx}
                        className={`yj-line-no ${currentLineIndex === idx ? "active-line" : ""}`}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  {/* Main textarea */}
                  <textarea
                    className="yj-code-textarea"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="; Write 8086 Assembly code here..."
                    spellCheck={false}
                  />
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

              {/* GitHub example link banner */}
              <div className="yj-example-banner">
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

              {/* Input Section */}
              <div className="yj-input-section">
                <span className="yj-input-label">Input</span>
                <div className="yj-input-box-wrapper">
                  <input
                    className="yj-input-field"
                    value={runtimeInput}
                    onChange={(e) => setRuntimeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()}
                    placeholder="Enter input string or values..."
                  />
                  <button
                    className="yj-input-submit-btn"
                    onClick={handleInputSubmit}
                    title="Submit Input"
                  >
                    ✓
                  </button>
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

            {/* RIGHT COLUMN: REGISTERS, SEGMENTS, POINTERS, FLAGS, MEMORY */}
            <div className="yj-col-right">
              {/* TOP ROW OF 3 TABLES: REG, SEGMENTS, POINTERS */}
              <div className="yj-top-tables-row">
                {/* 1. REG TABLE (Reg / H / L) */}
                <div className="yj-card-table">
                  <div className="yj-card-table-header">
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

              {/* FLAGS CARD ROW */}
              <div className="yj-flags-card">
                <div className="yj-flags-header">
                  <span>Flags:</span>
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

              {/* MEMORY CARD */}
              <div className="yj-memory-card">
                <div className="yj-memory-header-line">
                  <h2>Memory</h2>
                  <div className="yj-start-addr-wrapper">
                    <span className="yj-addr-lbl">Start Address</span>
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
                    <button
                      className="yj-btn-set"
                      onClick={() =>
                        setMemStartAddressHex(
                          memStartAddressHex.padStart(5, "0"),
                        )
                      }
                    >
                      SET
                    </button>
                  </div>
                </div>

                {/* 16-Column Hex Memory Matrix */}
                <div className="yj-mem-matrix">{render16ColMemoryCells()}</div>
              </div>
            </div>
          </div>

          {/* Floating chatbot widget button */}
          <div className="yj-floating-chat-widget" title="Ask Questions / Chat">
            <div className="yj-chat-icon-hexagon">💬</div>
          </div>

          {/* FOOTER */}
          <footer className="yj-footer">
            © Reserved | Developed by •{" "}
            <a href="https://github.com/shubhamsanjayvarma">Shubham Varma</a> •{" "}
            <a href="https://github.com/pratikforge">Pratik Yadav</a> •{" "}
            <a href="https://github.com/tiwaripiyush140-glitch">
              Piyush Tiwari
            </a>{" "}
            • <a href="https://github.com/tarakdesai19">Tarak Desai</a>
          </footer>
        </div>
      )}
    </div>
  );
}
