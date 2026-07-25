# Test Suites & Pre-Commit Hooks for 8086 Web Compiler & Emulator

## Background

The project is a client-side 8086 web assembler/emulator (React 19 + TypeScript + Vite) with three core modules:

- **Compiler** ([compiler.ts](file:///c:/8086/src/utils/compiler.ts)) — 2-pass assembler with opcode encoding
- **Emulator** ([emulator.ts](file:///c:/8086/src/utils/emulator.ts)) — CPU state machine, 1MB memory, INT 21H simulation
- **Examples** ([examples.ts](file:///c:/8086/src/utils/examples.ts)) — 5 pre-loaded assembly programs

**Current state**: Zero tests, zero test framework, pre-commit hooks limited to formatting checks only.

### Graphify Search Phase

Codebase surveyed via Graphify subagent. Key findings:

- All logic lives in `src/utils/compiler.ts` and `src/utils/emulator.ts`
- No backend — entire app is client-side (no SQL, no auth, no API endpoints)
- Security surface is limited to: XSS via assembly output, ReDoS via input parsing, DoS via infinite loops/memory exhaustion

---

## User Review Required

> [!IMPORTANT]
> **Test Framework Choice**: Plan uses **Vitest** (native Vite integration, same config, fastest option for this stack). If you prefer Jest or another framework, say so before approval.

> [!IMPORTANT]
> **Pre-commit Hook Tool**: Plan uses **Husky + lint-staged** for Git hooks instead of the existing Python-based `pre-commit` in `.pre-commit-config.yaml`. The existing Python hooks will be preserved and both will coexist. If you want to fully replace the Python hooks, let me know.

---

## Proposed Changes

### Component 1: Test Infrastructure Setup

#### [MODIFY] [package.json](file:///c:/8086/package.json)

- Add `vitest`, `@vitest/coverage-v8`, `happy-dom` as devDependencies
- Add `husky`, `lint-staged` as devDependencies
- Add scripts:
  ```yaml
  test: "vitest run"
  test:watch: "vitest"
  test:coverage: "vitest run --coverage"
  test:security: "vitest run --reporter=verbose tests/security/"
  prepare: "husky"
  ```

#### [NEW] [vitest.config.ts](file:///c:/8086/vitest.config.ts)

- Configure Vitest with:
  - `environment: 'happy-dom'` (for DOM-dependent tests)
  - `include: ['tests/**/*.test.ts']`
  - `coverage.thresholds.lines: 100`
  - `testTimeout: 10000` (guardrail against infinite loops in emulator)

---

### Component 2: Compiler Tests

#### [NEW] [tests/compiler/compiler.test.ts](file:///c:/8086/tests/compiler/compiler.test.ts)

**Functional Tests** — verify correct compilation:

- `MOV AX, 0x1234` produces correct opcode bytes
- All data transfer instructions: `MOV`, `PUSH`, `POP`, `XCHG`, `LEA`
- All arithmetic instructions: `ADD`, `SUB`, `MUL`, `DIV`, `INC`, `DEC`, `CMP`
- All logic instructions: `AND`, `OR`, `XOR`, `NOT`, `TEST`, `SHL`, `SHR`
- All control flow: `JMP`, conditional jumps (`JE`, `JNE`, `JG`, `JL`, etc.), `LOOP`
- System: `NOP`, `HLT`, `INT 21H`, `INT 3`
- Directives: `ORG`, `DB` (strings + numeric), `DW`
- Label resolution across forward and backward references
- Addressing modes: register, immediate, memory direct, base+index+displacement, segment override
- Size overrides: `BYTE PTR`, `WORD PTR`

**Edge Case & Failure Tests**:

- Empty source input → no crash, empty output
- Whitespace-only / comment-only input → no errors
- Undefined label reference → specific error with line number
- Duplicate label definition → error
- Invalid mnemonic → error with suggestion
- Operand type mismatch (e.g., `MOV AX, CL`) → type error
- Immediate value overflow (e.g., `MOV AL, 0xFFF`) → range error
- Maximum program size (thousands of instructions) → completes without timeout
- Unicode/emoji in labels → handled gracefully
- Extremely long label names (1000+ chars) → no crash

**Guardrails**:

- Each test has a `10s` timeout to catch infinite parsing loops
- Tests assert on **output state** (compiled bytes, error list), not internal calls

---

### Component 3: Emulator Tests

#### [NEW] [tests/emulator/emulator.test.ts](file:///c:/8086/tests/emulator/emulator.test.ts)

**Functional Tests** — verify correct execution:

- `MOV AX, 5` → AX equals 5
- `ADD AX, BX` → correct sum, correct flag state (CF, ZF, SF, OF, PF, AF)
- Arithmetic overflow sets OF, carry sets CF
- `PUSH`/`POP` correctly modify SP and stack memory
- `JMP` changes IP correctly
- Conditional jumps respect flag state
- `LOOP` decrements CX and jumps when CX ≠ 0
- `INT 21H AH=02h` outputs character to console buffer
- `INT 21H AH=09h` outputs `$`-terminated string
- `INT 21H AH=4Ch` halts execution
- Memory read/write: byte and word, little-endian storage
- 20-bit physical address calculation: `(Segment * 16 + Offset) & 0xFFFFF`
- Segment override in memory operations
- `HLT` stops execution, `NOP` advances IP by 1

**Edge Case & Failure Tests**:

- Division by zero → graceful halt, error state, no crash
- Stack overflow (SP wraps below 0) → handled
- Stack underflow (POP on empty stack) → handled
- Memory access at boundary (0xFFFFF) → no out-of-bounds
- IP advances past loaded program → halts
- Register wrapping: `INC` on 0xFFFF → 0x0000 with flags
- Executing unknown opcode → error state, not crash
- `LOOP` with CX=0 → does not jump (decrements to 0xFFFF first per spec, then jumps — verify correct 8086 behavior)

**Guardrails**:

- **Execution step limit**: Tests enforce a max of 100,000 steps per test to catch infinite loops
- **Memory size assertion**: Verify emulator allocates exactly 1MB (`1024 * 1024` bytes)
- **State isolation**: Each test creates a fresh emulator instance

---

### Component 4: Examples Integration Tests

#### [NEW] [tests/integration/examples.test.ts](file:///c:/8086/tests/integration/examples.test.ts)

Full pipeline tests — compile each example, then execute to completion:

- **16-bit Addition**: Compiles → executes → AX contains correct sum
- **Find Largest in Array**: Compiles → executes → correct register holds max value
- **Factorial**: Compiles → executes → correct result
- **Fibonacci**: Compiles → executes → correct series in memory
- **Reverse a String**: Compiles → executes → reversed string in output

**Edge Cases**:

- All 5 examples compile with zero errors
- All 5 examples execute without hitting the step limit
- All 5 examples halt cleanly (`HLT` or `INT 21H AH=4Ch`)

---

### Component 5: Cyber Attack / Security Tests

#### [NEW] [tests/security/xss.test.ts](file:///c:/8086/tests/security/xss.test.ts)

**STRIDE: Information Disclosure + OWASP: Injection (XSS)**

- Assembly source containing `<script>alert('xss')</script>` in labels/comments → compiler output does NOT contain unescaped HTML
- String literals with HTML entities (`DB '<img onerror=alert(1)>'`) → output treats as raw bytes, not executable HTML
- Error messages containing user input → properly escaped, no raw HTML reflection
- Label names with JavaScript event handlers (`onclick`, `onerror`) → no DOM injection risk

#### [NEW] [tests/security/dos.test.ts](file:///c:/8086/tests/security/dos.test.ts)

**STRIDE: Denial of Service + OWASP: Insecure Design**

- **Compiler bomb**: 100,000-line assembly program → compiles within 30s timeout, does not freeze
- **Infinite loop detection**: `JMP $` (jump to self) → emulator halts within step limit, not browser freeze
- **Memory exhaustion**: Attempting to write beyond 1MB boundary → rejected, no `Uint8Array` reallocation
- **ReDoS**: Crafted input targeting regex patterns in the parser (e.g., deeply nested operand patterns) → completes within timeout
- **Stack bomb**: Continuous `PUSH` without `POP` → SP wraps, no memory corruption beyond 1MB
- **Recursive label resolution**: Labels referencing other labels in long chains → resolver completes

#### [NEW] [tests/security/tampering.test.ts](file:///c:/8086/tests/security/tampering.test.ts)

**STRIDE: Tampering + OWASP: Software & Data Integrity**

- Compiled machine code bytes cannot be externally mutated through the compiler's public API after compilation
- Emulator state (registers, memory) is only modifiable through instruction execution, not raw object mutation from outside
- Memory writes respect segment boundaries — writing to `CS` segment doesn't corrupt `SS` segment unintentionally
- Flag register cannot be set to invalid states through normal instruction flow

#### [NEW] [tests/security/input-validation.test.ts](file:///c:/8086/tests/security/input-validation.test.ts)

**OWASP: Injection (non-XSS)**

- Null bytes (`\x00`) in assembly source → handled without truncation
- Control characters (ASCII 0-31) in source → no parser crash
- Mixed encoding (UTF-8 BOM, UTF-16 surrogates) → graceful handling
- Extremely long single lines (100KB+) → no catastrophic backtracking
- Binary data disguised as assembly → error, no crash
- Command injection patterns in labels (`; rm -rf /`, `$(whoami)`) → treated as literal text

---

### Component 6: Pre-Commit Hooks (Husky + lint-staged)

#### [NEW] [.husky/pre-commit](file:///c:/8086/.husky/pre-commit)

```bash
npx lint-staged
npx tsc --noEmit
npx vitest run --reporter=dot
```

#### [MODIFY] [package.json](file:///c:/8086/package.json)

Add `lint-staged` configuration:

```yaml
lint-staged:
  "*.{ts,tsx}":
    - oxlint --max-warnings=0
  "*.{ts,tsx,json,md,yaml,yml}":
    - prettier --check
```

**Enforcement standards (per Rule #13)**:

- `tsc --noEmit` — blocks commit on ANY type error
- `oxlint --max-warnings=0` — zero tolerance for lint warnings
- `vitest run` — full test suite must pass (unit + integration + security)
- No `--no-verify` bypass allowed (per Rule #11)

#### [MODIFY] [.pre-commit-config.yaml](file:///c:/8086/.pre-commit-config.yaml)

- Preserved as-is for Python-based hooks (trailing whitespace, YAML check, large files, private key detection)

---

## Verification Plan

### Automated Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage (must meet 100% threshold)
npm run test:coverage

# Run only security tests
npm run test:security

# Verify type checking passes
npx tsc --noEmit

# Verify linting passes
npx oxlint --max-warnings=0

# Test pre-commit hook end-to-end
git add -A && git commit --dry-run -m "test hooks"
```

### Manual Verification

- Intentionally break a type → verify `git commit` is blocked by Husky
- Intentionally add a lint warning → verify `git commit` is blocked
- Intentionally fail a test → verify `git commit` is blocked

---

## Graphify Update Phase

After all code changes are complete, run:

```bash
graphify update .
```

to keep the knowledge graph current with the new test files and hook configuration.

---

## File Summary

| File                                      | Action   | Purpose                               |
| ----------------------------------------- | -------- | ------------------------------------- |
| `package.json`                            | MODIFY   | Add test/hook deps and scripts        |
| `vitest.config.ts`                        | NEW      | Test framework configuration          |
| `tests/compiler/compiler.test.ts`         | NEW      | Compiler functional + edge case tests |
| `tests/emulator/emulator.test.ts`         | NEW      | Emulator functional + edge case tests |
| `tests/integration/examples.test.ts`      | NEW      | End-to-end example pipeline tests     |
| `tests/security/xss.test.ts`              | NEW      | XSS injection attack tests            |
| `tests/security/dos.test.ts`              | NEW      | Denial of service attack tests        |
| `tests/security/tampering.test.ts`        | NEW      | Data tampering attack tests           |
| `tests/security/input-validation.test.ts` | NEW      | Input injection/validation tests      |
| `.husky/pre-commit`                       | NEW      | Git pre-commit hook script            |
| `.pre-commit-config.yaml`                 | PRESERVE | Existing Python-based hooks           |
