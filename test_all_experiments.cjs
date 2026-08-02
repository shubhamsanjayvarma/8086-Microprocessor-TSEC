const fs = require("fs");

const experiments = [
  {
    id: "1.1",
    code: "MOV AL, 05h\nMOV BL, 03h\nADD AL, BL\nHLT",
    expectedReg: "A",
    expectedVal: "08",
  },
  {
    id: "1.2",
    code: "MOV AX, 1000h\nMOV BX, 0500h\nSUB AX, BX\nHLT",
    expectedReg: "A",
    expectedVal: "0B00",
  },
  {
    id: "1.3",
    code: "MOV AL, 05h\nMOV BL, 04h\nMUL BL\nHLT",
    expectedReg: "A",
    expectedVal: "0014",
  },
  {
    id: "1.4",
    code: "MOV AX, 0020h\nMOV DX, 0000h\nMOV BX, 0008h\nDIV BX\nHLT",
    expectedReg: "A",
    expectedVal: "0004",
  },
  {
    id: "1.5",
    code: "MOV AX, 10h\nMOV BX, 20h\nMOV CX, 05h\nADD AX, BX\nSUB AX, CX\nHLT",
    expectedReg: "A",
    expectedVal: "002B",
  },

  {
    id: "2.1",
    code: "MOV AL, 0Fh\nMOV BL, 0Ah\nAND AL, BL\nHLT",
    expectedReg: "A",
    expectedVal: "0A",
  },
  {
    id: "2.2",
    code: "MOV AX, 1010h\nMOV BX, 0101h\nOR AX, BX\nHLT",
    expectedReg: "A",
    expectedVal: "1111",
  },
  {
    id: "2.3",
    code: "MOV AL, 0FFh\nXOR AL, AL\nHLT",
    expectedReg: "A",
    expectedVal: "00",
  },
  {
    id: "2.4",
    code: "MOV AX, 0000h\nNOT AX\nHLT",
    expectedReg: "A",
    expectedVal: "FFFF",
  },
  {
    id: "2.5",
    code: "MOV AL, 3Bh\nAND AL, 0F0h\nHLT",
    expectedReg: "A",
    expectedVal: "30",
  },

  {
    id: "3.1",
    code: "MOV AL, 0Ah\nMOV BL, 0\nMOV CX, 8\nCOUNT:\nSHR AL, 1\nJNC SKIP\nINC BL\nSKIP:\nLOOP COUNT\nHLT",
    expectedReg: "B",
    expectedVal: "02",
  },
  {
    id: "3.2",
    code: "MOV AL, 0F0h\nMOV BL, 0\nMOV CX, 8\nCOUNT2:\nSHR AL, 1\nJC SKIP2\nINC BL\nSKIP2:\nLOOP COUNT2\nHLT",
    expectedReg: "B",
    expectedVal: "04",
  },
  {
    id: "3.3",
    code: "MOV AX, 0FFFFh\nMOV BL, 0\nMOV CX, 16\nCOUNT3:\nSHR AX, 1\nJNC SKIP3\nINC BL\nSKIP3:\nLOOP COUNT3\nHLT",
    expectedReg: "B",
    expectedVal: "10",
  },
  {
    id: "3.4",
    code: "MOV AL, 03h\nMOV BL, 0\nMOV CX, 8\nCOUNT4:\nSHR AL, 1\nJNC SKIP4\nINC BL\nSKIP4:\nLOOP COUNT4\nMOV AL, BL\nAND AL, 01h\nHLT",
    expectedReg: "A",
    expectedVal: "00",
  },
  {
    id: "3.5",
    code: "nums DB 0Fh, 03h\nMOV SI, nums\nMOV CX, 2\nMOV BL, 0\nARR_LOOP:\nMOV AL, [SI]\nPUSH CX\nMOV CX, 8\nBIT_LOOP:\nSHR AL, 1\nJNC SKIP5\nINC BL\nSKIP5:\nLOOP BIT_LOOP\nPOP CX\nINC SI\nLOOP ARR_LOOP\nHLT",
    expectedReg: "B",
    expectedVal: "06",
  },

  {
    id: "4.1",
    code: "arr DB 10h, 30h, 20h\nMOV SI, arr\nMOV CX, 3\nMOV AL, 0\nFIND_MAX:\nCMP AL, [SI]\nJNC NEXT\nMOV AL, [SI]\nNEXT:\nINC SI\nLOOP FIND_MAX\nHLT",
    expectedReg: "A",
    expectedVal: "30",
  },
  {
    id: "4.2",
    code: "arr DB 30h, 10h, 20h\nMOV SI, arr\nMOV CX, 3\nMOV AL, 0FFh\nFIND_MIN:\nCMP AL, [SI]\nJC NEXT2\nMOV AL, [SI]\nNEXT2:\nINC SI\nLOOP FIND_MIN\nHLT",
    expectedReg: "A",
    expectedVal: "10",
  },
  {
    id: "4.3",
    code: "arr DW 1000h, 4000h, 2000h, 3000h\nMOV SI, arr\nMOV CX, 4\nMOV AX, 0\nFIND_MAX_W:\nCMP AX, [SI]\nJNC NEXT3\nMOV AX, [SI]\nNEXT3:\nINC SI\nINC SI\nLOOP FIND_MAX_W\nHLT",
    expectedReg: "A",
    expectedVal: "4000",
  },
  {
    id: "4.4",
    code: "arr DB 10h, 40h, 20h\nMOV SI, arr\nMOV CX, 3\nMOV AL, 0\nMOV BX, 0\nMOV DX, SI\nFIND_MAX_IDX:\nCMP AL, [SI]\nJNC NEXT4\nMOV AL, [SI]\nMOV BX, SI\nNEXT4:\nINC SI\nLOOP FIND_MAX_IDX\nSUB BX, DX\nHLT",
    expectedReg: "A",
    expectedVal: "40",
  },
  {
    id: "4.5",
    code: "arr DB 05h, 20h, 15h\nMOV SI, arr\nMOV CX, 3\nMOV BL, 0\nCOUNT_GT:\nCMP [SI], 10h\nJC NEXT5\nJZ NEXT5\nINC BL\nNEXT5:\nINC SI\nLOOP COUNT_GT\nHLT",
    expectedReg: "B",
    expectedVal: "02",
  },

  {
    id: "5.1",
    code: "arr DB 30h, 10h, 20h\nMOV CX, 2\nOUTER:\nMOV DX, CX\nMOV SI, arr\nINNER:\nMOV AL, [SI]\nCMP AL, [SI+1]\nJC NO_SWAP\nXCHG AL, [SI+1]\nMOV [SI], AL\nNO_SWAP:\nINC SI\nDEC DX\nJNZ INNER\nLOOP OUTER\nHLT",
    expectedMemOffset: 0,
    expectedMemVals: ["10", "20", "30"],
  },
  {
    id: "5.2",
    code: "arr DB 10h, 30h, 20h\nMOV CX, 2\nOUTER2:\nMOV DX, CX\nMOV SI, arr\nINNER2:\nMOV AL, [SI]\nCMP AL, [SI+1]\nJNC NO_SWAP2\nXCHG AL, [SI+1]\nMOV [SI], AL\nNO_SWAP2:\nINC SI\nDEC DX\nJNZ INNER2\nLOOP OUTER2\nHLT",
    expectedMemOffset: 0,
    expectedMemVals: ["30", "20", "10"],
  },
  {
    id: "5.3",
    code: "arr DB 30h, 10h, 20h\nMOV CX, 2\nMOV DI, arr+1\nISORT:\nMOV AL, [DI]\nMOV SI, DI\nDEC SI\nILOOP:\nCMP [SI], AL\nJC IDONE\nMOV BL, [SI]\nMOV [SI+1], BL\nDEC SI\nCMP SI, arr-1\nJNZ ILOOP\nIDONE:\nMOV [SI+1], AL\nINC DI\nLOOP ISORT\nHLT",
    expectedMemOffset: 0,
    expectedMemVals: ["10", "20", "30"],
  },
  {
    id: "5.4",
    code: "arr DW 2000h, 1000h\nMOV CX, 1\nOUTER_W:\nMOV DX, CX\nMOV SI, arr\nINNER_W:\nMOV AX, [SI]\nCMP AX, [SI+2]\nJC NO_SWAP_W\nXCHG AX, [SI+2]\nMOV [SI], AX\nNO_SWAP_W:\nINC SI\nINC SI\nDEC DX\nJNZ INNER_W\nLOOP OUTER_W\nHLT",
    expectedMemOffset: 0,
    expectedMemVals: ["00", "10", "00", "20"],
  },
  {
    id: "5.5",
    code: "arr DB 10h, 20h, 30h\nMOV CX, 2\nMOV SI, arr\nMOV BL, 1\nCHECK:\nMOV AL, [SI]\nCMP AL, [SI+1]\nJC OK\nJZ OK\nMOV BL, 0\nJMP DONE\nOK:\nINC SI\nLOOP CHECK\nDONE:\nHLT",
    expectedReg: "B",
    expectedVal: "01",
  },

  {
    id: "6.1",
    code: "src DB 11h, 22h, 33h\ndst DB 3 DUP(0)\nMOV SI, src\nMOV DI, dst\nMOV CX, 3\nCLD\nREP MOVSB\nHLT",
    expectedMemOffset: 3,
    expectedMemVals: ["11", "22", "33"],
  },
  {
    id: "6.2",
    code: "buf DB 11h, 22h, 33h, 00h\nMOV SI, buf+2\nMOV DI, buf+3\nMOV CX, 3\nSTD\nREP MOVSB\nHLT",
    expectedMemOffset: 0,
    expectedMemVals: ["11", "11", "22", "33"],
  },
  {
    id: "6.3",
    code: "src DW 1111h, 2222h\ndst DW 2 DUP(0)\nMOV SI, src\nMOV DI, dst\nMOV CX, 2\nCLD\nREP MOVSW\nHLT",
    expectedMemOffset: 4,
    expectedMemVals: ["11", "11", "22", "22"],
  },
  {
    id: "6.4",
    code: "src DB 44h, 55h\ndst DB 2 DUP(0)\nMOV SI, src\nMOV DI, dst\nMOV CX, 2\nCLD\nMAN_LOOP:\nLODSB\nSTOSB\nLOOP MAN_LOOP\nHLT",
    expectedMemOffset: 2,
    expectedMemVals: ["44", "55"],
  },
  {
    id: "6.5",
    code: "src DB 10h, 20h\ndst DB 2 DUP(0)\nMOV SI, src\nMOV DI, dst\nMOV CX, 2\nCLD\nINC_LOOP:\nLODSB\nINC AL\nSTOSB\nLOOP INC_LOOP\nHLT",
    expectedMemOffset: 2,
    expectedMemVals: ["11", "21"],
  },

  {
    id: "7.1",
    code: "str DB 'ABBA'\nMOV SI, str\nMOV DI, str+3\nMOV CX, 2\nMOV BL, 1\nPAL_CHK:\nMOV AL, [SI]\nCMP AL, [DI]\nJZ NEXT_CHAR\nMOV BL, 0\nJMP DONE_PAL\nNEXT_CHAR:\nINC SI\nDEC DI\nLOOP PAL_CHK\nDONE_PAL:\nHLT",
    expectedReg: "B",
    expectedVal: "01",
  },
  {
    id: "7.2",
    code: "str DB 'RADAR'\nMOV SI, str\nMOV DI, str+4\nMOV CX, 2\nMOV BL, 1\nPAL_CHK2:\nMOV AL, [SI]\nCMP AL, [DI]\nJZ NEXT_CHAR2\nMOV BL, 0\nJMP DONE_PAL2\nNEXT_CHAR2:\nINC SI\nDEC DI\nLOOP PAL_CHK2\nDONE_PAL2:\nHLT",
    expectedReg: "B",
    expectedVal: "01",
  },
  {
    id: "7.3",
    code: "str DB 'HELLO'\nMOV SI, str\nMOV DI, str+4\nMOV CX, 2\nMOV BL, 1\nPAL_CHK3:\nMOV AL, [SI]\nCMP AL, [DI]\nJZ NEXT_CHAR3\nMOV BL, 0\nJMP DONE_PAL3\nNEXT_CHAR3:\nINC SI\nDEC DI\nLOOP PAL_CHK3\nDONE_PAL3:\nHLT",
    expectedReg: "B",
    expectedVal: "00",
  },
  {
    id: "7.4",
    code: "str DB 'ABCD'\nrev DB 4 DUP(0)\nMOV SI, str+3\nMOV DI, rev\nMOV CX, 4\nREV_LOOP:\nMOV AL, [SI]\nMOV [DI], AL\nDEC SI\nINC DI\nLOOP REV_LOOP\nHLT",
    expectedMemOffset: 4,
    expectedMemVals: ["44", "43", "42", "41"],
  },
  {
    id: "7.5",
    code: "str DB 'MADAM'\nrev DB 5 DUP(0)\nMOV SI, str+4\nMOV DI, rev\nMOV CX, 5\nREV_LOOP2:\nMOV AL, [SI]\nMOV [DI], AL\nDEC SI\nINC DI\nLOOP REV_LOOP2\nMOV SI, str\nMOV DI, rev\nMOV CX, 5\nCLD\nREPE CMPSB\nJZ IS_PAL\nMOV BL, 0\nJMP DONE_PAL5\nIS_PAL:\nMOV BL, 1\nDONE_PAL5:\nHLT",
    expectedReg: "B",
    expectedVal: "01",
  },

  {
    id: "8.1",
    code: "str DB 'HELLO$'\nMOV SI, str\nMOV BL, 0\nLEN_LOOP:\nCMP [SI], '$'\nJZ DONE_LEN\nINC BL\nINC SI\nJMP LEN_LOOP\nDONE_LEN:\nHLT",
    expectedReg: "B",
    expectedVal: "05",
  },
  {
    id: "8.2",
    code: "str DB 'ASSEMBLY$'\nMOV DI, str\nMOV AL, '$'\nMOV CX, 0FFFFh\nCLD\nREPNE SCASB\nMOV BX, 0FFFFh\nSUB BX, CX\nDEC BX\nHLT",
    expectedReg: "B",
    expectedVal: "0008",
  },
  {
    id: "8.3",
    code: "str DB 'NULL', 0\nMOV SI, str\nMOV BX, 0\nLEN_LOOP3:\nCMP [SI], 0\nJZ DONE_LEN3\nINC BX\nINC SI\nJMP LEN_LOOP3\nDONE_LEN3:\nHLT",
    expectedReg: "B",
    expectedVal: "0004",
  },
  {
    id: "8.4",
    code: "str DB 'FINDXHERE$'\nMOV SI, str\nMOV BL, 0\nIDX_LOOP:\nCMP [SI], 'X'\nJZ DONE_IDX\nINC BL\nINC SI\nJMP IDX_LOOP\nDONE_IDX:\nHLT",
    expectedReg: "B",
    expectedVal: "04",
  },
  {
    id: "8.5",
    code: "str DB 'ELEVATE$'\nMOV SI, str\nMOV BL, 0\nCNT_LOOP:\nMOV AL, [SI]\nCMP AL, '$'\nJZ DONE_CNT\nCMP AL, 'E'\nJNZ SKIP_CNT\nINC BL\nSKIP_CNT:\nINC SI\nJMP CNT_LOOP\nDONE_CNT:\nHLT",
    expectedReg: "B",
    expectedVal: "03",
  },

  {
    id: "9.1",
    code: "msg DB 'Hello DOS!$'\nMOV DX, msg\nMOV AH, 09h\nINT 21h\nHLT",
    checkConsole: true,
    expectedOutput: "Hello DOS!",
  },
  {
    id: "9.2",
    code: "MOV DL, 'A'\nMOV AH, 02h\nINT 21h\nHLT",
    checkConsole: true,
    expectedOutput: "A",
  },
  {
    id: "9.3",
    code: "MOV AH, 01h\nINT 21h\nHLT",
    inputReq: "Z",
    checkConsole: true,
    expectedOutput: "Z",
    expectedReg: "A",
    expectedVal: "5A",
  },
  {
    id: "9.4",
    code: "buf DB 10, 0, 10 DUP(0)\nMOV DX, buf\nMOV AH, 0Ah\nINT 21h\nHLT",
    inputReq: "Test",
    expectedMemOffset: 1,
    expectedMemVals: ["04", "54", "65", "73", "74", "0D"],
  },
  {
    id: "9.5",
    code: "MOV AH, 4Ch\nINT 21h\nHLT",
    checkConsole: true,
    expectedOutput: "[Program terminated successfully]",
  },
];

async function callBridge(action, args) {
  const res = await fetch("http://127.0.0.1:10086/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, args, session: "run-all-8086" }),
  });
  return res.json();
}

async function run() {
  console.log("Navigating...");
  await callBridge("navigate", {
    url: "http://localhost:5173",
    newTab: true,
    group_title: "8086 Automated Tests",
  });
  await new Promise((r) => setTimeout(r, 2000));

  console.log("Entering Compiler View...");
  await callBridge("evaluate", {
    code: `
    const btns = Array.from(document.querySelectorAll('.yj-nav-icon-btn'));
    const btn = btns.find(b => b.title === 'Compiler View');
    if (btn) btn.click();
  `,
  });
  await new Promise((r) => setTimeout(r, 1000));

  let results = [];

  for (let exp of experiments) {
    console.log(`Running Experiment ${exp.id}...`);

    await callBridge("evaluate", {
      code: `document.querySelector('.yj-tutorial-step-stop')?.click()`,
    });
    await new Promise((r) => setTimeout(r, 200));

    const injectedCodeRes = await callBridge("evaluate", {
      code: `(() => {
         const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
         setter.call(document.querySelector('.yj-code-textarea'), \`${exp.code.replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\`);
         document.querySelector('.yj-code-textarea').dispatchEvent(new Event('input', { bubbles: true }));
         document.querySelector('.yj-btn-compile-primary').click();
         return document.querySelector('.yj-code-textarea').value;
       })()`,
    });
    console.log(
      `Injected code for ${exp.id}: ${JSON.stringify(injectedCodeRes.data?.value)}`,
    );
    await new Promise((r) => setTimeout(r, 500));
    // Check for compile errors
    const errRes = await callBridge("evaluate", {
      code: `document.querySelector('.yj-compiler-errors')?.innerText`,
    });
    if (errRes.data?.value) {
      console.log(`Compiler error for ${exp.id}:`, errRes.data.value);
    }

    // Run synchronously via exposed emulator
    const regAfterStr = await callBridge("evaluate", {
      code: `(() => {
       let limit = 5000;
       try {
         while (window.emulator && !window.emulator.state.halted && limit > 0) {
           if (window.emulator.state.awaitingInput) break;
           window.emulator.step();
           limit--;
         }
       } catch(e) {
         console.error(e);
         return "STEP ERROR: " + e.message;
       }
       if (window.forceUpdateCpu) window.forceUpdateCpu();
       return JSON.stringify(window.emulator?.state?.registers);
     })()`,
    });
    console.log(
      `Registers after execution for ${exp.id}: ${regAfterStr.data?.value}`,
    );
    await new Promise((r) => setTimeout(r, 200));

    if (exp.inputReq) {
      await callBridge("evaluate", {
        code: `(() => { const el = document.querySelector('.yj-input-field'); const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; setter.call(el, '${exp.inputReq}'); el.dispatchEvent(new Event('change', { bubbles: true })); })()`,
      });
      await callBridge("click", { selector: ".yj-input-submit-btn" });
      await new Promise((r) => setTimeout(r, 200));

      await callBridge("evaluate", {
        code: `(() => {
         let limit = 5000;
         while (window.emulator && !window.emulator.state.halted && limit > 0) {
           window.emulator.step();
           limit--;
         }
         if (window.forceUpdateCpu) window.forceUpdateCpu();
       })()`,
      });
      await new Promise((r) => setTimeout(r, 200));
    }

    // Wait for execution to finish
    await new Promise((r) => setTimeout(r, 1500));
    let halted = true;

    if (!halted) {
      results.push(`- [ ] ${exp.id}: FAILED (Timeout)`);
      continue;
    }

    let pass = true;
    let failReason = "";

    if (exp.expectedReg) {
      const regRes = await callBridge("evaluate", {
        code: `
         (() => {
           const rows = Array.from(document.querySelectorAll('.yj-table-row'));
           const r = rows.find(x => x.querySelector('.yj-cell-lbl')?.innerText.trim() === '${exp.expectedReg}');
           if (!r) return null;
           const vals = r.querySelectorAll('.yj-cell-val');
           return vals[0].innerText.trim() + vals[1].innerText.trim();
         })()
       `,
      });
      const actVal = regRes.data?.value;
      const match =
        actVal ===
          (exp.expectedVal.length === 2
            ? "00" + exp.expectedVal
            : exp.expectedVal) ||
        actVal === exp.expectedVal ||
        (actVal &&
          actVal.endsWith(exp.expectedVal) &&
          exp.expectedVal.length === 2);
      if (!match) {
        pass = false;
        failReason += `Reg ${exp.expectedReg} expected ${exp.expectedVal} got ${actVal}. `;
      }
    }

    if (exp.expectedMemVals) {
      const memRes = await callBridge("evaluate", {
        code: `
         (() => {
           if (!window.emulator) return "";
           const mem = window.emulator.state.memory;
           let result = [];
           const ds = window.emulator.state.registers.DS;
           const baseOffset = ds * 16 + 0x0100;
           for (let i = 0; i < ${exp.expectedMemVals.length}; i++) {
             const val = mem[baseOffset + ${exp.expectedMemOffset} + i] || 0;
             result.push(val.toString(16).padStart(2, '0').toUpperCase());
           }
           return result.join(',');
         })()
       `,
      });
      const expectedStr = exp.expectedMemVals.join(",");
      if (memRes.data?.value !== expectedStr) {
        pass = false;
        failReason += `Mem expected ${expectedStr} got ${memRes.data?.value}. `;
      }

      await callBridge("evaluate", {
        code: `document.querySelector('.yj-tab-btn:nth-child(1)').click()`,
      });
    }

    if (exp.checkConsole) {
      const outRes = await callBridge("evaluate", {
        code: `document.querySelector('.yj-output-text')?.innerText || ''`,
      });
      if (!outRes.data?.value?.includes(exp.expectedOutput)) {
        pass = false;
        failReason += `Output expected ${exp.expectedOutput} not in ${outRes.data?.value}. `;
      }
    }

    if (pass) {
      results.push(`- [x] ${exp.id}: PASSED`);
    } else {
      results.push(`- [ ] ${exp.id}: FAILED - ${failReason}`);
    }
  }

  fs.writeFileSync(
    "kimi_webbridge_test_results.md",
    "# Kimi WebBridge E2E Test Results\n\n" + results.join("\n"),
  );
  console.log("Done.");
}

run().catch(console.error);
