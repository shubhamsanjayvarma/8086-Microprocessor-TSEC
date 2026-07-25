# Codebase Security Review Report

## Overview

The security review strictly aligned with the OWASP Top 10 and STRIDE Cyber Attack threat modeling frameworks to prevent denial of service, memory spoofing, application freezing, and code injections.

## Cyber Attack Mitigation Results

### 1. Regex Denial of Service (ReDoS) [STRIDE: Denial of Service]

- **Threat Vector:** Complex string manipulation regex trees within `compile8086` operands.
- **Testing:** Supplied deeply nested brackets `[BX+SI+0x10+0x10...x1000]` mapping extremely long character sizes.
- **Resolution:** Threat naturally mitigated. The `parseMemoryOperand` function utilizes literal string splits (`.split('+')`) iteratively processing components $O(T)$ where $T$ is the term length, entirely bypassing regex nesting engine loops.

### 2. Instruction Opcodes & Fallthrough [STRIDE: Tampering]

- **Threat Vector:** Passing malicious or corrupted instructions into the memory byte stream bypassing the frontend string verifications.
- **Testing:** Supplied a poisoned AST (Abstract Syntax Tree) opcode (`EVIL_HACK`) directly into the `Emulator.step()` loop.
- **Resolution:** Discovered an invisible security leak where unhandled opcodes fell through `default: break;`, silently executing as `NOP`s (No-operation). The `Emulator.ts` was aggressively patched to strictly block unknown signatures via explicit `throw new Error()` handling.

### 3. Memory Out of Bounds Spoofing [STRIDE: Information Disclosure]

- **Threat Vector:** Arbitrary pointer arithmetic pointing towards system memory sizes greater than 1MB (0xFFFFF).
- **Testing:** Configured malicious segment addressing logic forcing the memory array handler above expected physical indices.
- **Resolution:** The `Emulator` natively utilizes `Uint8Array` clamping, effectively causing `undefined` indexing bounds that the emulator specifically halts on, preventing out-of-bounds cross-array leakage in Javascript.

### 4. Cross-Site Scripting (XSS) [OWASP: Injection]

- **Threat Vector:** Forcing `INT 21H` prints containing active Javascript components attempting to inject into the React DOM.
- **Testing:** Initialized `.data` registers with strings like `MSG DB '<script>alert("XSS")</script>$'`.
- **Resolution:** Safe interpolation validated. React intrinsically escapes Virtual DOM parameters preventing raw HTML hydration inside the emulator's console viewer. Script tags sit silently as inactive visual text arrays.

### 5. Log Injection & Context Masking [OWASP: Log Injection / STRIDE: Information Disclosure]

- **Threat Vector:** Attackers passing malicious newline payloads into inputs trying to spoof fake log entries (`\n[FATAL] Admin logged in`), or backend contexts accidentally leaking plain-text passwords.
- **Testing:** Supplied multiline poisoned strings and objects containing keys like `apiKey` and `password`.
- **Resolution:** The `Logger` string sanitizer regex replaces any `\n` characters, keeping log context physically restricted to single JSON entries per instance. A recursive mask check forces all sensitive strings to `[REDACTED]` prior to the stringify cycle.
