export type OperandType = "register" | "memory" | "immediate" | "label";

export interface Operand {
  type: OperandType;
  value: string;
  regSize?: 8 | 16;
  immValue?: number;
  memAddress?: {
    baseReg?: "BX" | "BP";
    indexReg?: "SI" | "DI";
    displacement: number;
    segmentOverride?: "CS" | "DS" | "SS" | "ES";
    sizeOverride?: 8 | 16;
    labelRef?: string;
  };
}

export interface ParsedInstruction {
  op: string;
  prefix?: string;
  dest?: Operand;
  src?: Operand;
  label?: string;
  originalLine: string;
  lineNo: number;
  byteOffset: number;
  byteLength: number;
  bytes: number[];
}

export interface VariableSymbol {
  name: string;
  type: "DB" | "DW";
  offset: number;
  values: number[];
}

export interface CompilerResult {
  instructions: ParsedInstruction[];
  variables: Map<string, VariableSymbol>;
  labels: Map<string, number>;
  errors: Array<{ lineNo: number; message: string }>;
  listing: string[];
}

// Registers configuration
const REG_16 = [
  "AX",
  "BX",
  "CX",
  "DX",
  "SP",
  "BP",
  "SI",
  "DI",
  "CS",
  "DS",
  "SS",
  "ES",
];
const REG_8 = ["AH", "AL", "BH", "BL", "CH", "CL", "DH", "DL"];

export function parseNumber(str: string): number | null {
  const originalStr = str.trim();
  if (
    originalStr.startsWith("'") &&
    originalStr.endsWith("'") &&
    originalStr.length === 3
  ) {
    return originalStr.charCodeAt(1);
  }

  str = originalStr.toLowerCase();
  if (str.endsWith("h")) {
    const val = parseInt(str.slice(0, -1), 16);
    return isNaN(val) ? null : val;
  }
  if (str.endsWith("b")) {
    const val = parseInt(str.slice(0, -1), 2);
    return isNaN(val) ? null : val;
  }
  if (str.endsWith("o")) {
    const val = parseInt(str.slice(0, -1), 8);
    return isNaN(val) ? null : val;
  }
  if (str.startsWith("0x")) {
    const val = parseInt(str.slice(2), 16);
    return isNaN(val) ? null : val;
  }
  const val = parseInt(str, 10);
  return isNaN(val) ? null : val;
}

export function parseMemoryOperand(str: string): Operand | null {
  // Strip outer brackets: e.g. [bx + si + 4] -> bx + si + 4
  let content = str.trim();
  let sizeOverride: 8 | 16 | undefined;
  let segmentOverride: "CS" | "DS" | "SS" | "ES" | undefined;

  // Check size overrides
  if (content.toLowerCase().startsWith("byte ptr")) {
    sizeOverride = 8;
    content = content.slice(8).trim();
  } else if (content.toLowerCase().startsWith("word ptr")) {
    sizeOverride = 16;
    content = content.slice(8).trim();
  }

  // Check segment override
  const segMatch = content.match(/^([cdef]s):/i);
  if (segMatch) {
    segmentOverride = segMatch[1].toUpperCase() as any;
    content = content.slice(segMatch[0].length).trim();
  }

  if (!content.startsWith("[") || !content.endsWith("]")) {
    return null;
  }

  content = content.slice(1, -1).trim();

  // Parse inner terms e.g., bx + si + 4
  const cleanContent = content.replace(/\s*-\s*/g, "+-");
  const terms = cleanContent
    .split("+")
    .map((t) => t.trim())
    .filter((t) => t);
  let baseReg: "BX" | "BP" | undefined;
  let indexReg: "SI" | "DI" | undefined;
  let displacement = 0;
  let labelRef: string | undefined;

  for (const term of terms) {
    const termLower = term.toLowerCase();
    if (termLower === "bx") baseReg = "BX";
    else if (termLower === "bp") baseReg = "BP";
    else if (termLower === "si") indexReg = "SI";
    else if (termLower === "di") indexReg = "DI";
    else {
      // Must be displacement
      const val = parseNumber(term);
      if (val !== null) {
        displacement += val;
      } else {
        labelRef = term.toUpperCase();
      }
    }
  }

  return {
    type: "memory",
    value: str,
    memAddress: {
      baseReg,
      indexReg,
      displacement,
      segmentOverride,
      sizeOverride,
      labelRef,
    },
  };
}

export function parseOperand(str: string): Operand {
  let cleanStr = str.trim();
  if (cleanStr.toLowerCase().startsWith("offset ")) {
    cleanStr = cleanStr.substring(7).trim();
  }
  const upperStr = cleanStr.toUpperCase();

  // Register
  if (REG_16.includes(upperStr)) {
    return { type: "register", value: upperStr, regSize: 16 };
  }
  if (REG_8.includes(upperStr)) {
    return { type: "register", value: upperStr, regSize: 8 };
  }

  // Memory
  if (
    cleanStr.startsWith("[") ||
    cleanStr.toLowerCase().includes("ptr") ||
    /^[cdef]s:\[/i.test(cleanStr)
  ) {
    const memOp = parseMemoryOperand(cleanStr);
    if (memOp) return memOp;
  }

  // Immediate Number
  const numVal = parseNumber(cleanStr);
  if (numVal !== null) {
    return { type: "immediate", value: cleanStr, immValue: numVal };
  }

  // Label (resolved later in compilation pass 2)
  return { type: "label", value: cleanStr };
}

// Generate realistic mock opcodes for visualization
function encodeInstruction(
  op: string,
  dest?: Operand,
  src?: Operand,
  labelOffset?: number,
): number[] {
  const bytes: number[] = [];
  const opLower = op.toLowerCase();

  const getRegCode = (reg: string): number => {
    switch (reg) {
      case "AX":
      case "AL":
        return 0;
      case "CX":
      case "CL":
        return 1;
      case "DX":
      case "DL":
        return 2;
      case "BX":
      case "BL":
        return 3;
      case "SP":
      case "AH":
        return 4;
      case "BP":
      case "CH":
        return 5;
      case "SI":
      case "DH":
        return 6;
      case "DI":
      case "BH":
        return 7;
      default:
        return 0;
    }
  };

  try {
    if (opLower === "nop") {
      bytes.push(0x90);
    } else if (opLower === "mov") {
      if (dest?.type === "register" && src?.type === "register") {
        const sizeBit = dest.regSize === 16 ? 1 : 0;
        const dBit = 1; // reg is dest
        const opcode = 0x88 | (dBit << 1) | sizeBit;
        const mod = 3; // reg-reg
        const reg = getRegCode(dest.value);
        const rm = getRegCode(src.value);
        const modrm = (mod << 6) | (reg << 3) | rm;
        bytes.push(opcode, modrm);
      } else if (dest?.type === "register" && src?.type === "immediate") {
        const regCode = getRegCode(dest.value);
        const imm = src.immValue || 0;
        if (dest.regSize === 16) {
          bytes.push(0xb8 + regCode, imm & 0xff, (imm >> 8) & 0xff);
        } else {
          bytes.push(0xb0 + regCode, imm & 0xff);
        }
      } else if (dest?.type === "memory" && src?.type === "register") {
        const sizeBit = src.regSize === 16 ? 1 : 0;
        bytes.push(0x89 | sizeBit);
        // Simplified ModR/M byte
        bytes.push(0x16, 0x00, 0x00);
      } else if (dest?.type === "register" && src?.type === "memory") {
        const sizeBit = dest.regSize === 16 ? 1 : 0;
        bytes.push(0x8b | sizeBit);
        bytes.push(0x16, 0x00, 0x00);
      } else if (dest?.type === "memory" && src?.type === "immediate") {
        const size = dest.memAddress?.sizeOverride || 8;
        if (size === 16) {
          bytes.push(
            0xc7,
            0x06,
            0x00,
            0x00,
            (src.immValue || 0) & 0xff,
            ((src.immValue || 0) >> 8) & 0xff,
          );
        } else {
          bytes.push(0xc6, 0x06, 0x00, 0x00, (src.immValue || 0) & 0xff);
        }
      }
    } else if (["add", "sub", "cmp", "and", "or", "xor"].includes(opLower)) {
      const opCodes: Record<string, number> = {
        add: 0x00,
        or: 0x08,
        adc: 0x10,
        sbb: 0x18,
        and: 0x20,
        sub: 0x28,
        xor: 0x30,
        cmp: 0x38,
      };
      const baseOp = opCodes[opLower] || 0x00;

      if (dest?.type === "register" && src?.type === "register") {
        const sizeBit = dest.regSize === 16 ? 1 : 0;
        bytes.push(
          baseOp | sizeBit,
          (3 << 6) | (getRegCode(dest.value) << 3) | getRegCode(src.value),
        );
      } else if (dest?.type === "register" && src?.type === "immediate") {
        const sizeBit = dest.regSize === 16 ? 1 : 0;
        const imm = src.immValue || 0;
        bytes.push(
          0x80 | sizeBit,
          (3 << 6) | (getRegCode(dest.value) << 3),
          imm & 0xff,
        );
        if (dest.regSize === 16) bytes.push((imm >> 8) & 0xff);
      }
    } else if (["inc", "dec"].includes(opLower)) {
      if (dest?.type === "register") {
        if (dest.regSize === 16) {
          const regCode = getRegCode(dest.value);
          bytes.push((opLower === "inc" ? 0x40 : 0x48) + regCode);
        } else {
          bytes.push(
            0xfe,
            (opLower === "inc" ? 0xc0 : 0xc8) + getRegCode(dest.value),
          );
        }
      }
    } else if (["push", "pop"].includes(opLower)) {
      if (dest?.type === "register" && dest.regSize === 16) {
        bytes.push((opLower === "push" ? 0x50 : 0x58) + getRegCode(dest.value));
      }
    } else if (opLower.startsWith("j") || opLower === "loop") {
      const jumpCodes: Record<string, number> = {
        jmp: 0xeb,
        je: 0x74,
        jz: 0x74,
        jne: 0x75,
        jnz: 0x75,
        jc: 0x72,
        jb: 0x72,
        jnc: 0x73,
        jnb: 0x73,
        js: 0x78,
        jns: 0x79,
        jo: 0x70,
        jno: 0x71,
        jp: 0x7a,
        jpe: 0x7a,
        jnp: 0x7b,
        jpo: 0x7b,
        jg: 0x7f,
        jge: 0x7d,
        jl: 0x7c,
        jle: 0x7e,
        ja: 0x77,
        jb_u: 0x72,
        loop: 0xe2,
      };
      const code = jumpCodes[opLower] || 0xeb;
      bytes.push(code);
      if (labelOffset !== undefined) {
        bytes.push(labelOffset & 0xff);
      } else {
        bytes.push(0x00);
      }
    } else if (opLower === "int") {
      const imm = dest?.immValue || 0;
      if (imm === 3) {
        bytes.push(0xcc);
      } else {
        bytes.push(0xcd, imm & 0xff);
      }
    } else if (opLower === "hlt") {
      bytes.push(0xf4);
    } else {
      // Fallback instruction
      bytes.push(0x90);
    }
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bytes.push(0x90);
  }

  // Ensure we return at least NOP if encoding failed empty
  if (bytes.length === 0) bytes.push(0x90);
  return bytes;
}

export function compile8086(code: string): CompilerResult {
  const lines = code.split("\n");
  const instructions: ParsedInstruction[] = [];
  const variables = new Map<string, VariableSymbol>();
  const labels = new Map<string, number>();
  const errors: Array<{ lineNo: number; message: string }> = [];
  const listing: string[] = [];

  let currentOffset = 0x100; // Standard COM file start offset (e.g., ORG 100h)

  // Pass 1: Parse structure, labels, variables, and size estimation
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNo = i + 1;

    // Remove comments
    let line = rawLine.split(";")[0].trim();
    if (!line) {
      continue; // Skip blank lines
    }

    // Check for ORG directive
    const orgMatch = line.match(/^org\s+(.+)/i);
    if (orgMatch) {
      const val = parseNumber(orgMatch[1]);
      if (val !== null) {
        currentOffset = val;
      } else {
        errors.push({
          lineNo,
          message: `Invalid ORG displacement value: ${orgMatch[1]}`,
        });
      }
      continue;
    }

    // Check for label at start of line
    const labelMatch = line.match(/^([a-z0-9_]+):/i);
    if (labelMatch) {
      const labelName = labelMatch[1].toUpperCase();
      if (labels.has(labelName) || variables.has(labelName)) {
        errors.push({
          lineNo,
          message: `Duplicate symbol definition: ${labelName}`,
        });
      }
      labels.set(labelName, currentOffset);
      line = line.slice(labelMatch[0].length).trim();
      if (!line) {
        // Just a label line
        continue;
      }
    }

    // Check for Data definition directives DB / DW
    // Format: name DB value1, value2, ...
    const dbMatch = line.match(/^([a-z0-9_]+)\s+(db|dw)\s+(.+)$/i);
    if (dbMatch) {
      const varName = dbMatch[1].toUpperCase();
      const type = dbMatch[2].toUpperCase() as "DB" | "DW";
      const valStr = dbMatch[3].trim();

      const rawValues = valStr.split(",").map((v) => v.trim());
      const values: number[] = [];

      for (const val of rawValues) {
        // String literal in DB e.g. 'hello'
        if (
          val.startsWith("'") &&
          val.endsWith("'") &&
          val.length > 2 &&
          !val.toUpperCase().includes("DUP")
        ) {
          const content = val.slice(1, -1);
          for (let c = 0; c < content.length; c++) {
            values.push(content.charCodeAt(c));
          }
        } else {
          // Check for DUP directive
          const dupMatch = val.match(/^(\d+)\s+DUP\((.+)\)$/i);
          let count = 1;
          let innerVal = val;
          if (dupMatch) {
            count = parseInt(dupMatch[1], 10);
            innerVal = dupMatch[2].trim();
          }

          let num = parseNumber(innerVal);
          if (
            num === null &&
            innerVal.startsWith("'") &&
            innerVal.endsWith("'") &&
            innerVal.length === 3
          ) {
            num = innerVal.charCodeAt(1);
          }

          if (num !== null) {
            for (let i = 0; i < count; i++) {
              if (type === "DW") {
                values.push(num & 0xff);
                values.push((num >> 8) & 0xff);
              } else {
                values.push(num & 0xff);
              }
            }
          } else {
            errors.push({
              lineNo,
              message: `Invalid numeric initializer: ${val}`,
            });
          }
        }
      }

      variables.set(varName, {
        name: varName,
        type,
        offset: currentOffset,
        values,
      });

      // Advance offset by size. 'values' already contains individual bytes.
      currentOffset += values.length;
      continue;
    }

    // Check for REP prefix
    let prefix: string | undefined;
    const prefixMatch = line.match(/^(REPE|REPZ|REPNE|REPNZ|REP)\s+/i);
    if (prefixMatch) {
      prefix = prefixMatch[1].toUpperCase();
      line = line.slice(prefixMatch[0].length).trim();
    }

    // Parse Instruction mnemonic & operands
    // Format: MOV AX, BX or HLT
    const spaceIndex = line.indexOf(" ");
    let op = "";
    let operandStr = "";

    if (spaceIndex === -1) {
      op = line;
    } else {
      op = line.substring(0, spaceIndex).trim();
      operandStr = line.substring(spaceIndex + 1).trim();
    }

    const opUpper = op.toUpperCase();

    // Validate REP prefix
    if (prefix) {
      const validStringOps = [
        "MOVSB",
        "MOVSW",
        "LODSB",
        "LODSW",
        "STOSB",
        "STOSW",
        "CMPSB",
        "CMPSW",
        "SCASB",
        "SCASW",
      ];
      if (!validStringOps.includes(opUpper)) {
        errors.push({
          lineNo,
          message: `Invalid use of REP prefix with ${opUpper}`,
        });
      }
    }

    const parts = operandStr ? operandStr.split(",").map((p) => p.trim()) : [];

    let dest: Operand | undefined;
    let src: Operand | undefined;

    if (parts.length > 0 && parts[0] !== "") {
      dest = parseOperand(parts[0]);
    }
    if (parts.length > 1) {
      src = parseOperand(parts[1]);
    }

    // Infer memory operand size from register operand if not explicitly specified
    if (
      dest?.type === "memory" &&
      dest.memAddress &&
      !dest.memAddress.sizeOverride &&
      src?.type === "register"
    ) {
      dest.memAddress.sizeOverride = src.regSize as 8 | 16;
    } else if (
      src?.type === "memory" &&
      src.memAddress &&
      !src.memAddress.sizeOverride &&
      dest?.type === "register"
    ) {
      src.memAddress.sizeOverride = dest.regSize as 8 | 16;
    }

    // Estimate size
    let byteLength = 1;
    const opLower = op.toLowerCase();
    if (["mov", "add", "sub", "cmp", "and", "or", "xor"].includes(opLower)) {
      if (
        dest?.type === "register" &&
        (src?.type === "immediate" || src?.type === "label")
      ) {
        byteLength = dest.regSize === 16 ? 3 : 2;
      } else if (dest?.type === "register" && src?.type === "register") {
        byteLength = 2;
      } else if (dest?.type === "memory" || src?.type === "memory") {
        byteLength = 4; // approximate
      }
    } else if (["inc", "dec", "push", "pop"].includes(opLower)) {
      byteLength = dest?.type === "register" && dest.regSize === 16 ? 1 : 2;
    } else if (opLower.startsWith("j") || opLower === "loop") {
      byteLength = 2; // Short jumps are 2 bytes
    } else if (opLower === "int") {
      byteLength = 2;
    } else if (
      [
        "movsb",
        "movsw",
        "lodsb",
        "lodsw",
        "stosb",
        "stosw",
        "cmpsb",
        "cmpsw",
        "scasb",
        "scasw",
        "cld",
        "std",
      ].includes(opLower)
    ) {
      byteLength = prefix ? 2 : 1;
    }

    instructions.push({
      op: opUpper,
      prefix,
      dest,
      src,
      originalLine: rawLine,
      lineNo,
      byteOffset: currentOffset,
      byteLength,
      bytes: [], // Filled in Pass 2
    });

    currentOffset += byteLength;
  }

  // Pass 2: Resolve Label jumps and encode instructions to bytes
  for (const inst of instructions) {
    const opLower = inst.op.toLowerCase();

    const resolveSymbol = (symStr: string): number | null => {
      const parts = symStr.replace(/\s*-\s*/g, "+-").split("+");
      let total = 0;
      for (let p of parts) {
        p = p.trim();
        if (!p) continue;
        const val = parseNumber(p);
        if (val !== null) {
          total += val;
        } else {
          const pUpper = p.toUpperCase();
          if (labels.has(pUpper)) {
            total += labels.get(pUpper)!;
          } else if (variables.has(pUpper)) {
            total += variables.get(pUpper)!.offset;
          } else {
            return null;
          }
        }
      }
      return total;
    };

    // Resolve immediate values for symbols/variables
    if (inst.dest && inst.dest.type === "label") {
      const resolved = resolveSymbol(inst.dest.value);
      if (resolved !== null) {
        inst.dest.immValue = resolved;
        inst.dest.type = "immediate";
      } else if (
        !opLower.startsWith("j") &&
        opLower !== "loop" &&
        opLower !== "call"
      ) {
        errors.push({
          lineNo: inst.lineNo,
          message: `Undefined symbol: ${inst.dest.value}`,
        });
      }
    }
    if (inst.src && inst.src.type === "label") {
      const resolved = resolveSymbol(inst.src.value);
      if (resolved !== null) {
        inst.src.immValue = resolved;
        inst.src.type = "immediate";
      } else if (
        !opLower.startsWith("j") &&
        opLower !== "loop" &&
        opLower !== "call"
      ) {
        errors.push({
          lineNo: inst.lineNo,
          message: `Undefined symbol: ${inst.src.value}`,
        });
      }
    }

    const resolveMemory = (op?: Operand) => {
      if (op?.type === "memory" && op.memAddress?.labelRef) {
        const sym = op.memAddress.labelRef;
        if (labels.has(sym)) {
          op.memAddress.displacement += labels.get(sym)!;
        } else if (variables.has(sym)) {
          op.memAddress.displacement += variables.get(sym)!.offset;
        }
      }
    };
    resolveMemory(inst.dest);
    resolveMemory(inst.src);

    let relOffset: number | undefined;
    if (opLower.startsWith("j") || opLower === "loop") {
      // Find jump target label
      const targetLabel = inst.dest?.value.toUpperCase();
      if (targetLabel && labels.has(targetLabel)) {
        const targetOffset = labels.get(targetLabel)!;
        // relative displacement from next instruction start
        relOffset = targetOffset - (inst.byteOffset + inst.byteLength);
      } else {
        errors.push({
          lineNo: inst.lineNo,
          message: `Undefined jump target label: ${inst.dest?.value}`,
        });
      }
    }

    inst.bytes = encodeInstruction(inst.op, inst.dest, inst.src, relOffset);

    // Format listing line
    const byteHexStr = inst.bytes
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
    const offsetHexStr = inst.byteOffset
      .toString(16)
      .padStart(4, "0")
      .toUpperCase();
    listing.push(
      `${offsetHexStr}  ${byteHexStr.padEnd(12)}  ${inst.originalLine.trim()}`,
    );
  }

  return {
    instructions,
    variables,
    labels,
    errors,
    listing,
  };
}
