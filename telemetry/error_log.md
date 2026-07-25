# Error Log

## 2026-07-24: Invalid Unicode escape sequence in TypeScript

- **Context**: Writing a Vitest test for the 8086 compiler.
- **Error**: `[PARSE_ERROR] Invalid Unicode escape sequence`.
- **Cause**: I mistakenly escaped the `$` in a template string (`\${var}`) when writing the file content via the `write_to_file` tool. TypeScript/Oxc does not allow `\$` as an escape sequence.
- **Resolution**: Removed the backslashes from `\${var}` to use standard template literal interpolation.

## 2026-07-24: Test Assertions on Clobbered Registers

- **Context**: Writing integration tests for 8086 programs.
- **Error**: Test failed when expecting `AX` to hold a final calculated result.
- **Cause**: The 8086 DOS Interrupt `INT 21H` (with `AH = 09h` for printing strings) overwrote the `AX` register before the program halted, causing assertions to fail.
- **Resolution**: Changed tests to assert against memory addresses where results were stored, rather than volatile general-purpose registers.

## 2026-07-24: Incomplete Emulator Jump Instruction Set

- **Context**: Executing integration tests in the emulator.
- **Error**: The `JBE` instruction fell through, acting as a NOP.
- **Cause**: The emulator's execution switch statement lacked cases for all conditional jumps (e.g., `jbe`, `ja`, `jl`, `jg`, `jle`, `jge`).
- **Resolution**: Implemented the missing jump instructions in `emulator.ts`.

## 2026-07-24: Memory Displacement Parsing

- **Context**: Parsing memory operands with subtraction like `[si-1]`.
- **Error**: Displacement was evaluated as 0 instead of -1.
- **Cause**: The parser's subtraction regex failed to correctly pair index registers with negative offsets because it tried to treat the entire register string ('si') as a number.
- **Resolution**: Refactored `parseMemoryOperand` to normalize `-` into `+-` so it splits smoothly into standard additive terms.

## 2026-07-24: Example Code Bug

- **Context**: Testing the 'Reverse a String' example in the UI.
- **Error**: The reversed string was not printed to the console output.
- **Cause**: The assembly example in `examples.ts` contained instructions to print the 'reversed_msg' prefix, but omitted the instructions to print the actual 'reversed' string memory buffer.
- **Resolution**: Updated `examples.ts` to include `mov dx, offset reversed` and `int 21h`.

## 2026-07-24: Memory Size Inference Bug

- **Context**: Executing `mov ax, [si]`.
- **Error**: High byte of AX was wiped because memory read defaulted to 8-bit.
- **Cause**: The compiler failed to infer `sizeOverride` for memory operands based on the register operand's size.
- **Resolution**: Updated `compiler.ts` to infer memory size from register size if no `ptr` keyword is provided.
