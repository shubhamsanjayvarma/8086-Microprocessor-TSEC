import { describe, it, expect } from "vitest";
import { examples } from "../../src/utils/examples";
import { compile8086 } from "../../src/utils/compiler";
import { Emulator } from "../../src/utils/emulator";

describe("Examples Integration Tests", () => {
  examples.forEach((example, index) => {
    it(`compiles and runs example ${index + 1}: ${example.name}`, () => {
      // 1. Compile
      const { instructions, variables, errors } = compile8086(example.code);

      // Ensure there are no compilation errors
      expect(errors).toHaveLength(0);
      expect(instructions.length).toBeGreaterThan(0);

      // 2. Load Memory
      const initialMem = new Map<number, number[]>();
      variables.forEach((variable) => {
        initialMem.set(variable.offset, variable.values);
      });

      // 3. Initialize Emulator
      const emu = new Emulator(instructions, initialMem);

      // 4. Run Execution Loop
      let steps = 0;
      const maxSteps = 10000; // prevent infinite loops

      while (!emu.state.halted && steps < maxSteps) {
        emu.step();
        steps++;
      }

      // Ensure program halted normally, not timed out
      expect(emu.state.halted).toBe(true);
      expect(steps).toBeLessThan(maxSteps);

      // Check specific states for each example
      if (example.name === "16-bit Addition") {
        const sumOffset = variables.get("SUM")!.offset;
        const memAddr = emu.getPhysicalAddress("DS", sumOffset);
        const sumVal =
          emu.state.memory[memAddr] | (emu.state.memory[memAddr + 1] << 8);
        expect(sumVal).toBe(0x1234 + 0xabcd);
        expect(emu.state.consoleOutput).toContain(
          "Addition completed successfully!",
        );
      } else if (example.name === "Find Largest in Array") {
        const maxOffset = variables.get("MAX_VAL")!.offset;
        const memAddr = emu.getPhysicalAddress("DS", maxOffset);
        expect(emu.state.memory[memAddr]).toBe(0xaf);
        expect(emu.state.consoleOutput).toContain(
          "Search complete. Max value is stored in max_val.",
        );
      } else if (example.name === "Factorial of a Number") {
        const factOffset = variables.get("FACT_RES")!.offset;
        const memAddr = emu.getPhysicalAddress("DS", factOffset);
        const factVal =
          emu.state.memory[memAddr] | (emu.state.memory[memAddr + 1] << 8);
        expect(factVal).toBe(120); // 5! = 120
      } else if (example.name === "Fibonacci Series") {
        // fib series starts at variables offset
        const fibOffset = variables.get("FIB")!.offset;
        const memAddr = emu.getPhysicalAddress("DS", fibOffset);

        // 0, 1, 1, 2, 3, 5, 8, 13
        const expected = [0, 1, 1, 2, 3, 5, 8, 13];
        for (let i = 0; i < 8; i++) {
          expect(emu.state.memory[memAddr + i]).toBe(expected[i]);
        }
      } else if (example.name === "Reverse a String") {
        const reversedOffset = variables.get("REVERSED")!.offset;
        const memAddr = emu.getPhysicalAddress("DS", reversedOffset);

        const expected = ["O", "L", "L", "E", "H"];
        for (let i = 0; i < 5; i++) {
          expect(String.fromCharCode(emu.state.memory[memAddr + i])).toBe(
            expected[i],
          );
        }
      }
    });
  });
});
