import { useState, useEffect, useRef } from "react";
import {
  Play,
  Square,
  SkipForward,
  RefreshCw,
  FileCode,
  Terminal,
  Cpu,
  Database,
  AlertCircle,
  CheckCircle,
  Sliders,
  Search,
  Edit2,
} from "lucide-react";
import { compile8086 } from "./utils/compiler";
import type { CompilerResult, ParsedInstruction } from "./utils/compiler";
import { Emulator, initialCPUState } from "./utils/emulator";
import type { CPUState } from "./utils/emulator";
import { examples } from "./utils/examples";
import "./App.css";

export default function App() {
  const [code, setCode] = useState<string>(examples[0].code);
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number>(0);
  const [compilerResult, setCompilerResult] = useState<CompilerResult | null>(
    null,
  );

  // CPU state
  const [cpuState, setCpuState] = useState<CPUState>(initialCPUState());
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runSpeed, setRunSpeed] = useState<number>(5); // steps per second
  const [statusText, setStatusText] = useState<string>("Ready to Compile");

  // Memory view options
  const [memSegment, setMemSegment] = useState<string>("0700");
  const [memOffset, setMemOffset] = useState<string>("0000");
  const [searchTarget, setSearchTarget] = useState<string>("");
  const [editingMemAddr, setEditingMemAddr] = useState<number | null>(null);
  const [editingMemVal, setEditingMemVal] = useState<string>("");

  // Register display format: hex | dec | bin
  const [regFormat, setRegFormat] = useState<"hex" | "dec" | "bin">("hex");

  const emulatorRef = useRef<Emulator | null>(null);
  const timerRef = useRef<number | null>(null);

  // Auto-compile on mount
  useEffect(() => {
    handleCompile();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync example selection
  const handleExampleChange = (index: number) => {
    setSelectedExampleIndex(index);
    setCode(examples[index].code);
    setIsRunning(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

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

    const executedInst = emulatorRef.current.step();
    setCpuState(JSON.parse(JSON.stringify(emulatorRef.current.state)));

    if (executedInst) {
      setStatusText(`Executed: ${executedInst.originalLine.trim()}`);
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
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, runSpeed, compilerResult]);

  const handleReset = () => {
    setIsRunning(false);
    handleCompile();
  };

  // Format helper for register display
  const formatRegister = (val: number, size: 8 | 16 = 16) => {
    if (regFormat === "dec") {
      // Signed 16-bit or 8-bit
      if (size === 16) {
        return val >= 0x8000 ? val - 0x10000 : val;
      } else {
        const val8 = val & 0xff;
        return val8 >= 0x80 ? val8 - 0x100 : val8;
      }
    }
    if (regFormat === "bin") {
      return val.toString(2).padStart(size, "0");
    }
    // Default Hex
    return (
      "0x" +
      val
        .toString(16)
        .padStart(size / 4, "0")
        .toUpperCase()
    );
  };

  // Convert segment & offset inputs to safe numbers
  const getMemoryAddressOffset = (): number => {
    const seg = parseInt(memSegment, 16) || 0;
    const off = parseInt(memOffset, 16) || 0;
    return (seg * 16 + off) & 0xfffff;
  };

  const handleSearchMemory = () => {
    if (!searchTarget) return;
    const cleanTarget = searchTarget.trim().toLowerCase();

    // Check if target is segment:offset
    if (cleanTarget.includes(":")) {
      const parts = cleanTarget.split(":");
      setMemSegment(parts[0]);
      setMemOffset(parts[1]);
      return;
    }

    // Check if target is a variable/symbol
    if (compilerResult) {
      const symUpper = cleanTarget.toUpperCase();
      if (compilerResult.variables.has(symUpper)) {
        const offset = compilerResult.variables.get(symUpper)!.offset;
        setMemSegment("0700");
        setMemOffset(offset.toString(16).padStart(4, "0"));
        return;
      }
      if (compilerResult.labels.has(symUpper)) {
        const offset = compilerResult.labels.get(symUpper)!;
        setMemSegment("0700");
        setMemOffset(offset.toString(16).padStart(4, "0"));
        return;
      }
    }

    // Try parsing as raw offset
    const num = parseInt(cleanTarget, 16);
    if (!isNaN(num)) {
      setMemOffset(num.toString(16).padStart(4, "0"));
    }
  };

  // Write edited memory byte cell back to CPU state
  const saveMemoryEdit = (address: number) => {
    if (!emulatorRef.current) return;
    const parsedVal = parseInt(editingMemVal, 16);
    if (!isNaN(parsedVal)) {
      emulatorRef.current.state.memory[address] = parsedVal & 0xff;
      setCpuState(JSON.parse(JSON.stringify(emulatorRef.current.state)));
    }
    setEditingMemAddr(null);
  };

  // Render a 8x8 memory slice around current selection
  const renderMemoryCells = () => {
    const baseAddr = getMemoryAddressOffset();
    const rows = [];
    const bytesPerRow = 8;
    const totalRows = 8;

    for (let r = 0; r < totalRows; r++) {
      const rowStartAddr = (baseAddr + r * bytesPerRow) & 0xfffff;
      const cells = [];
      const asciiCells = [];

      for (let c = 0; c < bytesPerRow; c++) {
        const cellAddr = (rowStartAddr + c) & 0xfffff;
        const val = cpuState.memory[cellAddr];
        const isEditing = editingMemAddr === cellAddr;

        cells.push(
          <td
            key={`cell-${cellAddr}`}
            className={`memory-cell ${isEditing ? "editing" : ""}`}
            onDoubleClick={() => {
              setEditingMemAddr(cellAddr);
              setEditingMemVal(val.toString(16).padStart(2, "0").toUpperCase());
            }}
          >
            {isEditing ? (
              <input
                className="memory-edit-input"
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
          </td>,
        );

        // ASCII printable representation
        const char = val >= 32 && val <= 126 ? String.fromCharCode(val) : ".";
        asciiCells.push(
          <span key={`ascii-${cellAddr}`} className="ascii-char">
            {char}
          </span>,
        );
      }

      const segmentHex = Math.floor(rowStartAddr / 16)
        .toString(16)
        .padStart(4, "0")
        .toUpperCase();
      const offsetHex = (rowStartAddr % 16)
        .toString(16)
        .padStart(4, "0")
        .toUpperCase();

      rows.push(
        <tr key={`row-${r}`} className="memory-row">
          <td className="memory-address">
            {segmentHex}:{offsetHex}
          </td>
          {cells}
          <td className="memory-ascii">{asciiCells}</td>
        </tr>,
      );
    }

    return rows;
  };

  // Helper to extract stack list for display (SS:SP downwards)
  const getStackElements = () => {
    const elements = [];
    const ssBase = cpuState.registers.SS * 16;
    const sp = cpuState.registers.SP;
    const initialSp = 0xfffe;

    // Show 6 words down from current SP, or between current SP and initial SP
    const maxEntries = 6;
    let currentSp = sp;

    for (let i = 0; i < maxEntries; i++) {
      const address = (ssBase + currentSp) & 0xfffff;
      const low = cpuState.memory[address];
      const high = cpuState.memory[(address + 1) & 0xfffff];
      const wordVal = (high << 8) | low;

      elements.push({
        spOffset: "0x" + currentSp.toString(16).padStart(4, "0").toUpperCase(),
        physicalAddr:
          "0x" + address.toString(16).padStart(5, "0").toUpperCase(),
        value: "0x" + wordVal.toString(16).padStart(4, "0").toUpperCase(),
        isTop: i === 0,
      });

      currentSp = (currentSp + 2) & 0xffff;
      if (currentSp > initialSp) break;
    }

    return elements;
  };

  // Compile errors display
  const errorAlerts = compilerResult?.errors.map((err, i) => (
    <div key={i} className="error-alert">
      <AlertCircle className="icon-sm" />
      <span>
        Line {err.lineNo}: {err.message}
      </span>
    </div>
  ));

  return (
    <div className="app-container">
      {/* HEADER NAVBAR */}
      <header className="navbar">
        <div className="navbar-logo">
          <Cpu className="logo-icon" />
          <div className="logo-title">
            <h1>8086 Compiler & Emulator</h1>
            <span className="logo-tag">TSEC Microprocessor IDE</span>
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="status-container">
          <div
            className={`status-badge ${cpuState.halted ? "halted" : isRunning ? "running" : "ready"}`}
          >
            <span className="pulse-dot"></span>
            {cpuState.halted ? "HALTED" : isRunning ? "RUNNING" : "READY"}
          </div>
          <span className="status-text">{statusText}</span>
        </div>

        <div className="navbar-examples">
          <FileCode className="example-icon" />
          <select
            value={selectedExampleIndex}
            onChange={(e) => handleExampleChange(Number(e.target.value))}
            className="example-dropdown"
          >
            {examples.map((ex, idx) => (
              <option key={idx} value={idx}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* CONTROLS TOOLBAR */}
      <section className="toolbar">
        <div className="control-group">
          <button
            className="btn btn-compile"
            onClick={handleCompile}
            title="Compile Assembly (F7)"
          >
            <CheckCircle className="icon" />
            <span>Compile</span>
          </button>

          <div className="divider"></div>

          <button
            className="btn btn-run"
            onClick={() => setIsRunning(!isRunning)}
            disabled={compilerResult?.errors.length ? true : false}
            title={isRunning ? "Pause execution" : "Run program continuous"}
          >
            {isRunning ? (
              <Square className="icon" />
            ) : (
              <Play className="icon animate-pulse" />
            )}
            <span>{isRunning ? "Pause" : "Run"}</span>
          </button>

          <button
            className="btn btn-step"
            onClick={handleStep}
            disabled={
              isRunning || (compilerResult?.errors.length ? true : false)
            }
            title="Single Step execution (F8)"
          >
            <SkipForward className="icon" />
            <span>Step</span>
          </button>

          <button
            className="btn btn-reset"
            onClick={handleReset}
            title="Reset CPU State and Memory"
          >
            <RefreshCw className="icon" />
            <span>Reset</span>
          </button>
        </div>

        <div className="slider-group">
          <Sliders className="icon-sm text-dim" />
          <span className="slider-label">Speed: {runSpeed} Hz</span>
          <input
            type="range"
            min="1"
            max="50"
            value={runSpeed}
            onChange={(e) => setRunSpeed(Number(e.target.value))}
            className="speed-slider"
          />
        </div>

        <div className="format-selectors">
          <span className="format-label">Format:</span>
          <button
            className={`format-btn ${regFormat === "hex" ? "active" : ""}`}
            onClick={() => setRegFormat("hex")}
          >
            HEX
          </button>
          <button
            className={`format-btn ${regFormat === "dec" ? "active" : ""}`}
            onClick={() => setRegFormat("dec")}
          >
            DEC
          </button>
          <button
            className={`format-btn ${regFormat === "bin" ? "active" : ""}`}
            onClick={() => setRegFormat("bin")}
          >
            BIN
          </button>
        </div>
      </section>

      {/* DASHBOARD GRID */}
      <main className="dashboard-grid">
        {/* COLUMN 1: EDITOR & OUTPUTS */}
        <section className="dashboard-card editor-section">
          <div className="card-header">
            <div className="card-title">
              <FileCode className="header-icon" />
              <h2>Assembly Source Code</h2>
            </div>
            <span className="card-subtitle">
              {examples[selectedExampleIndex].description}
            </span>
          </div>

          <div className="editor-container">
            {/* Custom line numbers aligned with current IP */}
            <div className="line-numbers">
              {code.split("\n").map((_, index) => (
                <div
                  key={index}
                  className={`line-num ${currentLineIndex === index ? "active-line" : ""}`}
                >
                  {currentLineIndex === index && (
                    <div className="execution-arrow">➤</div>
                  )}
                  {index + 1}
                </div>
              ))}
            </div>
            <textarea
              className="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="; Write 8086 Assembly here..."
              spellCheck={false}
            />
          </div>

          {/* CONSOLE & LOGS */}
          <div className="console-panel">
            <div className="console-tabs">
              <span className="console-tab active">
                <Terminal className="tab-icon" /> Console Output
              </span>
            </div>
            <div className="console-body">
              {cpuState.consoleOutput ? (
                <pre className="console-text">{cpuState.consoleOutput}</pre>
              ) : (
                <span className="text-muted italic">
                  Console output will appear here after INT 21H trigger.
                </span>
              )}
            </div>
          </div>

          {/* COMPILER ALERTS OR LISTING */}
          <div className="listing-panel">
            <h3>Assembler Listing & Logs</h3>
            {compilerResult && compilerResult.errors.length > 0 ? (
              <div className="error-list">{errorAlerts}</div>
            ) : compilerResult && compilerResult.listing.length > 0 ? (
              <div className="listing-scroll">
                <pre className="listing-text">
                  {`Offset  Machine Code  Instruction\n` +
                    `---------------------------------\n` +
                    compilerResult.listing.join("\n")}
                </pre>
              </div>
            ) : (
              <span className="text-muted italic">
                Compile the code to view the disassembly listing.
              </span>
            )}
          </div>
        </section>

        {/* COLUMN 2: REGISTERS & FLAGS */}
        <section className="dashboard-card registers-section">
          <div className="card-header">
            <div className="card-title">
              <Cpu className="header-icon" />
              <h2>CPU Registers</h2>
            </div>
          </div>

          <div className="registers-grid">
            {/* General Purpose Registers */}
            <div className="registers-group">
              <h3>General Purpose</h3>
              <div className="reg-row">
                <div className="reg-card">
                  <span className="reg-name">AX</span>
                  <span className="reg-value">
                    {formatRegister(cpuState.registers.AX, 16)}
                  </span>
                  <div className="reg-split">
                    <span>
                      AH:{" "}
                      {formatRegister((cpuState.registers.AX >> 8) & 0xff, 8)}
                    </span>
                    <span>
                      AL: {formatRegister(cpuState.registers.AX & 0xff, 8)}
                    </span>
                  </div>
                </div>
                <div className="reg-card">
                  <span className="reg-name">BX</span>
                  <span className="reg-value">
                    {formatRegister(cpuState.registers.BX, 16)}
                  </span>
                  <div className="reg-split">
                    <span>
                      BH:{" "}
                      {formatRegister((cpuState.registers.BX >> 8) & 0xff, 8)}
                    </span>
                    <span>
                      BL: {formatRegister(cpuState.registers.BX & 0xff, 8)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="reg-row">
                <div className="reg-card">
                  <span className="reg-name">CX</span>
                  <span className="reg-value">
                    {formatRegister(cpuState.registers.CX, 16)}
                  </span>
                  <div className="reg-split">
                    <span>
                      CH:{" "}
                      {formatRegister((cpuState.registers.CX >> 8) & 0xff, 8)}
                    </span>
                    <span>
                      CL: {formatRegister(cpuState.registers.CX & 0xff, 8)}
                    </span>
                  </div>
                </div>
                <div className="reg-card">
                  <span className="reg-name">DX</span>
                  <span className="reg-value">
                    {formatRegister(cpuState.registers.DX, 16)}
                  </span>
                  <div className="reg-split">
                    <span>
                      DH:{" "}
                      {formatRegister((cpuState.registers.DX >> 8) & 0xff, 8)}
                    </span>
                    <span>
                      DL: {formatRegister(cpuState.registers.DX & 0xff, 8)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Index & Pointers */}
            <div className="registers-group">
              <h3>Index & Pointers</h3>
              <div className="pointer-grid">
                <div className="pointer-card">
                  <span className="pointer-name">SI</span>
                  <span className="pointer-value">
                    {formatRegister(cpuState.registers.SI, 16)}
                  </span>
                </div>
                <div className="pointer-card">
                  <span className="pointer-name">DI</span>
                  <span className="pointer-value">
                    {formatRegister(cpuState.registers.DI, 16)}
                  </span>
                </div>
                <div className="pointer-card">
                  <span className="pointer-name">SP</span>
                  <span className="pointer-value">
                    {formatRegister(cpuState.registers.SP, 16)}
                  </span>
                </div>
                <div className="pointer-card">
                  <span className="pointer-name">BP</span>
                  <span className="pointer-value">
                    {formatRegister(cpuState.registers.BP, 16)}
                  </span>
                </div>
                <div className="pointer-card highlight-ip">
                  <span className="pointer-name">IP</span>
                  <span className="pointer-value">
                    {formatRegister(cpuState.registers.IP, 16)}
                  </span>
                </div>
              </div>
            </div>

            {/* Segment Registers */}
            <div className="registers-group">
              <h3>Segments</h3>
              <div className="segment-grid">
                <div className="segment-card">
                  <span className="segment-name">CS</span>
                  <span className="segment-value">
                    {formatRegister(cpuState.registers.CS, 16)}
                  </span>
                </div>
                <div className="segment-card">
                  <span className="segment-name">DS</span>
                  <span className="segment-value">
                    {formatRegister(cpuState.registers.DS, 16)}
                  </span>
                </div>
                <div className="segment-card">
                  <span className="segment-name">SS</span>
                  <span className="segment-value">
                    {formatRegister(cpuState.registers.SS, 16)}
                  </span>
                </div>
                <div className="segment-card">
                  <span className="segment-name">ES</span>
                  <span className="segment-value">
                    {formatRegister(cpuState.registers.ES, 16)}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Flags */}
            <div className="registers-group flags-group">
              <h3>Status Flags</h3>
              <div className="flags-grid">
                <div
                  className={`flag-badge ${cpuState.flags.CF ? "active" : ""}`}
                  title="Carry Flag: Set on arithmetic carry/borrow"
                >
                  <span className="flag-lbl">CF</span>
                  <span className="flag-state">
                    {cpuState.flags.CF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.ZF ? "active" : ""}`}
                  title="Zero Flag: Set if operation result is zero"
                >
                  <span className="flag-lbl">ZF</span>
                  <span className="flag-state">
                    {cpuState.flags.ZF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.SF ? "active" : ""}`}
                  title="Sign Flag: Set if result is negative"
                >
                  <span className="flag-lbl">SF</span>
                  <span className="flag-state">
                    {cpuState.flags.SF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.OF ? "active" : ""}`}
                  title="Overflow Flag: Set if signed arithmetic overflow occurs"
                >
                  <span className="flag-lbl">OF</span>
                  <span className="flag-state">
                    {cpuState.flags.OF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.PF ? "active" : ""}`}
                  title="Parity Flag: Set if low 8 bits of result contain even number of 1s"
                >
                  <span className="flag-lbl">PF</span>
                  <span className="flag-state">
                    {cpuState.flags.PF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.AF ? "active" : ""}`}
                  title="Auxiliary Carry Flag: Used for BCD operations"
                >
                  <span className="flag-lbl">AF</span>
                  <span className="flag-state">
                    {cpuState.flags.AF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.DF ? "active" : ""}`}
                  title="Direction Flag: Controls string auto-inc/dec direction"
                >
                  <span className="flag-lbl">DF</span>
                  <span className="flag-state">
                    {cpuState.flags.DF ? "1" : "0"}
                  </span>
                </div>
                <div
                  className={`flag-badge ${cpuState.flags.IF ? "active" : ""}`}
                  title="Interrupt Enable Flag: Set if interrupts are enabled"
                >
                  <span className="flag-lbl">IF</span>
                  <span className="flag-state">
                    {cpuState.flags.IF ? "1" : "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Instruction Count */}
            <div className="cycles-panel">
              <span className="cycles-lbl">Instruction Step Cycles:</span>
              <span className="cycles-val">{cpuState.cycles}</span>
            </div>
          </div>
        </section>

        {/* COLUMN 3: MEMORY & STACK VIEWERS */}
        <section className="dashboard-card memory-section">
          <div className="card-header">
            <div className="card-title">
              <Database className="header-icon" />
              <h2>System Memory</h2>
            </div>
          </div>

          {/* Memory Search */}
          <div className="memory-controls">
            <div className="addr-inputs">
              <input
                type="text"
                placeholder="Seg"
                value={memSegment}
                onChange={(e) => setMemSegment(e.target.value)}
                className="hex-input"
                maxLength={4}
              />
              <span className="colon-separator">:</span>
              <input
                type="text"
                placeholder="Offset"
                value={memOffset}
                onChange={(e) => setMemOffset(e.target.value)}
                className="hex-input"
                maxLength={4}
              />
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search symbol/hex..."
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                className="search-input"
                onKeyDown={(e) => e.key === "Enter" && handleSearchMemory()}
              />
              <button onClick={handleSearchMemory} className="search-btn">
                <Search className="icon-sm" />
              </button>
            </div>
          </div>

          {/* Memory Table */}
          <div className="memory-table-container">
            <table className="memory-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>+0</th>
                  <th>+1</th>
                  <th>+2</th>
                  <th>+3</th>
                  <th>+4</th>
                  <th>+5</th>
                  <th>+6</th>
                  <th>+7</th>
                  <th>ASCII</th>
                </tr>
              </thead>
              <tbody>{renderMemoryCells()}</tbody>
            </table>
          </div>
          <div className="table-caption text-dim italic">
            <Edit2 className="icon-xs inline-block mr-1" /> Double-click any
            cell to edit its hex value directly.
          </div>

          {/* STACK VISUALIZER */}
          <div className="stack-container">
            <h3>Stack Viewer (SS:SP)</h3>
            <div className="stack-body">
              {getStackElements().length > 0 ? (
                <div className="stack-list">
                  {getStackElements().map((el, i) => (
                    <div
                      key={i}
                      className={`stack-item ${el.isTop ? "stack-top" : ""}`}
                    >
                      <div className="stack-indicator">
                        {el.isTop ? "SP ➜" : ""}
                      </div>
                      <div className="stack-address">{el.spOffset}</div>
                      <div className="stack-value">{el.value}</div>
                      <div className="stack-phy text-dim">
                        {el.physicalAddr}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stack-empty italic text-dim">
                  Stack is empty (SP = 0xFFFE). Push registers to see data.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
