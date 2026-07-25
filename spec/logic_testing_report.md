# Logic Testing Report

## Overview

The logic testing framework guarantees execution accuracy, CPU synchronization, and proper internal behavior against the original Intel 8086 datasheet patterns. The test suite utilizes 132 individual unit tests covering isolated logic flow.

## 1. Compiler Instruction Logic

The `compile8086` subsystem transforms string opcodes into byte arrays and execution models.

- Validated correct bit-flag extraction for 8-bit vs 16-bit register tracking.
- Passed correct parsing arrays for arithmetic sequences, string logic, and bit manipulation.
- Forward and backward reference resolution for JMP labels dynamically compiles with perfectly calculated byte offsets across multiple nested `JNZ`/`LOOP` functions.
- Resolved logic gaps whereby invalid labels generated `Undefined symbol` runtime crashes dynamically instead of failing silently.

## 2. Emulator Instruction Logic

The `Emulator` handles standard runtime loop modeling.

- Passes rigorous multi-flag logic testing on generic operations (MOV, ADD, SUB).
- Zero Flag (ZF), Carry Flag (CF), and Sign Flag (SF) dynamically switch perfectly across arithmetic overflows.
- Passed interrupt logic bounds (`INT 21H`). Emulated DOS text prints (AH=09H) handle `$` termination characters exactly as expected inside the console stream without reading past active memory.
- Handles division by zero gracefully by breaking execution logic cleanly rather than crashing the emulator environment.

## 3. Data Synchronization (App Contract)

- Passed React dependency testing, confirming the DOM memory visualizer identically maps to the underlying `Uint8Array` 1MB representation in real-time.
- State is properly lifted up, isolating state mutation cycles into decoupled hooks so UI components (like Register views and Memory cells) logically subscribe only to mutated byte-lengths.
