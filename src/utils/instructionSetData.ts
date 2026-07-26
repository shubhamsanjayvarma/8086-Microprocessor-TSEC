export type InstructionCategory =
  | "All"
  | "Data Transfer"
  | "Arithmetic"
  | "Logic & Bitwise"
  | "Control Transfer"
  | "Processor Control & Interrupts";

export interface InstructionItem {
  opcode: string;
  name: string;
  category: Exclude<InstructionCategory, "All">;
  syntax: string;
  flagsAffected: string[];
  description: string;
  example: string;
}

export const INSTRUCTION_CATEGORIES: InstructionCategory[] = [
  "All",
  "Data Transfer",
  "Arithmetic",
  "Logic & Bitwise",
  "Control Transfer",
  "Processor Control & Interrupts",
];

export const INSTRUCTION_SET_DATA: InstructionItem[] = [
  // --- Data Transfer ---
  {
    opcode: "MOV",
    name: "Move Data",
    category: "Data Transfer",
    syntax: "MOV destination, source",
    flagsAffected: ["None"],
    description:
      "Copies value from source operand to destination operand. Source can be an immediate value, register, or memory address.",
    example: "MOV AX, 0005H\nMOV BX, AX\nMOV [0010H], BX",
  },
  {
    opcode: "PUSH",
    name: "Push onto Stack",
    category: "Data Transfer",
    syntax: "PUSH source",
    flagsAffected: ["None"],
    description:
      "Decrements stack pointer (SP) by 2 and pushes a 16-bit word onto the stack.",
    example: "MOV AX, 1234H\nPUSH AX",
  },
  {
    opcode: "POP",
    name: "Pop from Stack",
    category: "Data Transfer",
    syntax: "POP destination",
    flagsAffected: ["None"],
    description:
      "Pops top 16-bit word from the stack into destination register/memory and increments SP by 2.",
    example: "POP DX",
  },
  {
    opcode: "XCHG",
    name: "Exchange Data",
    category: "Data Transfer",
    syntax: "XCHG operand1, operand2",
    flagsAffected: ["None"],
    description:
      "Swaps the contents of two registers or a register and memory location.",
    example: "MOV AX, 0001H\nMOV BX, 0002H\nXCHG AX, BX",
  },
  {
    opcode: "LEA",
    name: "Load Effective Address",
    category: "Data Transfer",
    syntax: "LEA register, memory",
    flagsAffected: ["None"],
    description:
      "Computes the offset address of the source memory operand and loads it into destination register.",
    example: "LEA SI, [0020H]",
  },
  {
    opcode: "IN",
    name: "Input from Port",
    category: "Data Transfer",
    syntax: "IN AL/AX, port",
    flagsAffected: ["None"],
    description:
      "Reads a byte or word from specified I/O port into AL or AX register.",
    example: "IN AL, 60H",
  },
  {
    opcode: "OUT",
    name: "Output to Port",
    category: "Data Transfer",
    syntax: "OUT port, AL/AX",
    flagsAffected: ["None"],
    description: "Writes a byte or word from AL or AX to specified I/O port.",
    example: "OUT 60H, AL",
  },

  // --- Arithmetic ---
  {
    opcode: "ADD",
    name: "Add",
    category: "Arithmetic",
    syntax: "ADD destination, source",
    flagsAffected: ["CF", "PF", "AF", "ZF", "SF", "OF"],
    description:
      "Adds source operand to destination operand and stores result in destination.",
    example: "MOV AX, 0005H\nADD AX, 0003H",
  },
  {
    opcode: "ADC",
    name: "Add with Carry",
    category: "Arithmetic",
    syntax: "ADC destination, source",
    flagsAffected: ["CF", "PF", "AF", "ZF", "SF", "OF"],
    description:
      "Adds source operand and Carry Flag (CF) to destination operand.",
    example: "STC\nMOV AX, 0002H\nADC AX, 0003H",
  },
  {
    opcode: "SUB",
    name: "Subtract",
    category: "Arithmetic",
    syntax: "SUB destination, source",
    flagsAffected: ["CF", "PF", "AF", "ZF", "SF", "OF"],
    description:
      "Subtracts source operand from destination operand and stores result in destination.",
    example: "MOV AX, 0010H\nSUB AX, 0004H",
  },
  {
    opcode: "SBB",
    name: "Subtract with Borrow",
    category: "Arithmetic",
    syntax: "SBB destination, source",
    flagsAffected: ["CF", "PF", "AF", "ZF", "SF", "OF"],
    description:
      "Subtracts source operand and Carry Flag (CF) from destination operand.",
    example: "STC\nMOV AX, 0005H\nSBB AX, 0002H",
  },
  {
    opcode: "INC",
    name: "Increment",
    category: "Arithmetic",
    syntax: "INC destination",
    flagsAffected: ["PF", "AF", "ZF", "SF", "OF"],
    description:
      "Increments destination register or memory location by 1 (Carry flag unaffected).",
    example: "MOV CX, 0000H\nINC CX",
  },
  {
    opcode: "DEC",
    name: "Decrement",
    category: "Arithmetic",
    syntax: "DEC destination",
    flagsAffected: ["PF", "AF", "ZF", "SF", "OF"],
    description:
      "Decrements destination register or memory location by 1 (Carry flag unaffected).",
    example: "MOV CX, 0005H\nDEC CX",
  },
  {
    opcode: "MUL",
    name: "Unsigned Multiply",
    category: "Arithmetic",
    syntax: "MUL source",
    flagsAffected: ["CF", "OF"],
    description:
      "Multiplies unsigned source operand with AL (for 8-bit, stored in AX) or AX (for 16-bit, stored in DX:AX).",
    example: "MOV AX, 0004H\nMOV BX, 0003H\nMUL BX",
  },
  {
    opcode: "IMUL",
    name: "Signed Multiply",
    category: "Arithmetic",
    syntax: "IMUL source",
    flagsAffected: ["CF", "OF"],
    description: "Multiplies signed source operand with AL or AX.",
    example: "MOV AX, 0002H\nMOV CX, 0005H\nIMUL CX",
  },
  {
    opcode: "DIV",
    name: "Unsigned Divide",
    category: "Arithmetic",
    syntax: "DIV source",
    flagsAffected: ["Undefined"],
    description:
      "Divides AX (8-bit divisor) or DX:AX (16-bit divisor) by source operand. Quotient in AL/AX, remainder in AH/DX.",
    example: "MOV AX, 000AH\nMOV BL, 02H\nDIV BL",
  },
  {
    opcode: "IDIV",
    name: "Signed Divide",
    category: "Arithmetic",
    syntax: "IDIV source",
    flagsAffected: ["Undefined"],
    description: "Divides signed AX or DX:AX by signed source operand.",
    example: "MOV AX, 000CH\nMOV BL, 03H\nIDIV BL",
  },
  {
    opcode: "CMP",
    name: "Compare",
    category: "Arithmetic",
    syntax: "CMP destination, source",
    flagsAffected: ["CF", "PF", "AF", "ZF", "SF", "OF"],
    description:
      "Compares destination and source by subtracting source from destination without modifying destination. Updates flags.",
    example: "MOV AX, 0005H\nCMP AX, 0005H\nJE MATCH",
  },

  // --- Logic & Bitwise ---
  {
    opcode: "AND",
    name: "Logical AND",
    category: "Logic & Bitwise",
    syntax: "AND destination, source",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Performs bitwise AND logic operation between destination and source operands.",
    example: "MOV AL, 0FH\nAND AL, 33H",
  },
  {
    opcode: "OR",
    name: "Logical Inclusive OR",
    category: "Logic & Bitwise",
    syntax: "OR destination, source",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Performs bitwise OR logic operation between destination and source operands.",
    example: "MOV AL, 05H\nOR AL, 0AH",
  },
  {
    opcode: "XOR",
    name: "Logical Exclusive OR",
    category: "Logic & Bitwise",
    syntax: "XOR destination, source",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Performs bitwise XOR logic operation. Often used to clear registers (e.g. XOR AX, AX).",
    example: "XOR AX, AX",
  },
  {
    opcode: "NOT",
    name: "Bitwise NOT (Invert)",
    category: "Logic & Bitwise",
    syntax: "NOT destination",
    flagsAffected: ["None"],
    description: "Inverts all bits of destination operand (one's complement).",
    example: "MOV AL, 00H\nNOT AL",
  },
  {
    opcode: "TEST",
    name: "Logical Compare (AND without storing)",
    category: "Logic & Bitwise",
    syntax: "TEST destination, source",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Performs bitwise AND between operands to update flags (ZF, SF, PF) without modifying destination.",
    example: "MOV AL, 05H\nTEST AL, 01H",
  },
  {
    opcode: "SHL / SAL",
    name: "Shift Left",
    category: "Logic & Bitwise",
    syntax: "SHL destination, count",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Shifts destination bits to the left by count. Fills low bits with 0. MSB shifts into Carry Flag.",
    example: "MOV AL, 01H\nSHL AL, 1",
  },
  {
    opcode: "SHR",
    name: "Logical Shift Right",
    category: "Logic & Bitwise",
    syntax: "SHR destination, count",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Shifts destination bits right by count. Fills high bit with 0. LSB shifts into Carry Flag.",
    example: "MOV AL, 08H\nSHR AL, 1",
  },
  {
    opcode: "SAR",
    name: "Arithmetic Shift Right",
    category: "Logic & Bitwise",
    syntax: "SAR destination, count",
    flagsAffected: ["CF", "PF", "ZF", "SF", "OF"],
    description:
      "Shifts destination bits right while preserving sign bit (MSB).",
    example: "MOV AL, 80H\nSAR AL, 1",
  },
  {
    opcode: "ROL",
    name: "Rotate Left",
    category: "Logic & Bitwise",
    syntax: "ROL destination, count",
    flagsAffected: ["CF", "OF"],
    description:
      "Rotates bits left by count. Bits shifted out at MSB enter LSB and Carry Flag.",
    example: "MOV AL, 80H\nROL AL, 1",
  },
  {
    opcode: "ROR",
    name: "Rotate Right",
    category: "Logic & Bitwise",
    syntax: "ROR destination, count",
    flagsAffected: ["CF", "OF"],
    description:
      "Rotates bits right by count. Bits shifted out at LSB enter MSB and Carry Flag.",
    example: "MOV AL, 01H\nROR AL, 1",
  },

  // --- Control Transfer ---
  {
    opcode: "JMP",
    name: "Unconditional Jump",
    category: "Control Transfer",
    syntax: "JMP target_label",
    flagsAffected: ["None"],
    description:
      "Transfers execution unconditionally to specified target label or address.",
    example: "JMP START_LOOP",
  },
  {
    opcode: "JE / JZ",
    name: "Jump if Equal / Jump if Zero",
    category: "Control Transfer",
    syntax: "JE target_label",
    flagsAffected: ["None"],
    description:
      "Jumps to target label if Zero Flag (ZF = 1). Used after CMP or arithmetic zero outcome.",
    example: "CMP AX, BX\nJE MATCH_LABEL",
  },
  {
    opcode: "JNE / JNZ",
    name: "Jump if Not Equal / Jump if Not Zero",
    category: "Control Transfer",
    syntax: "JNE target_label",
    flagsAffected: ["None"],
    description: "Jumps to target label if Zero Flag is clear (ZF = 0).",
    example: "DEC CX\nJNE LOOP_BODY",
  },
  {
    opcode: "JG / JNLE",
    name: "Jump if Greater (Signed)",
    category: "Control Transfer",
    syntax: "JG target_label",
    flagsAffected: ["None"],
    description:
      "Jumps if destination > source (signed). Condition: ZF = 0 and SF = OF.",
    example: "CMP AX, BX\nJG GREATER",
  },
  {
    opcode: "JL / JNGE",
    name: "Jump if Less (Signed)",
    category: "Control Transfer",
    syntax: "JL target_label",
    flagsAffected: ["None"],
    description: "Jumps if destination < source (signed). Condition: SF != OF.",
    example: "CMP AX, BX\nJL LESSER",
  },
  {
    opcode: "JA / JNBE",
    name: "Jump if Above (Unsigned)",
    category: "Control Transfer",
    syntax: "JA target_label",
    flagsAffected: ["None"],
    description:
      "Jumps if destination > source (unsigned). Condition: CF = 0 and ZF = 0.",
    example: "CMP AX, BX\nJA ABOVE",
  },
  {
    opcode: "JB / JNAE",
    name: "Jump if Below (Unsigned)",
    category: "Control Transfer",
    syntax: "JB target_label",
    flagsAffected: ["None"],
    description: "Jumps if destination < source (unsigned). Condition: CF = 1.",
    example: "CMP AX, BX\nJB BELOW",
  },
  {
    opcode: "CALL",
    name: "Call Procedure",
    category: "Control Transfer",
    syntax: "CALL procedure_name",
    flagsAffected: ["None"],
    description:
      "Pushes current IP (return address) onto stack and transfers control to procedure.",
    example: "CALL MY_SUBROUTINE",
  },
  {
    opcode: "RET",
    name: "Return from Procedure",
    category: "Control Transfer",
    syntax: "RET",
    flagsAffected: ["None"],
    description:
      "Pops return address from stack into IP and resumes execution after CALL.",
    example: "RET",
  },
  {
    opcode: "LOOP",
    name: "Loop according to CX",
    category: "Control Transfer",
    syntax: "LOOP target_label",
    flagsAffected: ["None"],
    description: "Decrements CX by 1. If CX != 0, jumps to target label.",
    example: "MOV CX, 0005H\nAGAIN:\nDEC AX\nLOOP AGAIN",
  },

  // --- Processor Control & Interrupts ---
  {
    opcode: "INT",
    name: "Software Interrupt",
    category: "Processor Control & Interrupts",
    syntax: "INT interrupt_num",
    flagsAffected: ["IF", "TF"],
    description:
      "Executes a software interrupt (e.g. INT 21H for MS-DOS service calls).",
    example: "MOV AH, 02H\nMOV DL, 'A'\nINT 21H",
  },
  {
    opcode: "IRET",
    name: "Interrupt Return",
    category: "Processor Control & Interrupts",
    syntax: "IRET",
    flagsAffected: ["All Flags Restored"],
    description:
      "Returns from an interrupt service routine by popping IP, CS, and Flags from stack.",
    example: "IRET",
  },
  {
    opcode: "NOP",
    name: "No Operation",
    category: "Processor Control & Interrupts",
    syntax: "NOP",
    flagsAffected: ["None"],
    description:
      "Performs no operation for 1 instruction cycle. Used for padding or timing delays.",
    example: "NOP",
  },
  {
    opcode: "HLT",
    name: "Halt Processor",
    category: "Processor Control & Interrupts",
    syntax: "HLT",
    flagsAffected: ["None"],
    description:
      "Stops CPU instruction execution until an external hardware reset or interrupt occurs.",
    example: "HLT",
  },
  {
    opcode: "CLC",
    name: "Clear Carry Flag",
    category: "Processor Control & Interrupts",
    syntax: "CLC",
    flagsAffected: ["CF"],
    description: "Clears Carry Flag (CF = 0).",
    example: "CLC",
  },
  {
    opcode: "STC",
    name: "Set Carry Flag",
    category: "Processor Control & Interrupts",
    syntax: "STC",
    flagsAffected: ["CF"],
    description: "Sets Carry Flag (CF = 1).",
    example: "STC",
  },
  {
    opcode: "CLI",
    name: "Clear Interrupt Flag",
    category: "Processor Control & Interrupts",
    syntax: "CLI",
    flagsAffected: ["IF"],
    description: "Disables maskable interrupts (IF = 0).",
    example: "CLI",
  },
  {
    opcode: "STI",
    name: "Set Interrupt Flag",
    category: "Processor Control & Interrupts",
    syntax: "STI",
    flagsAffected: ["IF"],
    description: "Enables maskable interrupts (IF = 1).",
    example: "STI",
  },
];
