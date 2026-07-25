# Project Rules

Please add your custom instructions for this project below.

1. Think Before Coding
   Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask. 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
   Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
   Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
   Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

5. Graphify as Primary Knowledge Base
   STRICTLY avoid raw grepping and searching through the codebase. Instead, ALWAYS use Graphify as your primary source of codebase knowledge. Always use the knowledge graph in all cases unless there is an explicit need to refer to a particular code snippet directly.
   Furthermore:

- Every implementation plan MUST explicitly start the search phase with Graphify.
- At the end of implementation, when changes are made, the plan MUST explicitly mention updating the Graphify knowledge graph.

6. Specifications Format
   All specs must ONLY use the `.md` extension and the file structure when cross 3rd degree nesting should be then made into yaml format.

7. Structure and Features Detailing
   During the detailed explanation of features and when creating structures, ALWAYS use YAML instead of JSON.

8. Strict Test-Driven Development (TDD) and Security
   Before writing, changing, or touching even a single line of code, you MUST create a proper plan for implementation.
   All plans and procedures must adhere to "TEST DRIVEN DEVELOPMENT". This means you must ALWAYS include:

- Guardrails during the execution of code.
- Test scripts to check whether the code is working properly.
- Test scripts for edge cases and potential failures.
- Test scripts for testing cyber attacks on that code to verify vulnerability against hacks and malicious intent.
  For cyber attack test scripts, refer to the STRIDE framework, OWASP Top 10, and other established frameworks. Do not accumulate the explanations of these frameworks in this file to avoid context rot; instead, utilize the `cyber-security-frameworks` skill.

9. Error Logging and Continuous Learning
   Whenever you make a mistake or encounter an error during execution, you MUST log the mistake in `telemetry/error_log.md`. Include a description of the error and the exact procedure or code that caused it. Immediately after logging the error, you MUST dynamically update this `AGENTS.md` file by explicitly writing a new rule or instruction detailing the mistake and exactly what to avoid doing in the future to prevent recurrence.

10. Pre-Commit Hooks and Automation
    Whenever possible and structurally applicable, you MUST include a plan and scripts for pre-commit hooks (e.g., using Husky or native Git hooks). These hooks should automate our guardrails, testing, and formatting to ensure no code is permanently committed without passing the established validation and security checks.

# Project Rules

Please add your custom instructions for this project below.

1. Think Before Coding
   Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask. 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
   Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
   Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
   Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

5. Graphify as Primary Knowledge Base
   STRICTLY avoid raw grepping and searching through the codebase. Instead, ALWAYS use Graphify as your primary source of codebase knowledge. Always use the knowledge graph in all cases unless there is an explicit need to refer to a particular code snippet directly.
   Furthermore:

- Every implementation plan MUST explicitly start the search phase with Graphify.
- At the end of implementation, when changes are made, the plan MUST explicitly mention updating the Graphify knowledge graph.

6. Specifications Format
   All specs must ONLY use the `.md` extension and the file structure when cross 3rd degree nesting should be then made into yaml format.

7. Structure and Features Detailing
   During the detailed explanation of features and when creating structures, ALWAYS use YAML instead of JSON.

8. Strict Test-Driven Development (TDD) and Security
   Before writing, changing, or touching even a single line of code, you MUST create a proper plan for implementation.
   All plans and procedures must adhere to "TEST DRIVEN DEVELOPMENT". This means you must ALWAYS include:

- Guardrails during the execution of code.
- Test scripts to check whether the code is working properly.
- Test scripts for edge cases and potential failures.
- Test scripts for testing cyber attacks on that code to verify vulnerability against hacks and malicious intent.
  For cyber attack test scripts, refer to the STRIDE framework, OWASP Top 10, and other established frameworks. Do not accumulate the explanations of these frameworks in this file to avoid context rot; instead, utilize the `cyber-security-frameworks` skill.

9. Error Logging and Continuous Learning
   Whenever you make a mistake or encounter an error during execution, you MUST log the mistake in `telemetry/error_log.md`. Include a description of the error and the exact procedure or code that caused it. Immediately after logging the error, you MUST dynamically update this `AGENTS.md` file by explicitly writing a new rule or instruction detailing the mistake and exactly what to avoid doing in the future to prevent recurrence.

10. Pre-Commit Hooks and Automation
    Whenever possible and structurally applicable, you MUST include a plan and scripts for pre-commit hooks (e.g., using Husky or native Git hooks). These hooks should automate our guardrails, testing, and formatting to ensure no code is permanently committed without passing the established validation and security checks.

11. No Force Commits
    Under absolutely no circumstances should you ever use force commits (e.g., `git commit --no-verify`, `git push --force`) to bypass the pre-commit hooks or automated tests. If a commit is failing, the underlying code or test MUST be fixed before proceeding. If a pre-commit hook fails, you MUST stop, create a clear solving plan to address the failure, and then try again. Bypassing guardrails is strictly forbidden.

12. No Vague Plans (Strict Adherence to Structure)
    Whenever making an implementation plan or a detailed architectural spec, you MUST NOT make a vague or generic plan. You must strictly follow the required structure, particularly Rules #5 and #8. Every single plan document must independently and explicitly include its own Graphify Search/Update phases, Guardrails, TDD scripts, and Cyber Attack testing sections. Creating a separate, generic "testing" file instead of embedding these details into the specific component plans is a violation of this rule.

13. Strict Pre-Commit Hook Standards
    Whenever setting up or modifying pre-commit hooks, you MUST configure them with maximum strictness. NEVER write generic or weak hooks. You must ensure that the hooks proactively block commits by strictly checking types (e.g., `tsc --noEmit`), enforcing zero-tolerance linting (e.g., `--max-warnings=0`), and comprehensively running all associated test suites (including unit, integration, and security tests). Do not assume basic validation is enough; enforce the highest code quality standards directly in the automation pipeline.

14. Do Not Assert on Volatile Registers Post-Execution
    When writing tests for 8086 execution, do not assert on general-purpose registers (like `AX`) at the end of the program if the program includes OS/DOS interrupts (like `INT 21H`). Interrupts often clobber these registers (e.g. `AH=09H`). Always assert on the memory variables where the result is intentionally stored.

15. Complete Switch Statement Coverage for Opcodes
    When modifying or reviewing emulator execution loops, always verify that all variations of an instruction category (like conditional jumps: `JBE`, `JA`, `JL`, `JG`, `JE`, etc.) are explicitly handled. Missing opcodes must not silently fall through as NOPs.

16. Template Literal Escaping Error
    When writing TypeScript or JavaScript code using \write_to_file\, NEVER escape the dollar sign in template literals (e.g. use \${}, NOT \\${}). Doing so causes a PARSE_ERROR (Invalid Unicode escape sequence) in parsers like oxc.

17. Implicit Memory Size Override Inference
    When writing parsing logic for memory operands, ALWAYS ensure that the size (8-bit vs 16-bit) is explicitly passed down or inferred from the other operand (e.g., register size) in the AST. Failing to do so causes data corruption where 16-bit registers receive only 8 bits of memory data.

18. CI vs Local Performance Thresholds
    When writing time or space complexity performance tests using `performance.now()` bounds, NEVER assume that CI runners (like GitHub Actions) execute as fast as the local environment. Always set generous upper-bounds (e.g., 3x-5x local speeds) for `toBeLessThan` assertions and Vitest timeout durations to prevent flaky CI pipelines.

19. Oxlint `eslint-disable` Comment Placement
    When attempting to bypass a linter warning in `oxlint` (e.g., `react-hooks/exhaustive-deps`), the `// eslint-disable-next-line` directive MUST be placed on the exact line immediately preceding the target code structure (like the dependency array closing bracket `}, []);`). Placing it above a regular code comment will cause oxlint to ignore the directive and fail the build.

20. Feature Branch & PR Workflow (The Safety Net)
    NEVER develop new features or tests directly on the `main` branch.
    - **Local Isolation:** Always create a new branch (e.g., `feat/ui-updates`) for your work. If the code breaks irreparably or a massive conflict occurs locally, simply delete the branch and reset to `main`.
    - **Remote PRs:** When ready, push the branch and open a Pull Request. Never push directly to `main`.
    - **Reverting:** If an issue is discovered _after_ merging to `main`, do not attempt to manually track and revert individual scattered commits via the terminal. Instead, track the issue to the specific PR and use GitHub's 1-click "Revert Pull Request" feature to cleanly undo the entire feature block at once.
