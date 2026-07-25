import { describe, it, expect } from "vitest";
import { compile8086 } from "../../src/utils/compiler";
import { Emulator } from "../../src/utils/emulator";

describe("Security and Resilience Tests (STRIDE / OWASP)", () => {
  describe("Injection & Cross-Site Scripting (XSS) Resilience", () => {
    it("safely handles malicious strings without evaluating as code", () => {
      const code = `
        msg db '<script>alert("xss")</script>$'
        mov ax, 1
      `;
      const { variables, errors } = compile8086(code);

      expect(errors).toHaveLength(0);
      expect(variables.has("MSG")).toBe(true);

      const chars = variables
        .get("MSG")!
        .values.map((v) => String.fromCharCode(v))
        .join("");
      expect(chars).toBe('<script>alert("xss")</script>$');
    });

    it("safely handles extremely long string definitions", () => {
      const longStr = "A".repeat(10000);
      const code = `
        msg db '${longStr}'
        mov ax, 1
      `;
      const { errors } = compile8086(code);
      expect(errors).toHaveLength(0); // Should parse correctly without stack overflow
    });
  });

  describe("Denial of Service (DoS) Resilience", () => {
    it("prevents infinite loops in emulator execution", () => {
      const code = `
        infinite:
        jmp infinite
      `;
      const { instructions, errors } = compile8086(code);
      expect(errors).toHaveLength(0);

      const emu = new Emulator(instructions, new Map());
      let steps = 0;
      const MAX_STEPS = 1000;

      while (!emu.state.halted && steps < MAX_STEPS) {
        emu.step();
        steps++;
      }

      // The emulator itself shouldn't crash, it should just execute MAX_STEPS times
      expect(steps).toBe(MAX_STEPS);
      expect(emu.state.halted).toBe(false);
    });

    it("handles deep recursion gracefully by wrapping SP without process crash", () => {
      const code = `
        recurse:
        push ax
        jmp recurse
      `;
      const { instructions, errors } = compile8086(code);
      expect(errors).toHaveLength(0);

      const emu = new Emulator(instructions, new Map());
      let steps = 0;

      // Push ax 40000 times. Stack pointer should wrap around without crashing
      while (!emu.state.halted && steps < 80000) {
        emu.step();
        steps++;
      }

      expect(steps).toBe(80000);
      expect(emu.state.registers.SP).toBeLessThan(0xffff); // It should have wrapped multiple times
    });
  });

  describe("Tampering (Integrity)", () => {
    it("prevents memory writes outside 1MB physical boundary", () => {
      const code = `
        mov bx, 0xFFFF
        mov es, bx
        mov bx, 0xFFFF
        mov al, 1
        mov es:[bx], al
      `;
      const { instructions, errors } = compile8086(code);
      expect(errors).toHaveLength(0);

      const emu = new Emulator(instructions, new Map());

      emu.step(); // mov bx, FFFF
      emu.step(); // mov es, bx
      emu.step(); // mov bx, FFFF
      emu.step(); // mov al, 1
      emu.step(); // mov es:[bx], al

      // Address should be masked with 0xFFFFF in emulator, thus wrapping around
      const expectedAddr = (0xffff * 16 + 0xffff) & 0xfffff;
      expect(emu.state.memory[expectedAddr]).toBe(1);
    });

    it("prevents execution of uninitialized code / prevents crash on invalid opcode", () => {
      const emu = new Emulator([], new Map());
      // Stepping an empty emulator should halt safely
      emu.step();
      expect(emu.state.halted).toBe(true);
    });
  });
});
