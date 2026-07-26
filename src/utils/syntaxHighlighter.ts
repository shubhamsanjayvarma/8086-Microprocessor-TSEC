// 8086 Assembly Syntax Tokenizer & Visual Highlighter

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const MNEMONICS = new Set([
  "MOV",
  "ADD",
  "SUB",
  "JMP",
  "JE",
  "JNE",
  "JZ",
  "JNZ",
  "JL",
  "JLE",
  "JG",
  "JGE",
  "JA",
  "JAE",
  "JB",
  "JBE",
  "INT",
  "CALL",
  "RET",
  "LEA",
  "INC",
  "DEC",
  "CMP",
  "NOP",
  "PUSH",
  "POP",
  "LOOP",
  "MUL",
  "DIV",
  "IMUL",
  "IDIV",
  "AND",
  "OR",
  "XOR",
  "NOT",
  "SHL",
  "SHR",
  "ROL",
  "ROR",
  "RCR",
  "RCL",
  "HLT",
  "LAHF",
  "SAHF",
  "PUSHF",
  "POPF",
  "XCHG",
  "IN",
  "OUT",
]);

const REGISTERS = new Set([
  "AX",
  "AH",
  "AL",
  "BX",
  "BH",
  "BL",
  "CX",
  "CH",
  "CL",
  "DX",
  "DH",
  "DL",
  "SI",
  "DI",
  "BP",
  "SP",
  "IP",
  "CS",
  "DS",
  "SS",
  "ES",
  "FLAGS",
]);

const DIRECTIVES = new Set([
  ".MODEL",
  ".DATA",
  ".CODE",
  ".STACK",
  "DB",
  "DW",
  "DD",
  "DUP",
  "EQU",
  "ORG",
  "END",
  "PROC",
  "ENDP",
  "SMALL",
  "TINY",
  "MEDIUM",
  "COMPACT",
  "LARGE",
  "HUGE",
]);

export function highlightLine(line: string): string {
  if (!line) return "";

  // 1. Separate comment part (first unquoted ;)
  let commentIndex = -1;
  let inString: string | null = null;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      if (inString === char) {
        inString = null;
      } else if (!inString) {
        inString = char;
      }
    } else if (char === ";" && !inString) {
      commentIndex = i;
      break;
    }
  }

  const codePart = commentIndex !== -1 ? line.slice(0, commentIndex) : line;
  const commentPart = commentIndex !== -1 ? line.slice(commentIndex) : "";

  // Escape HTML special characters (<, >, &)
  let escapedCode = escapeHtml(codePart);
  const escapedComment = commentPart
    ? `<span class="hl-comment">${escapeHtml(commentPart)}</span>`
    : "";

  // 2. Highlight strings
  escapedCode = escapedCode.replace(
    /("[^"]*"|'[^']*')/g,
    '<span class="hl-string">$1</span>',
  );

  // 3. Highlight labels (e.g. START:)
  escapedCode = escapedCode.replace(
    /(^|\s)([a-zA-Z_][a-zA-Z0-9_]*:)/g,
    '$1<span class="hl-label">$2</span>',
  );

  // 4. Tokenize word by word outside existing span tags
  // Regex matches words (including starting with dot like .MODEL)
  escapedCode = escapedCode.replace(
    /(?:\.[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)/g,
    (match) => {
      const upper = match.toUpperCase();

      if (DIRECTIVES.has(upper)) {
        return `<span class="hl-directive">${match}</span>`;
      }
      if (MNEMONICS.has(upper)) {
        return `<span class="hl-mnemonic">${match}</span>`;
      }
      if (REGISTERS.has(upper)) {
        return `<span class="hl-register">${match}</span>`;
      }
      // Hex numbers (e.g. 0100H, 0FFH) or numbers (e.g. 1234, 0x12)
      if (/^(0x[0-9a-fA-F]+|[0-9a-fA-F]+[hH]|\d+)$/.test(match)) {
        return `<span class="hl-number">${match}</span>`;
      }

      return match;
    },
  );

  return escapedCode + escapedComment;
}

export function highlight8086Assembly(code: string): string {
  if (!code) return "";
  return code.split("\n").map(highlightLine).join("\n");
}
