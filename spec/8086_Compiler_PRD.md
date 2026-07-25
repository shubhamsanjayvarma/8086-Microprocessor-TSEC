# Product Requirements Document (PRD)

> Note: Tech stack is covered in a separate Tech Stack PRD. This document is scoped to product behavior, users, and requirements only.

## 1. Title & Summary

- **Product/Feature Name:** Ultra-Friendly 8086 Web Compiler & Emulator
- **Owner:** 8086 Dev Team
- **Status:** Draft
- **Date:** 2026-07-20
- **One-paragraph overview:** A web-based 8086 assembly compiler and emulator designed to be the most intuitive and user-friendly tool for learning and writing 8086 assembly. It provides real-time compilation, interactive debugging, and visual representations of CPU registers, flags, and memory to make assembly language accessible to students and hobbyists.

## 2. Problem Statement

- **The problem:** 8086 assembly is notoriously difficult to learn due to archaic tooling (like DOSBox/TASM), poor error messages, and a lack of visual feedback during execution.
- **Evidence it's real:** Students learning computer architecture struggle to visualize memory and registers, leading to a steep learning curve and frustration.
- **Who has this problem:** Computer science students, hobbyists, and educators teaching low-level programming.
- **Why now:** Modern web technologies allow for seamless, zero-installation browser-based emulators, removing the barrier of complex local setups.
- **What exists today / alternatives:** DOSBox with TASM/MASM, EMU8086 (Windows only, paid), and existing web emulators like YJDoc2/8086-Emulator-Web or schweigi/assembler-simulator.
- **Why this is different / better:** While tools like YJDoc2 exist, they often lack a polished, modern, and highly intuitive UI. This product will prioritize UX: offering syntax highlighting, inline error explanations, step-by-step visual execution, and a responsive, beautiful interface.

## 3. Goals & Success Metrics

| Goal            | Metric                                                    | Current           | Target       |
| --------------- | --------------------------------------------------------- | ----------------- | ------------ |
| Zero Setup      | Time to first successful execution for a new user         | ~30 mins (DOSBox) | < 1 minute   |
| High Engagement | Average session duration                                  | N/A               | > 10 minutes |
| Error Reduction | Percentage of compilation errors resolved within 1 minute | N/A               | 80%          |

## 4. Target Users

- **Primary user:** Computer Science Student - Needs to write, debug, and understand 8086 assembly assignments without fighting the environment.
- **Secondary user(s):** Educator - Wants a reliable, visual tool to demonstrate CPU behavior live in the classroom.

## 5. Non-Goals / Out of Scope

- Emulating external devices (e.g., floppy drives, coprocessors).
- Supporting 32-bit or 64-bit x86 extensions; strictly limited to 16-bit 8086.
- Full OS emulation (like MS-DOS interrupts, beyond basic IO).

## 6. User Stories / Use Cases

- As a student, I want to type assembly code and see syntax highlighting, so that I can easily read my code and catch typos.
- As a student, I want to step through my code line-by-line and watch register values change, so that I can understand exactly what each instruction does.
- As a user, I want clear, human-readable error messages when my code fails to compile, so that I know how to fix it without Googling cryptic codes.
- Edge case scenario: As a user, if I write an infinite loop, I want a way to stop execution without crashing my browser.

## 7. Features & Functional Requirements

| Feature         | Description                                                                                   | Priority (Must/Should/Could/Won't) |
| --------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| Code Editor     | Monaco/CodeMirror based editor with 8086 syntax highlighting and line numbers.                | Must                               |
| Live Compiler   | Parses assembly into machine code or intermediate representation with instant error feedback. | Must                               |
| Visual Debugger | Play, Pause, Step-Over, and Reset controls for execution.                                     | Must                               |
| CPU State View  | Real-time visual display of AX, BX, CX, DX, IP, SP, BP, SI, DI and Flags.                     | Must                               |
| Memory Viewer   | Hex-dump style view of the 1MB memory space, highlighting recently changed addresses.         | Should                             |
| Code Examples   | Pre-loaded examples (e.g., Hello World, Fibonacci, Sorting) to help users start instantly.    | Should                             |
| Theme Support   | Light/Dark modes for accessibility and preference.                                            | Could                              |

## 8. User Flow

1. User lands on the web app and sees a split-pane interface: Editor on the left, CPU State on the right.
2. User selects a pre-loaded "Hello World" example from a dropdown.
3. User clicks "Compile & Load". If there are errors, they are highlighted inline.
4. User clicks "Step" repeatedly to execute instruction by instruction.
5. User observes the AX register change and the Memory view update.
6. User clicks "Run" to finish execution and views the output in the simulated terminal.

## 9. Edge Cases & Error States

- **Bad input:** Invalid mnemonics or operands. The compiler should highlight the exact line and character with a tooltip explaining the valid syntax.
- **Failure state:** Stack overflow/underflow or division by zero. Execution should halt gracefully with a prominent warning modal.
- **Empty state:** Empty editor should have a placeholder text encouraging the user to write code or load an example.
- **Other:** Infinite loops. A hard execution limit (e.g., 10,000 instructions per run loop) or a web worker implementation to prevent UI freezing.

## 10. Assumptions & Constraints

- **Assumptions:** Users have a modern web browser. The target audience does not need 100% cycle-accurate emulation, just functional accuracy.
- **Constraints:** Needs to run entirely client-side (no backend execution) to ensure low latency and zero server costs.

## 11. Dependencies

- Web-based code editor library (e.g., Monaco Editor or CodeMirror).
- 8086 Compiler/Emulator core (either compiled to WebAssembly via Rust like YJDoc2, or a pure TS/JS implementation).

## 12. Risks & Open Questions

- **Risks:** Emulating 1MB of memory and updating the DOM frequently might cause performance bottlenecks.
- **Open questions:** Do we build the emulator core from scratch in TypeScript for easier maintenance, or use an existing Rust/C emulator via WebAssembly for performance?

## 13. Timeline / Milestones

| Milestone | Deliverable                                                                  | Target Date |
| --------- | ---------------------------------------------------------------------------- | ----------- |
| MVP       | Basic editor, compilation of basic arithmetic/mov instructions, register UI. | Week 2      |
| Beta      | Full instruction set support, memory viewer, stepping debugger.              | Week 4      |
| V1.0      | Polished UI, themes, example library, comprehensive error handling.          | Week 6      |

## 14. Appendix

- **Supporting research:** YJDoc2/8086-Emulator-Web
- **Competitive scan:** EMU8086, DOSBox+TASM
- **Mockups / wireframes:** To be designed.
