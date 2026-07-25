# QA Testing Plan — 8086 Web Compiler & Emulator

> Comprehensive browser-level QA plan covering all website features, their combinations, and edge cases.
> Organized into milestones per AGENTS.md Rules #4 (Goal-Driven) and #8 (TDD + Security).

---

## Feature Inventory

Before defining milestones, here is the full feature map extracted from the codebase:

```yaml
features:
  editor:
    - Code textarea with line numbers
    - Execution arrow (➤) highlighting current instruction line
    - Placeholder text when empty
    - User can freely edit code at any time
    - Code persists across compile/reset cycles until changed

  example_selector:
    - Dropdown with 5 pre-loaded examples
    - Selecting an example replaces editor content
    - Selecting an example stops any running execution
    - Description text updates below editor header

  compiler:
    - Compile button triggers full two-pass compilation
    - Error display with line numbers and messages
    - Assembler listing panel (offset, machine code, instruction)
    - Supports: ORG, DB, DW, labels, offset keyword
    - Supports: segment overrides (CS:, DS:, SS:, ES:)
    - Supports: BYTE PTR / WORD PTR size overrides
    - Supports: memory operands with base+index+displacement

  execution_controls:
    - Run (continuous execution at configurable speed)
    - Pause (stops continuous execution)
    - Step (single instruction execution)
    - Reset (recompiles and resets all state)
    - Speed slider (1–50 Hz)

  cpu_registers_panel:
    - General Purpose: AX (AH/AL), BX (BH/BL), CX (CH/CL), DX (DH/DL)
    - Index & Pointers: SI, DI, SP, BP, IP
    - Segments: CS, DS, SS, ES
    - Format toggle: HEX / DEC / BIN
    - Signed decimal display for DEC mode

  flags_panel:
    - 8 flags: CF, ZF, SF, OF, PF, AF, DF, IF
    - Active/inactive visual state (color badge)
    - Tooltip descriptions on hover

  memory_viewer:
    - 8×8 grid showing 64 bytes at a time
    - Segment:Offset address inputs (hex)
    - ASCII column showing printable characters
    - Double-click cell to edit memory value
    - Search by symbol name, label, segment:offset, or raw hex

  stack_viewer:
    - Shows top 6 words from SS:SP
    - SP arrow indicator on top element
    - Physical address display
    - Empty state message when stack is unused

  console_output:
    - Displays INT 21H output (AH=02h single char, AH=09h string)
    - Shows system messages (HLT, breakpoint, division by zero)

  status_bar:
    - Status badge: READY / RUNNING / HALTED
    - Pulse dot animation for running state
    - Status text showing last executed instruction
    - Instruction step cycle counter

  instruction_set:
    data_transfer: [MOV, PUSH, POP, XCHG, LEA]
    arithmetic: [ADD, ADC, SUB, SBB, MUL, IMUL, DIV, IDIV, INC, DEC, CMP]
    logic: [AND, OR, XOR, NOT, TEST, SHL, SHR, SAR]
    control_flow:
      [
        JMP,
        JE/JZ,
        JNE/JNZ,
        JC/JB,
        JNC/JNB,
        JBE/JNA,
        JA/JNBE,
        JL/JNGE,
        JLE/JNG,
        JG/JNLE,
        JGE/JNL,
        JS,
        JNS,
        LOOP,
      ]
    interrupts: [INT 21H (AH=02, 09, 4C), INT 3, HLT]
    directives: [ORG, DB, DW]
```

---

## Milestone 1: Code Editor & Example Selector

> **Goal**: Verify the editor loads correctly, examples populate, and basic user interactions work.

### Test Cases

| ID   | Test Case                       | Steps                                                  | Expected Result                                                                                         | Edge Case? |
| ---- | ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------- |
| E-01 | Initial page load               | Open the app                                           | Default example (16-bit Addition) loads in editor, compiles automatically, registers show initial state | No         |
| E-02 | Line numbers render             | Load any example                                       | Line numbers 1..N displayed matching code line count                                                    | No         |
| E-03 | Example dropdown switch         | Select each of the 5 examples sequentially             | Editor content replaces, description updates, execution stops if running                                | No         |
| E-04 | Example switch during Run       | Start Run on Example 1, then switch to Example 3       | Execution stops immediately, editor replaces with Example 3, status resets to READY                     | Yes        |
| E-05 | User edits code freely          | Type custom code in editor                             | Line numbers update dynamically as lines are added/removed                                              | No         |
| E-06 | Empty editor                    | Select all text and delete it                          | Placeholder text "; Write 8086 Assembly here..." visible                                                | Yes        |
| E-07 | Very long code (500+ lines)     | Paste 500 lines of `NOP` instructions                  | Editor renders without freezing, scrollbar appears, line numbers accurate                               | Yes        |
| E-08 | Special characters in editor    | Type `<script>alert(1)</script>` in editor             | Text renders literally, no script execution                                                             | Security   |
| E-09 | Paste from clipboard            | Copy 8086 code from external source, paste into editor | Code renders correctly with proper line breaks                                                          | No         |
| E-10 | Unicode / non-ASCII in comments | Add `; こんにちは` as a comment                        | Compiler ignores it gracefully, no crash                                                                | Yes        |

### Combinatorial Scenarios

```yaml
combinations:
  - action: [edit_code, switch_example, edit_code]
    verify: Second edit persists, not overwritten by stale example
  - action: [switch_example, compile, switch_example_back]
    verify: Original example code restored, not the compiled version of first
  - action: [edit_code, switch_example, undo (Ctrl+Z)]
    verify: Browser undo behavior is predictable (textarea limitation noted)
```

---

## Milestone 2: Compiler — Functional & Error Handling

> **Goal**: Verify every compiler path produces correct output or clear errors.

### Functional Tests

| ID   | Test Case                    | Input                              | Expected Result                                               |
| ---- | ---------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| C-01 | Basic MOV immediate          | `mov ax, 1234h`                    | Parses to instruction with immValue=0x1234                    |
| C-02 | MOV register-to-register     | `mov bx, cx`                       | Both operands parsed as registers                             |
| C-03 | MOV memory-to-register       | `mov al, [si]`                     | Memory operand with indexReg=SI                               |
| C-04 | MOV with displacement        | `mov al, [bx+5]`                   | displacement=5, baseReg=BX                                    |
| C-05 | Negative displacement        | `mov al, [si-2]`                   | displacement=-2, indexReg=SI                                  |
| C-06 | Segment override             | `mov al, es:[bx]`                  | segmentOverride=ES                                            |
| C-07 | BYTE PTR / WORD PTR          | `mov byte ptr [bx], 5`             | sizeOverride=8                                                |
| C-08 | DB string definition         | `msg db 'Hello$'`                  | Variable with byte values [72,101,108,108,111,36]             |
| C-09 | DB numeric array             | `arr db 1, 2, 3`                   | Variable with values [1,2,3]                                  |
| C-10 | DW word definition           | `val dw 1234h`                     | Variable with values [0x34, 0x12] (little-endian)             |
| C-11 | ORG directive                | `org 100h`                         | byteOffset starts at 256                                      |
| C-12 | Label definition + reference | `start: ... jmp start`             | Label resolved, jump target = label offset                    |
| C-13 | OFFSET keyword               | `mov dx, offset msg`               | Operand parsed as label, resolved to variable offset          |
| C-14 | Multiple labels              | 3 labels in code                   | All resolved correctly in pass 2                              |
| C-15 | Forward label reference      | `jmp end` before `end:` is defined | Resolved correctly in pass 2                                  |
| C-16 | Assembler listing output     | Compile any valid program          | Listing shows "Offset Machine Code Instruction" for each line |

### Error Handling Tests

| ID    | Test Case              | Input               | Expected Error                              |
| ----- | ---------------------- | ------------------- | ------------------------------------------- |
| CE-01 | Invalid mnemonic       | `xyz ax, bx`        | Error on that line: unknown instruction     |
| CE-02 | Missing operand        | `mov ax`            | Error: missing source operand               |
| CE-03 | Invalid register name  | `mov rx, 5`         | Parsed as label (may cause runtime issue)   |
| CE-04 | Undefined label jump   | `jmp nowhere`       | Label not found error or NOP fallback       |
| CE-05 | Empty input            | `` (empty string)   | No errors, no instructions, empty listing   |
| CE-06 | Comments only          | `; just a comment`  | No errors, no instructions                  |
| CE-07 | Duplicate labels       | `start: ... start:` | Second overwrites first (document behavior) |
| CE-08 | Very large immediate   | `mov ax, 99999`     | Value truncated to 16-bit                   |
| CE-09 | Hex without 'h' suffix | `mov ax, 0xFF`      | Parsed correctly as 255                     |
| CE-10 | Mixed case mnemonics   | `MOV AX, bx`        | Case-insensitive parsing succeeds           |

### Combinatorial Scenarios

```yaml
combinations:
  - scenario: "Compile → Edit → Recompile"
    verify: Old instructions cleared, new compilation replaces everything
  - scenario: "Compile with errors → Fix code → Recompile"
    verify: Errors disappear, listing appears, status changes to Successful
  - scenario: "Compile → Step halfway → Edit code → Compile again"
    verify: Emulator resets, IP back to start, old CPU state cleared
  - scenario: "Code with data section before code section"
    verify: Data bytes not misinterpreted as instructions
  - scenario: "Code referencing variable defined after use"
    verify: Forward references resolved in pass 2
```

---

## Milestone 3: Emulator Execution — All Instructions

> **Goal**: Verify every supported instruction executes correctly with proper flag updates.

### Data Transfer Instructions

| ID   | Instruction | Test Program                          | Verify                   |
| ---- | ----------- | ------------------------------------- | ------------------------ |
| X-01 | MOV reg,imm | `mov ax, 0x5678`                      | AX = 0x5678              |
| X-02 | MOV reg,reg | `mov ax, 5` then `mov bx, ax`         | BX = 5                   |
| X-03 | MOV reg,mem | `val dw 42` then `mov ax, [val]`      | AX = 42                  |
| X-04 | MOV mem,reg | `mov ax, 99` then `mov [res], ax`     | Memory at res = 99       |
| X-05 | PUSH/POP    | `mov ax, 1234h` `push ax` `pop bx`    | BX = 0x1234, SP restored |
| X-06 | XCHG        | `mov ax, 1` `mov bx, 2` `xchg ax, bx` | AX=2, BX=1               |
| X-07 | LEA         | `lea si, [bx+4]`                      | SI = BX+4 offset value   |

### Arithmetic Instructions

| ID   | Instruction           | Test Program                         | Verify                   |
| ---- | --------------------- | ------------------------------------ | ------------------------ |
| X-10 | ADD                   | `mov ax, 5` `add ax, 3`              | AX=8, flags correct      |
| X-11 | ADD overflow          | `mov ax, 0xFFFF` `add ax, 1`         | AX=0, CF=1, ZF=1         |
| X-12 | ADC (add with carry)  | Set CF, `adc ax, 0`                  | AX incremented by carry  |
| X-13 | SUB                   | `mov ax, 10` `sub ax, 3`             | AX=7                     |
| X-14 | SUB underflow         | `mov ax, 0` `sub ax, 1`              | AX=0xFFFF, CF=1, SF=1    |
| X-15 | SBB (sub with borrow) | Set CF, `sbb ax, 0`                  | AX decremented by borrow |
| X-16 | CMP (no write)        | `mov ax, 5` `cmp ax, 5`              | AX still 5, ZF=1         |
| X-17 | CMP less than         | `mov ax, 3` `cmp ax, 5`              | CF=1, ZF=0               |
| X-18 | INC                   | `mov ax, 0xFF` `inc ax`              | AX=0x100                 |
| X-19 | DEC                   | `mov ax, 0` `dec ax`                 | AX=0xFFFF                |
| X-20 | MUL byte              | `mov al, 6` `mov cl, 7` `mul cl`     | AX=42                    |
| X-21 | MUL word              | `mov ax, 100` `mov cx, 200` `mul cx` | DX:AX=20000              |
| X-22 | DIV byte              | `mov ax, 100` `mov cl, 7` `div cl`   | AL=14, AH=2              |
| X-23 | DIV by zero           | `mov cl, 0` `div cl`                 | Halts with error message |

### Logic Instructions

| ID   | Instruction           | Test Program                              | Verify                    |
| ---- | --------------------- | ----------------------------------------- | ------------------------- |
| X-30 | AND                   | `mov ax, 0xFF0F` `and ax, 0x0FF0`         | AX=0x0F00                 |
| X-31 | OR                    | `mov ax, 0xF0` `or ax, 0x0F`              | AX=0xFF                   |
| X-32 | XOR (self-clear)      | `mov ax, 5` `xor ax, ax`                  | AX=0, ZF=1                |
| X-33 | NOT                   | `mov ax, 0` `not ax`                      | AX=0xFFFF                 |
| X-34 | TEST (no write)       | `mov ax, 0xFF` `test ax, 0x01`            | AX unchanged, ZF=0        |
| X-35 | SHL                   | `mov ax, 1` `mov cl, 4` `shl ax, cl`      | AX=16                     |
| X-36 | SHR                   | `mov ax, 16` `mov cl, 2` `shr ax, cl`     | AX=4                      |
| X-37 | SAR (sign preserving) | `mov ax, 0x8000` `mov cl, 1` `sar ax, cl` | AX=0xC000 (sign extended) |

### Control Flow — All Conditional Jumps

| ID   | Jump    | Condition      | Test: Should Jump             | Test: Should NOT Jump           |
| ---- | ------- | -------------- | ----------------------------- | ------------------------------- |
| J-01 | JMP     | Unconditional  | Always jumps                  | N/A                             |
| J-02 | JE/JZ   | ZF=1           | `cmp ax, ax` then JE          | `cmp ax, bx` (ax≠bx) then JE    |
| J-03 | JNE/JNZ | ZF=0           | `cmp ax, bx` (ax≠bx) then JNE | `cmp ax, ax` then JNE           |
| J-04 | JC/JB   | CF=1           | `cmp 3, 5` then JC            | `cmp 5, 3` then JC              |
| J-05 | JNC/JNB | CF=0           | `cmp 5, 3` then JNC           | `cmp 3, 5` then JNC             |
| J-06 | JBE/JNA | CF=1 or ZF=1   | `cmp 3, 5` then JBE           | `cmp 5, 3` then JBE             |
| J-07 | JA/JNBE | CF=0 and ZF=0  | `cmp 5, 3` then JA            | `cmp 3, 5` then JA              |
| J-08 | JL/JNGE | SF≠OF          | Signed comparison a<b         | Signed comparison a≥b           |
| J-09 | JLE/JNG | ZF=1 or SF≠OF  | Signed a≤b                    | Signed a>b                      |
| J-10 | JG/JNLE | ZF=0 and SF=OF | Signed a>b                    | Signed a≤b                      |
| J-11 | JGE/JNL | SF=OF          | Signed a≥b                    | Signed a<b                      |
| J-12 | JS      | SF=1           | Result is negative            | Result is positive              |
| J-13 | JNS     | SF=0           | Result is positive            | Result is negative              |
| J-14 | LOOP    | CX≠0 after dec | CX=3 initially                | CX=1 (becomes 0, falls through) |

### Interrupt Handling

| ID   | Test Case       | Verify                                                 |
| ---- | --------------- | ------------------------------------------------------ |
| I-01 | INT 21H, AH=02h | Single character from DL appears in console            |
| I-02 | INT 21H, AH=09h | String from DS:DX up to '$' appears in console         |
| I-03 | INT 21H, AH=4Ch | Program halts with "[Program terminated successfully]" |
| I-04 | INT 3           | Breakpoint hit, program halts                          |
| I-05 | HLT             | CPU halts with "[CPU Halted (HLT)]"                    |

---

## Milestone 4: UI Controls & Visual State

> **Goal**: Verify all interactive controls produce correct visual feedback.

### Execution Controls

| ID   | Test Case            | Steps                       | Verify                                                                              |
| ---- | -------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| U-01 | Compile valid code   | Click Compile               | Status: "Compilation Successful", listing populates, first line highlighted         |
| U-02 | Compile invalid code | Write `xyz` and Compile     | Error alert with line number, no listing, status: "Compilation Failed"              |
| U-03 | Step execution       | Click Step repeatedly       | IP advances, registers update, execution arrow moves, status shows last instruction |
| U-04 | Step past HLT        | Step until HLT executes     | Status: "CPU Halted", further Steps show halted message                             |
| U-05 | Run execution        | Click Run                   | Status badge turns RUNNING with pulse animation, registers update continuously      |
| U-06 | Pause mid-run        | Click Pause during Run      | Execution stops, badge returns to READY, state preserved                            |
| U-07 | Speed slider         | Set to 1 Hz, Run            | ~1 step per second visible. Set to 50 Hz → much faster                              |
| U-08 | Reset                | Step halfway, click Reset   | All registers to initial, IP to start, console cleared, status: "Ready"             |
| U-09 | Run → Reset          | Start Run, then click Reset | Execution stops, full reset                                                         |
| U-10 | Compile after edit   | Edit code, then Compile     | Previous emulator state cleared, new instructions loaded                            |

### Register Format Toggle

| ID   | Test Case                       | Steps                | Verify                                              |
| ---- | ------------------------------- | -------------------- | --------------------------------------------------- |
| F-01 | HEX format                      | Click HEX button     | All registers show `0x0000` style values            |
| F-02 | DEC format                      | Click DEC button     | Registers show signed decimal (e.g., -1 for 0xFFFF) |
| F-03 | BIN format                      | Click BIN button     | Registers show 16-digit binary strings              |
| F-04 | Format persists during stepping | Set BIN, then Step   | Values update in binary format                      |
| F-05 | 8-bit sub-register display      | Set DEC, check AH/AL | AH/AL show signed 8-bit values (-128 to 127)        |

### Flags Panel

| ID    | Test Case                     | Steps                                | Verify                                             |
| ----- | ----------------------------- | ------------------------------------ | -------------------------------------------------- |
| FL-01 | Flags initial state           | Fresh compile                        | All flags 0 (inactive badge style)                 |
| FL-02 | ZF activates                  | Execute `xor ax, ax`                 | ZF badge turns active (1)                          |
| FL-03 | CF activates                  | Execute `mov ax, 0xFFFF` `add ax, 1` | CF badge turns active (1)                          |
| FL-04 | SF activates                  | Execute `mov ax, 0` `sub ax, 1`      | SF badge turns active (1)                          |
| FL-05 | OF activates                  | Execute signed overflow scenario     | OF badge turns active                              |
| FL-06 | Multiple flags simultaneously | Execute `mov ax, 0xFFFF` `add ax, 1` | CF=1, ZF=1, PF=1 all active together               |
| FL-07 | Tooltip on hover              | Hover over CF badge                  | Shows "Carry Flag: Set on arithmetic carry/borrow" |

### Memory Viewer

| ID   | Test Case                       | Steps                                 | Verify                                                   |
| ---- | ------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| M-01 | Default view                    | Load page                             | Shows memory at 0700:0000                                |
| M-02 | Navigate by segment:offset      | Type `0700` and `0100`                | Grid shows bytes at physical address 0x7100              |
| M-03 | Search by variable name         | Type `msg` in search box, press Enter | Memory view jumps to offset of `msg` variable            |
| M-04 | Search by label name            | Type `start` in search box            | Memory view jumps to label offset                        |
| M-05 | Search by segment:offset format | Type `0700:0050` in search            | Segment and offset fields update accordingly             |
| M-06 | Search by raw hex offset        | Type `0100` in search                 | Offset field updates to `0100`                           |
| M-07 | ASCII column                    | View memory with string data          | Printable chars shown, non-printable as `.`              |
| M-08 | Double-click to edit            | Double-click a cell                   | Inline input appears, type hex value, press Enter        |
| M-09 | Edit memory - Enter commits     | Edit cell to `FF`, press Enter        | Cell value updates to FF, emulator state reflects change |
| M-10 | Edit memory - Escape cancels    | Edit cell, press Escape               | Original value restored, edit mode exits                 |
| M-11 | Edit memory - blur commits      | Edit cell, click elsewhere            | Value commits on blur                                    |
| M-12 | Invalid hex in edit             | Type `GG` in memory edit              | Value should be NaN → no change                          |
| M-13 | Memory reflects execution       | Execute `mov byte ptr [0], 42h`       | Cell at that address shows `42`                          |

### Stack Viewer

| ID   | Test Case                 | Steps                    | Verify                              |
| ---- | ------------------------- | ------------------------ | ----------------------------------- |
| S-01 | Empty stack               | Fresh compile, SP=0xFFFE | "Stack is empty" message shown      |
| S-02 | Push one word             | Execute `push ax`        | One entry appears, SP arrow on it   |
| S-03 | Push multiple words       | Push 3 words             | 3 entries visible, SP arrow on top  |
| S-04 | Pop restores stack        | Push then Pop            | Stack entry removed, SP moves back  |
| S-05 | Physical address accuracy | Push with SS=0x0700      | Physical address shown = SS*16 + SP |
| S-06 | Stack values in hex       | Push 0x1234              | Value column shows 0x1234           |

### Console Output

| ID    | Test Case                   | Steps                              | Verify                                           |
| ----- | --------------------------- | ---------------------------------- | ------------------------------------------------ |
| CO-01 | No output initially         | Fresh compile                      | "Console output will appear here..." placeholder |
| CO-02 | INT 21H AH=09h output       | Run Example 1 (16-bit Addition)    | "Addition completed successfully!" appears       |
| CO-03 | INT 21H AH=02h output       | Write program printing single char | Character appears in console                     |
| CO-04 | Multiple prints             | Execute multiple INT 21H calls     | All strings concatenated in order                |
| CO-05 | HLT message                 | Execute program ending with HLT    | "[CPU Halted (HLT)]" appended                    |
| CO-06 | Division by zero message    | Divide by 0                        | "[Error: Division by Zero]" appears              |
| CO-07 | Console persists after halt | Program halts                      | Console output remains visible, not cleared      |
| CO-08 | Console clears on Reset     | Click Reset                        | Console output cleared                           |

---

## Milestone 5: Integration — Full Example Programs

> **Goal**: Each built-in example compiles, runs to completion, and produces correct results.

| ID    | Example               | Verify: Compilation | Verify: Execution | Verify: Console                                | Verify: Memory               |
| ----- | --------------------- | ------------------- | ----------------- | ---------------------------------------------- | ---------------------------- |
| EX-01 | 16-bit Addition       | 0 errors            | Halts normally    | "Addition completed successfully!"             | `[sum]` = 0xBE01             |
| EX-02 | Find Largest in Array | 0 errors            | Halts normally    | "Search complete..."                           | `[max_val]` = 0xAF           |
| EX-03 | Factorial of a Number | 0 errors            | Halts normally    | "Factorial calculation completed."             | `[fact_res]` = 120           |
| EX-04 | Fibonacci Series      | 0 errors            | Halts normally    | "Fibonacci series generated..."                | `[fib]` = [0,1,1,2,3,5,8,13] |
| EX-05 | Reverse a String      | 0 errors            | Halts normally    | "Original string: HELLO" + "Reversed string: " | `[reversed]` = "OLLEH"       |

### Cross-Example Combinations

```yaml
combinations:
  - action: [Run Ex1 to completion, Switch to Ex3, Compile, Step through]
    verify: Ex1 state fully cleared, Ex3 fresh state
  - action: [Run Ex2, Pause midway, Switch to Ex5, Run]
    verify: No state leakage from Ex2 into Ex5
  - action: [Step Ex4, check Fibonacci in memory viewer, search 'fib']
    verify: Memory viewer navigates to fib array, values visible
  - action: [Run Ex5, check stack during push_loop via stack viewer]
    verify: Stack entries show pushed characters
```

---

## Milestone 6: Security & Resilience (STRIDE / OWASP)

> **Goal**: Ensure the app cannot be exploited, crashed, or abused.
> Per AGENTS.md Rule #8: refer to `cyber-security-frameworks` skill.

### STRIDE Coverage

| Threat Category            | ID     | Test Case                          | Steps                                   | Verify                                           |
| -------------------------- | ------ | ---------------------------------- | --------------------------------------- | ------------------------------------------------ |
| **Spoofing**               | SEC-01 | No auth required                   | N/A                                     | App is client-side only, no spoofing vector      |
| **Tampering**              | SEC-02 | Memory write boundary              | Write to address > 1MB                  | Address masked with 0xFFFFF, no crash            |
| **Tampering**              | SEC-03 | Edit memory via UI                 | Double-click cell, enter invalid value  | Graceful rejection, no state corruption          |
| **Tampering**              | SEC-04 | Modify SP to invalid value         | `mov sp, 0` then push                   | SP wraps gracefully, no crash                    |
| **Repudiation**            | SEC-05 | N/A (no logging)                   | Client-side only                        | No repudiation vector                            |
| **Info Disclosure**        | SEC-06 | XSS via editor                     | Type `<img onerror=alert(1)>` in editor | Rendered as text, no script execution            |
| **Info Disclosure**        | SEC-07 | XSS via console output             | Print `<script>` via INT 21H            | Rendered in `<pre>` tag as plain text            |
| **Info Disclosure**        | SEC-08 | XSS via memory search              | Type `<script>` in search box           | No script execution                              |
| **Denial of Service**      | SEC-09 | Infinite loop                      | `jmp $`                                 | UI remains responsive (interval-based execution) |
| **Denial of Service**      | SEC-10 | CPU bomb (tight loop at max speed) | `loop:` `jmp loop` at 50 Hz             | Browser tab remains responsive                   |
| **Denial of Service**      | SEC-11 | Memory exhaustion via stack        | Infinite push loop                      | SP wraps around 0xFFFF, no OOM crash             |
| **Denial of Service**      | SEC-12 | Extremely long code input          | 10,000 line program                     | Compiles without freezing or tab crash           |
| **Denial of Service**      | SEC-13 | Rapid compile spam                 | Click Compile 50 times fast             | No race conditions, last compile wins            |
| **Elevation of Privilege** | SEC-14 | N/A                                | Client-side only                        | No privilege escalation vector                   |

### OWASP Top 10 Relevance

| OWASP Category                       | Applicable? | Test                                      |
| ------------------------------------ | ----------- | ----------------------------------------- |
| A03: Injection                       | Yes (XSS)   | SEC-06, SEC-07, SEC-08                    |
| A05: Security Misconfiguration       | Partial     | Verify no source maps in production build |
| A09: Security Logging Failures       | N/A         | Client-side only                          |
| Others (A01, A02, A04, A06-A08, A10) | N/A         | No server-side component                  |

---

## Guardrails & Execution Rules

> Per AGENTS.md Rules #8 and #13.

```yaml
guardrails:
  test_framework: vitest
  browser_testing: chrome-devtools-mcp (take_screenshot, evaluate_script)
  pass_threshold: 100%
  pre_commit: husky + lint-staged + tsc --noEmit + vitest run

  execution_order:
    1: "Milestone 1 — Editor & Examples (unit + browser)"
    2: "Milestone 2 — Compiler (unit tests)"
    3: "Milestone 3 — Emulator Instructions (unit tests)"
    4: "Milestone 4 — UI Controls (browser tests)"
    5: "Milestone 5 — Integration Examples (unit + browser)"
    6: "Milestone 6 — Security (unit + browser)"

  error_handling:
    on_failure: "Log to telemetry/error_log.md, update AGENTS.md with new rule"
    on_flaky: "Investigate root cause, do not skip or mark as expected failure"

  graphify:
    before: "Query graphify for component dependencies before writing tests"
    after: "Run graphify update . after all code changes"
```

---

## Summary Statistics

| Category                           | Test Count                                                                         |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| Milestone 1: Editor & Examples     | 10 tests + 3 combos                                                                |
| Milestone 2: Compiler              | 16 functional + 10 error + 5 combos                                                |
| Milestone 3: Emulator Instructions | 7 data + 14 arithmetic + 8 logic + 14 jumps + 5 interrupts = **48 tests**          |
| Milestone 4: UI Controls           | 10 execution + 5 format + 7 flags + 13 memory + 6 stack + 8 console = **49 tests** |
| Milestone 5: Integration           | 5 examples + 4 combos                                                              |
| Milestone 6: Security              | 14 STRIDE + 3 OWASP = **17 tests**                                                 |
| **Total**                          | **~180 test cases**                                                                |
