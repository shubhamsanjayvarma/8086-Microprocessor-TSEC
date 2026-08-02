import type { ParsedInstruction, Operand } from "./compiler";

export interface CPUState {
  registers: {
    AX: number;
    BX: number;
    CX: number;
    DX: number;
    SI: number;
    DI: number;
    SP: number;
    BP: number;
    IP: number;
    CS: number;
    DS: number;
    SS: number;
    ES: number;
  };
  flags: {
    CF: boolean; // Carry
    ZF: boolean; // Zero
    SF: boolean; // Sign
    OF: boolean; // Overflow
    PF: boolean; // Parity
    AF: boolean; // Auxiliary Carry
    IF: boolean; // Interrupt
    DF: boolean; // Direction
  };
  memory: Uint8Array;
  consoleOutput: string;
  awaitingInput?: boolean;
  inputBufferType?: "01" | "0A";
  halted: boolean;
  cycles: number;
}

export const initialCPUState = (): CPUState => {
  const memory = new Uint8Array(1024 * 1024); // 1MB Memory
  return {
    registers: {
      AX: 0,
      BX: 0,
      CX: 0,
      DX: 0,
      SI: 0,
      DI: 0,
      SP: 0xfffe,
      BP: 0,
      IP: 0x100, // COM starts at CS:100h
      CS: 0x0700,
      DS: 0x0700,
      SS: 0x0700,
      ES: 0x0700, // default segment
    },
    flags: {
      CF: false,
      ZF: false,
      SF: false,
      OF: false,
      PF: false,
      AF: false,
      IF: true,
      DF: false,
    },
    memory,
    consoleOutput: "",
    awaitingInput: false,
    halted: false,
    cycles: 0,
  };
};

export function cloneCPUState(state: CPUState): CPUState {
  return {
    registers: { ...state.registers },
    flags: { ...state.flags },
    memory: state.memory.slice(),
    consoleOutput: state.consoleOutput,
    awaitingInput: state.awaitingInput,
    inputBufferType: state.inputBufferType,
    halted: state.halted,
    cycles: state.cycles,
  };
}

// Parity flag helper: returns true if lowest byte has even number of 1s
function calculateParity(val: number): boolean {
  let count = 0;
  let temp = val & 0xff;
  while (temp > 0) {
    if (temp & 1) count++;
    temp = temp >> 1;
  }
  return count % 2 === 0;
}

export class Emulator {
  state: CPUState;
  instructionMap: Map<number, ParsedInstruction>; // IP -> Instruction
  maxCycles: number = 1000000; // Safety guardrail against runaway infinite loops

  constructor(
    instructions: ParsedInstruction[],
    initialMemoryValues?: Map<number, number[]>,
  ) {
    this.state = initialCPUState();
    this.instructionMap = new Map();

    // Map instructions to their offset in CS
    for (const inst of instructions) {
      this.instructionMap.set(inst.byteOffset, inst);
    }

    // Friendly fallback: If there are instructions, start IP at the first one
    // This allows users to define variables at the top without a JMP START.
    if (instructions.length > 0) {
      this.state.registers.IP = instructions[0].byteOffset;
    }

    // Load initial variable memory values
    if (initialMemoryValues) {
      initialMemoryValues.forEach((bytes, offset) => {
        const physicalAddr = this.state.registers.DS * 16 + offset;
        for (let j = 0; j < bytes.length; j++) {
          if (physicalAddr + j < this.state.memory.length) {
            this.state.memory[physicalAddr + j] = bytes[j];
          }
        }
      });
    }

    // Initialize Stack Pointer: SS:SP
    // Write 0x0000 at SP and SP - 2
    const ssBase = this.state.registers.SS * 16;
    this.state.memory[ssBase + this.state.registers.SP] = 0x00;
    this.state.memory[ssBase + this.state.registers.SP + 1] = 0x00;
  }

  provideInput(input: string) {
    if (!this.state.awaitingInput) return;

    if (this.state.inputBufferType === "01") {
      const char = input.length > 0 ? input[0] : "\r";
      const code = char.charCodeAt(0);
      this.state.registers.AX =
        (this.state.registers.AX & 0xff00) | (code & 0xff);
      this.state.consoleOutput += char;
      this.state.awaitingInput = false;
      this.state.inputBufferType = undefined;
    } else if (this.state.inputBufferType === "0A") {
      const bufferAddr = this.getPhysicalAddress("DS", this.state.registers.DX);
      const maxLen = this.state.memory[bufferAddr];
      const actualMax = maxLen > 0 ? maxLen - 1 : 0; // space for CR

      const toWrite = input.substring(0, actualMax);
      this.state.memory[bufferAddr + 1] = toWrite.length;
      for (let i = 0; i < toWrite.length; i++) {
        this.state.memory[bufferAddr + 2 + i] = toWrite.charCodeAt(i);
      }
      this.state.memory[bufferAddr + 2 + toWrite.length] = 0x0d; // CR

      this.state.consoleOutput += toWrite + "\n";
      this.state.awaitingInput = false;
      this.state.inputBufferType = undefined;
    }
  }

  // Segment:Offset to Physical Address converter
  getPhysicalAddress(
    segmentReg: "CS" | "DS" | "SS" | "ES",
    offset: number,
  ): number {
    const segment = this.state.registers[segmentReg];
    return (segment * 16 + offset) & 0xfffff; // 20-bit address wraps at 1MB
  }

  getRegValue(reg: string): number {
    const regUpper = reg.toUpperCase();
    if (regUpper === "AX") return this.state.registers.AX;
    if (regUpper === "BX") return this.state.registers.BX;
    if (regUpper === "CX") return this.state.registers.CX;
    if (regUpper === "DX") return this.state.registers.DX;
    if (regUpper === "SI") return this.state.registers.SI;
    if (regUpper === "DI") return this.state.registers.DI;
    if (regUpper === "SP") return this.state.registers.SP;
    if (regUpper === "BP") return this.state.registers.BP;
    if (regUpper === "IP") return this.state.registers.IP;
    if (regUpper === "CS") return this.state.registers.CS;
    if (regUpper === "DS") return this.state.registers.DS;
    if (regUpper === "SS") return this.state.registers.SS;
    if (regUpper === "ES") return this.state.registers.ES;

    // 8-bit registers
    if (regUpper === "AH") return (this.state.registers.AX >> 8) & 0xff;
    if (regUpper === "AL") return this.state.registers.AX & 0xff;
    if (regUpper === "BH") return (this.state.registers.BX >> 8) & 0xff;
    if (regUpper === "BL") return this.state.registers.BX & 0xff;
    if (regUpper === "CH") return (this.state.registers.CX >> 8) & 0xff;
    if (regUpper === "CL") return this.state.registers.CX & 0xff;
    if (regUpper === "DH") return (this.state.registers.DX >> 8) & 0xff;
    if (regUpper === "DL") return this.state.registers.DX & 0xff;

    throw new Error(`Unknown register: ${reg}`);
  }

  setRegValue(reg: string, value: number) {
    const regUpper = reg.toUpperCase();
    value = value & 0xffff; // Clamp to 16 bits

    if (regUpper === "AX") this.state.registers.AX = value;
    else if (regUpper === "BX") this.state.registers.BX = value;
    else if (regUpper === "CX") this.state.registers.CX = value;
    else if (regUpper === "DX") this.state.registers.DX = value;
    else if (regUpper === "SI") this.state.registers.SI = value;
    else if (regUpper === "DI") this.state.registers.DI = value;
    else if (regUpper === "SP") this.state.registers.SP = value;
    else if (regUpper === "BP") this.state.registers.BP = value;
    else if (regUpper === "IP") this.state.registers.IP = value;
    else if (regUpper === "CS") this.state.registers.CS = value;
    else if (regUpper === "DS") this.state.registers.DS = value;
    else if (regUpper === "SS") this.state.registers.SS = value;
    else if (regUpper === "ES") this.state.registers.ES = value;

    // 8-bit halves
    else if (regUpper === "AH") {
      this.state.registers.AX =
        (this.state.registers.AX & 0x00ff) | ((value & 0xff) << 8);
    } else if (regUpper === "AL") {
      this.state.registers.AX =
        (this.state.registers.AX & 0xff00) | (value & 0xff);
    } else if (regUpper === "BH") {
      this.state.registers.BX =
        (this.state.registers.BX & 0x00ff) | ((value & 0xff) << 8);
    } else if (regUpper === "BL") {
      this.state.registers.BX =
        (this.state.registers.BX & 0xff00) | (value & 0xff);
    } else if (regUpper === "CH") {
      this.state.registers.CX =
        (this.state.registers.CX & 0x00ff) | ((value & 0xff) << 8);
    } else if (regUpper === "CL") {
      this.state.registers.CX =
        (this.state.registers.CX & 0xff00) | (value & 0xff);
    } else if (regUpper === "DH") {
      this.state.registers.DX =
        (this.state.registers.DX & 0x00ff) | ((value & 0xff) << 8);
    } else if (regUpper === "DL") {
      this.state.registers.DX =
        (this.state.registers.DX & 0xff00) | (value & 0xff);
    } else {
      throw new Error(`Unknown register: ${reg}`);
    }
  }

  // Resolve memory operand's effective physical address
  resolveMemoryAddress(operand: Operand): number {
    if (!operand.memAddress) throw new Error("Invalid memory operand");
    const { baseReg, indexReg, displacement, segmentOverride } =
      operand.memAddress;

    let offset = displacement;
    if (baseReg) offset += this.getRegValue(baseReg);
    if (indexReg) offset += this.getRegValue(indexReg);

    // Default segment is DS, unless base register is BP, then it defaults to SS
    let segment: "CS" | "DS" | "SS" | "ES" = segmentOverride || "DS";
    if (!segmentOverride && baseReg === "BP") {
      segment = "SS";
    }

    return this.getPhysicalAddress(segment, offset);
  }

  getOperandValue(operand: Operand): number {
    if (operand.type === "immediate") {
      return operand.immValue || 0;
    }
    if (operand.type === "register") {
      return this.getRegValue(operand.value);
    }
    if (operand.type === "memory") {
      const address = this.resolveMemoryAddress(operand);
      const size = operand.memAddress?.sizeOverride || 8; // default to 8-bit if unspecified
      if (size === 16) {
        // Little Endian read
        const low = this.state.memory[address];
        const high = this.state.memory[(address + 1) & 0xfffff];
        return (high << 8) | low;
      } else {
        return this.state.memory[address];
      }
    }
    return 0;
  }

  setOperandValue(operand: Operand, value: number) {
    if (operand.type === "register") {
      this.setRegValue(operand.value, value);
    } else if (operand.type === "memory") {
      const address = this.resolveMemoryAddress(operand);
      const size = operand.memAddress?.sizeOverride || 8;
      if (size === 16) {
        // Little Endian write
        this.state.memory[address] = value & 0xff;
        this.state.memory[(address + 1) & 0xfffff] = (value >> 8) & 0xff;
      } else {
        this.state.memory[address] = value & 0xff;
      }
    } else {
      throw new Error("Cannot write to immediate value");
    }
  }

  // Push value onto stack
  pushStack(val: number) {
    // SP decrements by 2
    this.state.registers.SP = (this.state.registers.SP - 2) & 0xffff;
    const address = this.getPhysicalAddress("SS", this.state.registers.SP);
    this.state.memory[address] = val & 0xff;
    this.state.memory[(address + 1) & 0xfffff] = (val >> 8) & 0xff;
  }

  // Pop value from stack
  popStack(): number {
    const address = this.getPhysicalAddress("SS", this.state.registers.SP);
    const low = this.state.memory[address];
    const high = this.state.memory[(address + 1) & 0xfffff];
    const val = (high << 8) | low;
    // SP increments by 2
    this.state.registers.SP = (this.state.registers.SP + 2) & 0xffff;
    return val;
  }

  // Update Zero, Sign, Parity flags based on result and operand size
  updateSZPFlags(result: number, size: 8 | 16) {
    const mask = size === 16 ? 0xffff : 0xff;
    const signBit = size === 16 ? 0x8000 : 0x80;
    const val = result & mask;

    this.state.flags.ZF = val === 0;
    this.state.flags.SF = (val & signBit) !== 0;
    this.state.flags.PF = calculateParity(val);
  }

  // Step execute one instruction
  step(): ParsedInstruction | null {
    if (this.state.halted || this.state.awaitingInput) return null;

    if (this.state.cycles >= this.maxCycles) {
      this.state.halted = true;
      this.state.consoleOutput +=
        "\n[CPU Execution Terminated: Exceeded Max Cycle Limit]";
      return null;
    }

    const ip = this.state.registers.IP;
    const inst = this.instructionMap.get(ip);

    if (!inst) {
      // Halted if no instruction exists at current IP
      this.state.halted = true;
      return null;
    }

    const opLower = inst.op.toLowerCase();
    let nextIP = ip + inst.byteLength;
    this.state.cycles++;

    switch (opLower) {
      case "mov": {
        if (inst.dest && inst.src) {
          const val = this.getOperandValue(inst.src);
          // If destination is memory, override size to match source register if possible
          if (
            inst.dest.type === "memory" &&
            !inst.dest.memAddress?.sizeOverride &&
            inst.src.type === "register"
          ) {
            inst.dest.memAddress!.sizeOverride = inst.src.regSize;
          }
          this.setOperandValue(inst.dest, val);
        }
        break;
      }
      case "push": {
        if (inst.dest) {
          const val = this.getOperandValue(inst.dest);
          this.pushStack(val);
        }
        break;
      }
      case "pop": {
        if (inst.dest) {
          const val = this.popStack();
          this.setOperandValue(inst.dest, val);
        }
        break;
      }
      case "xchg": {
        if (inst.dest && inst.src) {
          const val1 = this.getOperandValue(inst.dest);
          const val2 = this.getOperandValue(inst.src);
          this.setOperandValue(inst.dest, val2);
          this.setOperandValue(inst.src, val1);
        }
        break;
      }
      case "lea": {
        if (inst.dest && inst.src) {
          if (inst.src.type === "memory") {
            // LEA gets the offset address, not the memory value
            const address = this.resolveMemoryAddress(inst.src);
            // Effective address is segment:offset. 8086 LEA loads offset relative to segment.
            // In our emulator DS=SS=CS=0x0700, so we retrieve the offset relative to DS/SS.
            const segBase =
              (inst.src.memAddress?.segmentOverride
                ? this.state.registers[inst.src.memAddress.segmentOverride]
                : this.state.registers.DS) * 16;
            const offset = (address - segBase) & 0xffff;
            this.setRegValue(inst.dest.value, offset);
          } else if (inst.src.type === "immediate") {
            // e.g. LEA DX, msg where msg is resolved as an immediate offset
            this.setRegValue(inst.dest.value, inst.src.immValue || 0);
          }
        }
        break;
      }
      case "add":
      case "adc": {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          const carry = opLower === "adc" && this.state.flags.CF ? 1 : 0;
          const result = v1 + v2 + carry;
          const mask = size === 16 ? 0xffff : 0xff;
          const signBit = size === 16 ? 0x8000 : 0x80;

          // Carry Flag
          this.state.flags.CF = result > mask;
          // Overflow Flag (adding same sign yielding different sign)
          const sign1 = v1 & signBit;
          const sign2 = v2 & signBit;
          const signR = result & signBit;
          this.state.flags.OF = sign1 === sign2 && sign1 !== signR;

          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result & mask);
        }
        break;
      }
      case "sub":
      case "sbb":
      case "cmp": {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          const borrow = opLower === "sbb" && this.state.flags.CF ? 1 : 0;
          const result = v1 - v2 - borrow;
          const mask = size === 16 ? 0xffff : 0xff;
          const signBit = size === 16 ? 0x8000 : 0x80;

          // Carry / Borrow Flag
          this.state.flags.CF = v1 < v2 + borrow;
          // Overflow Flag
          const sign1 = v1 & signBit;
          const sign2 = v2 & signBit;
          const signR = result & signBit;
          this.state.flags.OF = sign1 !== sign2 && sign1 !== signR;

          this.updateSZPFlags(result, size);
          if (opLower !== "cmp") {
            this.setOperandValue(inst.dest, result & mask);
          }
        }
        break;
      }
      case "inc":
      case "dec": {
        if (inst.dest) {
          const v = this.getOperandValue(inst.dest);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          const diff = opLower === "inc" ? 1 : -1;
          const result = v + diff;
          const mask = size === 16 ? 0xffff : 0xff;
          const signBit = size === 16 ? 0x8000 : 0x80;

          // Overflow Flag (doesn't affect CF)
          if (opLower === "inc") {
            this.state.flags.OF = v === signBit - 1;
          } else {
            this.state.flags.OF = v === signBit;
          }

          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result & mask);
        }
        break;
      }
      case "mul":
      case "imul": {
        if (inst.dest) {
          const v2 = this.getOperandValue(inst.dest);
          const isWord =
            inst.dest.type === "register"
              ? inst.dest.regSize === 16
              : inst.dest.memAddress?.sizeOverride === 16;

          if (isWord) {
            const v1 = this.state.registers.AX;
            const result = v1 * v2;
            this.state.registers.AX = result & 0xffff;
            this.state.registers.DX = (result >> 16) & 0xffff;
            this.state.flags.CF = this.state.flags.OF =
              this.state.registers.DX !== 0;
          } else {
            const v1 = this.state.registers.AX & 0xff; // AL
            const result = v1 * v2;
            this.state.registers.AX =
              (this.state.registers.AX & 0xff00) | (result & 0xff);
            // AH stores high byte
            this.state.registers.AX =
              (this.state.registers.AX & 0x00ff) |
              (((result >> 8) & 0xff) << 8);
            this.state.flags.CF = this.state.flags.OF =
              ((result >> 8) & 0xff) !== 0;
          }
        }
        break;
      }
      case "cld": {
        this.state.flags.DF = false;
        break;
      }
      case "std": {
        this.state.flags.DF = true;
        break;
      }
      case "movsb":
      case "movsw":
      case "lodsb":
      case "lodsw":
      case "stosb":
      case "stosw":
      case "cmpsb":
      case "cmpsw":
      case "scasb":
      case "scasw": {
        const isWord = opLower.endsWith("w");
        const incStep = isWord ? 2 : 1;
        const opBase = opLower.substring(0, 4);

        const doStringOp = () => {
          const srcAddr = this.getPhysicalAddress(
            "DS",
            this.state.registers.SI,
          );
          const destAddr = this.getPhysicalAddress(
            "ES",
            this.state.registers.DI,
          );

          switch (opBase) {
            case "movs": {
              if (isWord) {
                this.state.memory[destAddr] = this.state.memory[srcAddr];
                this.state.memory[destAddr + 1] =
                  this.state.memory[srcAddr + 1];
              } else {
                this.state.memory[destAddr] = this.state.memory[srcAddr];
              }
              break;
            }
            case "lods": {
              if (isWord) {
                const val =
                  this.state.memory[srcAddr] |
                  (this.state.memory[srcAddr + 1] << 8);
                this.setRegValue("AX", val);
              } else {
                this.setRegValue("AL", this.state.memory[srcAddr]);
              }
              break;
            }
            case "stos": {
              if (isWord) {
                const ax = this.getRegValue("AX");
                this.state.memory[destAddr] = ax & 0xff;
                this.state.memory[destAddr + 1] = (ax >> 8) & 0xff;
              } else {
                this.state.memory[destAddr] = this.getRegValue("AL");
              }
              break;
            }
            case "cmps": {
              let srcVal, destVal;
              if (isWord) {
                srcVal =
                  this.state.memory[srcAddr] |
                  (this.state.memory[srcAddr + 1] << 8);
                destVal =
                  this.state.memory[destAddr] |
                  (this.state.memory[destAddr + 1] << 8);
              } else {
                srcVal = this.state.memory[srcAddr];
                destVal = this.state.memory[destAddr];
              }
              const res = srcVal - destVal;
              this.updateSZPFlags(res, isWord ? 16 : 8);
              break;
            }
            case "scas": {
              let accVal, destVal;
              if (isWord) {
                accVal = this.getRegValue("AX");
                destVal =
                  this.state.memory[destAddr] |
                  (this.state.memory[destAddr + 1] << 8);
              } else {
                accVal = this.getRegValue("AL");
                destVal = this.state.memory[destAddr];
              }
              const res = accVal - destVal;
              this.updateSZPFlags(res, isWord ? 16 : 8);
              break;
            }
          }

          // Update pointers based on DF
          const dir = this.state.flags.DF ? -incStep : incStep;
          if (["movs", "lods", "cmps"].includes(opBase)) {
            this.setRegValue("SI", (this.state.registers.SI + dir) & 0xffff);
          }
          if (["movs", "stos", "cmps", "scas"].includes(opBase)) {
            this.setRegValue("DI", (this.state.registers.DI + dir) & 0xffff);
          }
        };

        if (!inst.prefix) {
          doStringOp();
        } else {
          const prefix = inst.prefix.toUpperCase();
          while (this.state.registers.CX > 0) {
            doStringOp();
            this.setRegValue("CX", (this.state.registers.CX - 1) & 0xffff);
            this.state.cycles++;

            if (this.state.cycles >= this.maxCycles) {
              this.state.halted = true;
              this.state.consoleOutput +=
                "\n[CPU Execution Terminated: Exceeded Max Cycle Limit inside REP]";
              break;
            }

            if (["REPE", "REPZ"].includes(prefix) && !this.state.flags.ZF) {
              break;
            }
            if (["REPNE", "REPNZ"].includes(prefix) && this.state.flags.ZF) {
              break;
            }
          }
        }
        break;
      }
      case "div":
      case "idiv": {
        if (inst.dest) {
          const divisor = this.getOperandValue(inst.dest);
          if (divisor === 0) {
            this.state.consoleOutput += "\n[Error: Division by Zero]";
            this.state.halted = true;
            break;
          }
          const isWord =
            inst.dest.type === "register"
              ? inst.dest.regSize === 16
              : inst.dest.memAddress?.sizeOverride === 16;

          if (isWord) {
            const dividend =
              (this.state.registers.DX << 16) | this.state.registers.AX;
            const quotient = Math.floor(dividend / divisor);
            const remainder = dividend % divisor;
            this.state.registers.AX = quotient & 0xffff;
            this.state.registers.DX = remainder & 0xffff;
          } else {
            const dividend = this.state.registers.AX;
            const quotient = Math.floor(dividend / divisor);
            const remainder = dividend % divisor;
            this.state.registers.AX = (remainder << 8) | (quotient & 0xff); // AH: remainder, AL: quotient
          }
        }
        break;
      }
      case "and":
      case "or":
      case "xor": {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          let result = 0;

          if (opLower === "and") result = v1 & v2;
          else if (opLower === "or") result = v1 | v2;
          else if (opLower === "xor") result = v1 ^ v2;

          this.state.flags.CF = false;
          this.state.flags.OF = false;
          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result);
        }
        break;
      }
      case "not": {
        if (inst.dest) {
          const v = this.getOperandValue(inst.dest);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          const mask = size === 16 ? 0xffff : 0xff;
          this.setOperandValue(inst.dest, ~v & mask);
        }
        break;
      }
      case "test": {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          const result = v1 & v2;

          this.state.flags.CF = false;
          this.state.flags.OF = false;
          this.updateSZPFlags(result, size);
        }
        break;
      }
      case "shl":
      case "shr":
      case "sar": {
        if (inst.dest && inst.src) {
          const v = this.getOperandValue(inst.dest);
          const count = this.getOperandValue(inst.src);
          const size =
            inst.dest.type === "register"
              ? inst.dest.regSize!
              : inst.dest.memAddress?.sizeOverride || 8;
          const mask = size === 16 ? 0xffff : 0xff;
          const signBit = size === 16 ? 0x8000 : 0x80;
          let result = v;

          for (let c = 0; c < count; c++) {
            if (opLower === "shl") {
              this.state.flags.CF = (result & signBit) !== 0;
              result = (result << 1) & mask;
            } else if (opLower === "shr") {
              this.state.flags.CF = (result & 1) !== 0;
              result = result >> 1;
            } else if (opLower === "sar") {
              this.state.flags.CF = (result & 1) !== 0;
              const sign = result & signBit;
              result = (result >> 1) | sign;
            }
          }

          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result);
        }
        break;
      }
      case "jmp": {
        if (inst.dest && inst.dest.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "je":
      case "jz": {
        if (this.state.flags.ZF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jne":
      case "jnz": {
        if (!this.state.flags.ZF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jc":
      case "jb": {
        if (this.state.flags.CF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jnc":
      case "jnb": {
        if (!this.state.flags.CF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jbe":
      case "jna": {
        if (
          (this.state.flags.CF || this.state.flags.ZF) &&
          inst.dest?.immValue !== undefined
        ) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "ja":
      case "jnbe": {
        if (
          !this.state.flags.CF &&
          !this.state.flags.ZF &&
          inst.dest?.immValue !== undefined
        ) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jl":
      case "jnge": {
        if (
          this.state.flags.SF !== this.state.flags.OF &&
          inst.dest?.immValue !== undefined
        ) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jle":
      case "jng": {
        if (
          (this.state.flags.ZF ||
            this.state.flags.SF !== this.state.flags.OF) &&
          inst.dest?.immValue !== undefined
        ) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jg":
      case "jnle": {
        if (
          !this.state.flags.ZF &&
          this.state.flags.SF === this.state.flags.OF &&
          inst.dest?.immValue !== undefined
        ) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jge":
      case "jnl": {
        if (
          this.state.flags.SF === this.state.flags.OF &&
          inst.dest?.immValue !== undefined
        ) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "js": {
        if (this.state.flags.SF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "jns": {
        if (!this.state.flags.SF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "loop": {
        const cx = (this.state.registers.CX - 1) & 0xffff;
        this.state.registers.CX = cx;
        if (cx !== 0 && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case "int": {
        const intNum = inst.dest?.immValue;
        if (intNum === 0x21) {
          const ah = (this.state.registers.AX >> 8) & 0xff;
          if (ah === 0x01) {
            this.state.awaitingInput = true;
            this.state.inputBufferType = "01";
            this.state.registers.IP = nextIP;
            return inst;
          } else if (ah === 0x0a) {
            this.state.awaitingInput = true;
            this.state.inputBufferType = "0A";
            this.state.registers.IP = nextIP;
            return inst;
          } else if (ah === 0x02) {
            // Write character in DL to console
            const charCode = this.state.registers.DX & 0xff;
            this.state.consoleOutput += String.fromCharCode(charCode);
          } else if (ah === 0x09) {
            // Write string at DS:DX (terminated by '$')
            const dx = this.state.registers.DX;
            let addr = this.getPhysicalAddress("DS", dx);
            let str = "";
            while (addr < this.state.memory.length) {
              const char = this.state.memory[addr];
              if (char === 36) break; // '$' sign
              str += String.fromCharCode(char);
              addr++;
            }
            this.state.consoleOutput += str;
          } else if (ah === 0x4c) {
            // Exit program
            this.state.halted = true;
            this.state.consoleOutput += "\n[Program terminated successfully]";
          }
        } else if (intNum === 3) {
          // Breakpoint: pause execution
          this.state.halted = true;
          this.state.consoleOutput += "\n[Breakpoint hit (INT 3)]";
        }
        break;
      }
      case "hlt": {
        this.state.halted = true;
        this.state.consoleOutput += "\n[CPU Halted (HLT)]";
        break;
      }
      case "nop":
        break;
      default:
        throw new Error(`Unhandled instruction opcode: ${inst.op}`);
    }

    this.state.registers.IP = nextIP & 0xffff;
    return inst;
  }
}
