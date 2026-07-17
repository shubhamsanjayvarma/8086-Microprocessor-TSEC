import type { ParsedInstruction, Operand } from './compiler';

export interface CPUState {
  registers: {
    AX: number; BX: number; CX: number; DX: number;
    SI: number; DI: number; SP: number; BP: number; IP: number;
    CS: number; DS: number; SS: number; ES: number;
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
  halted: boolean;
  cycles: number;
}

export const initialCPUState = (): CPUState => {
  const memory = new Uint8Array(1024 * 1024); // 1MB Memory
  return {
    registers: {
      AX: 0, BX: 0, CX: 0, DX: 0,
      SI: 0, DI: 0, SP: 0xFFFE, BP: 0, IP: 0x100, // COM starts at CS:100h
      CS: 0x0700, DS: 0x0700, SS: 0x0700, ES: 0x0700 // default segment
    },
    flags: {
      CF: false, ZF: false, SF: false, OF: false,
      PF: false, AF: false, IF: true, DF: false
    },
    memory,
    consoleOutput: '',
    halted: false,
    cycles: 0
  };
};

// Parity flag helper: returns true if lowest byte has even number of 1s
function calculateParity(val: number): boolean {
  let count = 0;
  let temp = val & 0xFF;
  while (temp > 0) {
    if (temp & 1) count++;
    temp = temp >> 1;
  }
  return count % 2 === 0;
}

export class Emulator {
  state: CPUState;
  instructionMap: Map<number, ParsedInstruction>; // IP -> Instruction

  constructor(instructions: ParsedInstruction[], initialMemoryValues?: Map<number, number[]>) {
    this.state = initialCPUState();
    this.instructionMap = new Map();

    // Map instructions to their offset in CS
    for (const inst of instructions) {
      this.instructionMap.set(inst.byteOffset, inst);
    }

    // Load initial variable memory values
    if (initialMemoryValues) {
      initialMemoryValues.forEach((bytes, offset) => {
        const physicalAddr = (this.state.registers.DS * 16) + offset;
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

  // Segment:Offset to Physical Address converter
  getPhysicalAddress(segmentReg: 'CS' | 'DS' | 'SS' | 'ES', offset: number): number {
    const segment = this.state.registers[segmentReg];
    return (segment * 16 + offset) & 0xFFFFF; // 20-bit address wraps at 1MB
  }

  getRegValue(reg: string): number {
    const regUpper = reg.toUpperCase();
    if (regUpper === 'AX') return this.state.registers.AX;
    if (regUpper === 'BX') return this.state.registers.BX;
    if (regUpper === 'CX') return this.state.registers.CX;
    if (regUpper === 'DX') return this.state.registers.DX;
    if (regUpper === 'SI') return this.state.registers.SI;
    if (regUpper === 'DI') return this.state.registers.DI;
    if (regUpper === 'SP') return this.state.registers.SP;
    if (regUpper === 'BP') return this.state.registers.BP;
    if (regUpper === 'IP') return this.state.registers.IP;
    if (regUpper === 'CS') return this.state.registers.CS;
    if (regUpper === 'DS') return this.state.registers.DS;
    if (regUpper === 'SS') return this.state.registers.SS;
    if (regUpper === 'ES') return this.state.registers.ES;

    // 8-bit registers
    if (regUpper === 'AH') return (this.state.registers.AX >> 8) & 0xFF;
    if (regUpper === 'AL') return this.state.registers.AX & 0xFF;
    if (regUpper === 'BH') return (this.state.registers.BX >> 8) & 0xFF;
    if (regUpper === 'BL') return this.state.registers.BX & 0xFF;
    if (regUpper === 'CH') return (this.state.registers.CX >> 8) & 0xFF;
    if (regUpper === 'CL') return this.state.registers.CX & 0xFF;
    if (regUpper === 'DH') return (this.state.registers.DX >> 8) & 0xFF;
    if (regUpper === 'DL') return this.state.registers.DX & 0xFF;

    throw new Error(`Unknown register: ${reg}`);
  }

  setRegValue(reg: string, value: number) {
    const regUpper = reg.toUpperCase();
    value = value & 0xFFFF; // Clamp to 16 bits

    if (regUpper === 'AX') this.state.registers.AX = value;
    else if (regUpper === 'BX') this.state.registers.BX = value;
    else if (regUpper === 'CX') this.state.registers.CX = value;
    else if (regUpper === 'DX') this.state.registers.DX = value;
    else if (regUpper === 'SI') this.state.registers.SI = value;
    else if (regUpper === 'DI') this.state.registers.DI = value;
    else if (regUpper === 'SP') this.state.registers.SP = value;
    else if (regUpper === 'BP') this.state.registers.BP = value;
    else if (regUpper === 'IP') this.state.registers.IP = value;
    else if (regUpper === 'CS') this.state.registers.CS = value;
    else if (regUpper === 'DS') this.state.registers.DS = value;
    else if (regUpper === 'SS') this.state.registers.SS = value;
    else if (regUpper === 'ES') this.state.registers.ES = value;

    // 8-bit halves
    else if (regUpper === 'AH') {
      this.state.registers.AX = (this.state.registers.AX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (regUpper === 'AL') {
      this.state.registers.AX = (this.state.registers.AX & 0xFF00) | (value & 0xFF);
    } else if (regUpper === 'BH') {
      this.state.registers.BX = (this.state.registers.BX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (regUpper === 'BL') {
      this.state.registers.BX = (this.state.registers.BX & 0xFF00) | (value & 0xFF);
    } else if (regUpper === 'CH') {
      this.state.registers.CX = (this.state.registers.CX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (regUpper === 'CL') {
      this.state.registers.CX = (this.state.registers.CX & 0xFF00) | (value & 0xFF);
    } else if (regUpper === 'DH') {
      this.state.registers.DX = (this.state.registers.DX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (regUpper === 'DL') {
      this.state.registers.DX = (this.state.registers.DX & 0xFF00) | (value & 0xFF);
    } else {
      throw new Error(`Unknown register: ${reg}`);
    }
  }

  // Resolve memory operand's effective physical address
  resolveMemoryAddress(operand: Operand): number {
    if (!operand.memAddress) throw new Error('Invalid memory operand');
    const { baseReg, indexReg, displacement, segmentOverride } = operand.memAddress;

    let offset = displacement;
    if (baseReg) offset += this.getRegValue(baseReg);
    if (indexReg) offset += this.getRegValue(indexReg);

    // Default segment is DS, unless base register is BP, then it defaults to SS
    let segment: 'CS' | 'DS' | 'SS' | 'ES' = segmentOverride || 'DS';
    if (!segmentOverride && baseReg === 'BP') {
      segment = 'SS';
    }

    return this.getPhysicalAddress(segment, offset);
  }

  getOperandValue(operand: Operand): number {
    if (operand.type === 'immediate') {
      return operand.immValue || 0;
    }
    if (operand.type === 'register') {
      return this.getRegValue(operand.value);
    }
    if (operand.type === 'memory') {
      const address = this.resolveMemoryAddress(operand);
      const size = operand.memAddress?.sizeOverride || 8; // default to 8-bit if unspecified
      if (size === 16) {
        // Little Endian read
        const low = this.state.memory[address];
        const high = this.state.memory[(address + 1) & 0xFFFFF];
        return (high << 8) | low;
      } else {
        return this.state.memory[address];
      }
    }
    return 0;
  }

  setOperandValue(operand: Operand, value: number) {
    if (operand.type === 'register') {
      this.setRegValue(operand.value, value);
    } else if (operand.type === 'memory') {
      const address = this.resolveMemoryAddress(operand);
      const size = operand.memAddress?.sizeOverride || 8;
      if (size === 16) {
        // Little Endian write
        this.state.memory[address] = value & 0xFF;
        this.state.memory[(address + 1) & 0xFFFFF] = (value >> 8) & 0xFF;
      } else {
        this.state.memory[address] = value & 0xFF;
      }
    } else {
      throw new Error('Cannot write to immediate value');
    }
  }

  // Push value onto stack
  pushStack(val: number) {
    // SP decrements by 2
    this.state.registers.SP = (this.state.registers.SP - 2) & 0xFFFF;
    const address = this.getPhysicalAddress('SS', this.state.registers.SP);
    this.state.memory[address] = val & 0xFF;
    this.state.memory[(address + 1) & 0xFFFFF] = (val >> 8) & 0xFF;
  }

  // Pop value from stack
  popStack(): number {
    const address = this.getPhysicalAddress('SS', this.state.registers.SP);
    const low = this.state.memory[address];
    const high = this.state.memory[(address + 1) & 0xFFFFF];
    const val = (high << 8) | low;
    // SP increments by 2
    this.state.registers.SP = (this.state.registers.SP + 2) & 0xFFFF;
    return val;
  }

  // Update Zero, Sign, Parity flags based on result and operand size
  updateSZPFlags(result: number, size: 8 | 16) {
    const mask = size === 16 ? 0xFFFF : 0xFF;
    const signBit = size === 16 ? 0x8000 : 0x80;
    const val = result & mask;

    this.state.flags.ZF = val === 0;
    this.state.flags.SF = (val & signBit) !== 0;
    this.state.flags.PF = calculateParity(val);
  }

  // Step execute one instruction
  step(): ParsedInstruction | null {
    if (this.state.halted) return null;

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
      case 'mov': {
        if (inst.dest && inst.src) {
          const val = this.getOperandValue(inst.src);
          // If destination is memory, override size to match source register if possible
          if (inst.dest.type === 'memory' && !inst.dest.memAddress?.sizeOverride && inst.src.type === 'register') {
            inst.dest.memAddress!.sizeOverride = inst.src.regSize;
          }
          this.setOperandValue(inst.dest, val);
        }
        break;
      }
      case 'push': {
        if (inst.dest) {
          const val = this.getOperandValue(inst.dest);
          this.pushStack(val);
        }
        break;
      }
      case 'pop': {
        if (inst.dest) {
          const val = this.popStack();
          this.setOperandValue(inst.dest, val);
        }
        break;
      }
      case 'xchg': {
        if (inst.dest && inst.src) {
          const val1 = this.getOperandValue(inst.dest);
          const val2 = this.getOperandValue(inst.src);
          this.setOperandValue(inst.dest, val2);
          this.setOperandValue(inst.src, val1);
        }
        break;
      }
      case 'lea': {
        if (inst.dest && inst.src && inst.src.type === 'memory') {
          // LEA gets the offset address, not the memory value
          const address = this.resolveMemoryAddress(inst.src);
          // Effective address is segment:offset. 8086 LEA loads offset relative to segment.
          // In our emulator DS=SS=CS=0x0700, so we retrieve the offset relative to DS/SS.
          const segBase = (inst.src.memAddress?.segmentOverride ? this.state.registers[inst.src.memAddress.segmentOverride] : this.state.registers.DS) * 16;
          const offset = (address - segBase) & 0xFFFF;
          this.setRegValue(inst.dest.value, offset);
        }
        break;
      }
      case 'add':
      case 'adc': {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          const carry = (opLower === 'adc' && this.state.flags.CF) ? 1 : 0;
          const result = v1 + v2 + carry;
          const mask = size === 16 ? 0xFFFF : 0xFF;
          const signBit = size === 16 ? 0x8000 : 0x80;

          // Carry Flag
          this.state.flags.CF = result > mask;
          // Overflow Flag (adding same sign yielding different sign)
          const sign1 = v1 & signBit;
          const sign2 = v2 & signBit;
          const signR = result & signBit;
          this.state.flags.OF = (sign1 === sign2) && (sign1 !== signR);

          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result & mask);
        }
        break;
      }
      case 'sub':
      case 'sbb':
      case 'cmp': {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          const borrow = (opLower === 'sbb' && this.state.flags.CF) ? 1 : 0;
          const result = v1 - v2 - borrow;
          const mask = size === 16 ? 0xFFFF : 0xFF;
          const signBit = size === 16 ? 0x8000 : 0x80;

          // Carry / Borrow Flag
          this.state.flags.CF = v1 < (v2 + borrow);
          // Overflow Flag
          const sign1 = v1 & signBit;
          const sign2 = v2 & signBit;
          const signR = result & signBit;
          this.state.flags.OF = (sign1 !== sign2) && (sign1 !== signR);

          this.updateSZPFlags(result, size);
          if (opLower !== 'cmp') {
            this.setOperandValue(inst.dest, result & mask);
          }
        }
        break;
      }
      case 'inc':
      case 'dec': {
        if (inst.dest) {
          const v = this.getOperandValue(inst.dest);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          const diff = opLower === 'inc' ? 1 : -1;
          const result = v + diff;
          const mask = size === 16 ? 0xFFFF : 0xFF;
          const signBit = size === 16 ? 0x8000 : 0x80;

          // Overflow Flag (doesn't affect CF)
          if (opLower === 'inc') {
            this.state.flags.OF = v === (signBit - 1);
          } else {
            this.state.flags.OF = v === signBit;
          }

          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result & mask);
        }
        break;
      }
      case 'mul':
      case 'imul': {
        if (inst.dest) {
          const v2 = this.getOperandValue(inst.dest);
          const isWord = inst.dest.type === 'register' ? inst.dest.regSize === 16 : (inst.dest.memAddress?.sizeOverride === 16);

          if (isWord) {
            const v1 = this.state.registers.AX;
            const result = v1 * v2;
            this.state.registers.AX = result & 0xFFFF;
            this.state.registers.DX = (result >> 16) & 0xFFFF;
            this.state.flags.CF = this.state.flags.OF = this.state.registers.DX !== 0;
          } else {
            const v1 = this.state.registers.AX & 0xFF; // AL
            const result = v1 * v2;
            this.state.registers.AX = (this.state.registers.AX & 0xFF00) | (result & 0xFF);
            // AH stores high byte
            this.state.registers.AX = (this.state.registers.AX & 0x00FF) | (((result >> 8) & 0xFF) << 8);
            this.state.flags.CF = this.state.flags.OF = ((result >> 8) & 0xFF) !== 0;
          }
        }
        break;
      }
      case 'div':
      case 'idiv': {
        if (inst.dest) {
          const divisor = this.getOperandValue(inst.dest);
          if (divisor === 0) {
            this.state.consoleOutput += '\n[Error: Division by Zero]';
            this.state.halted = true;
            break;
          }
          const isWord = inst.dest.type === 'register' ? inst.dest.regSize === 16 : (inst.dest.memAddress?.sizeOverride === 16);

          if (isWord) {
            const dividend = (this.state.registers.DX << 16) | this.state.registers.AX;
            const quotient = Math.floor(dividend / divisor);
            const remainder = dividend % divisor;
            this.state.registers.AX = quotient & 0xFFFF;
            this.state.registers.DX = remainder & 0xFFFF;
          } else {
            const dividend = this.state.registers.AX;
            const quotient = Math.floor(dividend / divisor);
            const remainder = dividend % divisor;
            this.state.registers.AX = (remainder << 8) | (quotient & 0xFF); // AH: remainder, AL: quotient
          }
        }
        break;
      }
      case 'and':
      case 'or':
      case 'xor': {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          let result = 0;

          if (opLower === 'and') result = v1 & v2;
          else if (opLower === 'or') result = v1 | v2;
          else if (opLower === 'xor') result = v1 ^ v2;

          this.state.flags.CF = false;
          this.state.flags.OF = false;
          this.updateSZPFlags(result, size);
          this.setOperandValue(inst.dest, result);
        }
        break;
      }
      case 'not': {
        if (inst.dest) {
          const v = this.getOperandValue(inst.dest);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          const mask = size === 16 ? 0xFFFF : 0xFF;
          this.setOperandValue(inst.dest, (~v) & mask);
        }
        break;
      }
      case 'test': {
        if (inst.dest && inst.src) {
          const v1 = this.getOperandValue(inst.dest);
          const v2 = this.getOperandValue(inst.src);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          const result = v1 & v2;

          this.state.flags.CF = false;
          this.state.flags.OF = false;
          this.updateSZPFlags(result, size);
        }
        break;
      }
      case 'shl':
      case 'shr':
      case 'sar': {
        if (inst.dest && inst.src) {
          const v = this.getOperandValue(inst.dest);
          const count = this.getOperandValue(inst.src);
          const size = inst.dest.type === 'register' ? inst.dest.regSize! : (inst.dest.memAddress?.sizeOverride || 8);
          const mask = size === 16 ? 0xFFFF : 0xFF;
          const signBit = size === 16 ? 0x8000 : 0x80;
          let result = v;

          for (let c = 0; c < count; c++) {
            if (opLower === 'shl') {
              this.state.flags.CF = (result & signBit) !== 0;
              result = (result << 1) & mask;
            } else if (opLower === 'shr') {
              this.state.flags.CF = (result & 1) !== 0;
              result = result >> 1;
            } else if (opLower === 'sar') {
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
      case 'jmp': {
        if (inst.dest && inst.dest.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'je':
      case 'jz': {
        if (this.state.flags.ZF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'jne':
      case 'jnz': {
        if (!this.state.flags.ZF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'jc':
      case 'jb': {
        if (this.state.flags.CF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'jnc':
      case 'jnb': {
        if (!this.state.flags.CF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'js': {
        if (this.state.flags.SF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'jns': {
        if (!this.state.flags.SF && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'loop': {
        const cx = (this.state.registers.CX - 1) & 0xFFFF;
        this.state.registers.CX = cx;
        if (cx !== 0 && inst.dest?.immValue !== undefined) {
          nextIP = inst.dest.immValue;
        }
        break;
      }
      case 'int': {
        const intNum = inst.dest?.immValue;
        if (intNum === 0x21) {
          const ah = (this.state.registers.AX >> 8) & 0xFF;
          if (ah === 0x02) {
            // Write character in DL to console
            const charCode = this.state.registers.DX & 0xFF;
            this.state.consoleOutput += String.fromCharCode(charCode);
          } else if (ah === 0x09) {
            // Write string at DS:DX (terminated by '$')
            const dx = this.state.registers.DX;
            let addr = this.getPhysicalAddress('DS', dx);
            let str = '';
            while (addr < this.state.memory.length) {
              const char = this.state.memory[addr];
              if (char === 36) break; // '$' sign
              str += String.fromCharCode(char);
              addr++;
            }
            this.state.consoleOutput += str;
          } else if (ah === 0x4C) {
            // Exit program
            this.state.halted = true;
            this.state.consoleOutput += '\n[Program terminated successfully]';
          }
        } else if (intNum === 3) {
          // Breakpoint: pause execution
          this.state.halted = true;
          this.state.consoleOutput += '\n[Breakpoint hit (INT 3)]';
        }
        break;
      }
      case 'hlt': {
        this.state.halted = true;
        this.state.consoleOutput += '\n[CPU Halted (HLT)]';
        break;
      }
      default:
        // Treat as NOP
        break;
    }

    this.state.registers.IP = nextIP & 0xFFFF;
    return inst;
  }
}
