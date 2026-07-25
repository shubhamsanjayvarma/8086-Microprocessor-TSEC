# Testing Template — Reusable Agent Instructions

> **Purpose:** This document is a reusable, project-agnostic template containing structured instructions for an AI coding agent to execute four categories of testing. Copy this file into any project's `spec/` or `.agents/` directory and reference it when initiating a testing phase.

---

## General Rules (Apply to ALL Testing Types)

### Workflow: Plan → Execute → Log

Every testing phase MUST follow this exact three-stage workflow without exception.

#### Stage 1: Plan

- Use Graphify (or equivalent knowledge graph) as the primary codebase research tool. Do NOT grep randomly.
- Produce a detailed, milestone-based implementation plan before writing or running a single test.
- The plan MUST be structured by component (e.g., Compiler → Emulator → UI), not random.
- Each milestone MUST include:
  - Specific files and functions under test
  - Exact assertions and expected outcomes
  - Guardrails (timeouts, resource limits)
  - Cyber attack test cases referencing STRIDE / OWASP Top 10 where applicable
- Present the plan for review before proceeding to execution.

#### Stage 2: Execute

- Proceed milestone-by-milestone in strict order. Do NOT jump between components.
- For each milestone:
  - Write test files first (TDD — tests before fixes).
  - Run the tests.
  - If a test fails, fix the source code, then re-run until the milestone passes.
  - Only move to the next milestone after achieving 0 failures in the current one.
- After all milestones pass, run the full test suite to confirm 0 regressions.
- The goal is always **100% pass rate with zero errors**.

#### Stage 3: Log

- Whenever the agent makes a mistake or encounters an unexpected error during execution:
  - Log the error in `telemetry/error_log.md` with a description and the exact code or procedure that caused it.
  - Immediately update the project's `AGENTS.md` (or equivalent rules file) with a new rule describing what to avoid in the future.
- After all testing is complete, update the knowledge graph (`graphify update .` or equivalent).
- Produce a final report in `spec/` summarizing results.

---

## Testing Type 1: Space & Time Complexity

### Objective

Measure and verify the computational complexity (Big-O) of every major feature and function. Identify what is efficient, what is inefficient, and how to improve it.

### Instructions

```yaml
research_phase:
  - Query the knowledge graph for all exported functions, classes, and their call graphs.
  - Identify the hot paths: which functions are called most frequently at runtime.
  - For each function, hypothesize its time and space complexity from the source code.

plan_structure:
  milestones:
    - name: "Component N: [Component Name]"
      tests:
        - type: "Time Complexity (Happy Path)"
          description: >
            Generate a large-scale input (e.g., 10,000 items) and measure
            wall-clock execution time using performance.now(). Assert that
            execution completes within a strict upper bound (e.g., <100ms).
          goal: "Prove O(N) or O(1) scaling."

        - type: "Space Complexity (Edge Case)"
          description: >
            Stress-test memory allocation patterns. For example, run 1,000,000
            iterations of a loop and verify that auxiliary memory usage does
            not grow unboundedly (e.g., stack pointer wraps, no new heap
            allocations per iteration).
          goal: "Prove O(1) auxiliary space or O(N) proportional space."

        - type: "Cyber Attack (Denial of Service)"
          description: >
            Craft adversarial inputs designed to trigger worst-case complexity
            (e.g., ReDoS via nested regex, hash collision floods, deeply
            recursive structures). Assert the system completes within the
            time bound or rejects the input gracefully.
          goal: "Prove resilience against algorithmic complexity attacks."

execution_rules:
  - Use the test framework's built-in performance measurement (e.g., performance.now()).
  - Set strict upper-bound assertions (not averages — worst-case guarantees).
  - If a function exceeds its complexity budget, fix the implementation first, then re-test.

report_output: "spec/space_time_complexity_report.md"
```

---

## Testing Type 2: Logic Testing

### Objective

Verify the internal correctness of all code logic — what connects to what, why, data flow integrity, API contracts, and absence of dangerous leaked calls or dangling connections.

### Instructions

```yaml
research_phase:
  - Query the knowledge graph for all module boundaries, exports, and imports.
  - Map every data structure and trace where it flows between modules.
  - Identify all state mutations (especially mutable shared state).
  - Identify all trust boundaries (where user input enters and how far it propagates).

plan_structure:
  milestones:
    - name: "Milestone N: [Subsystem Name]"
      test_categories:
        - category: "Instruction/Function Correctness"
          description: >
            For each exported function, write unit tests asserting correct
            output for known inputs. Cover the happy path, boundary values,
            and invalid inputs.

        - category: "Data Flow & Contract Testing"
          description: >
            Verify that data structures passed between modules arrive intact.
            Assert types, shapes, and values at module boundaries. Verify
            that internal state mutations do not leak side effects.

        - category: "State Synchronization"
          description: >
            If the project has a UI or stateful runtime, verify that internal
            state and displayed/exposed state remain in sync after every
            mutation cycle.

        - category: "Edge Cases & Failure Modes"
          description: >
            Test empty inputs, maximum-length inputs, duplicate entries,
            overflow/underflow, division by zero, and any domain-specific
            edge cases. Each must either produce a correct result or a
            clean, descriptive error — never a silent failure or crash.

        - category: "Dead Code & Leak Audit"
          description: >
            Identify any debug files, unused exports, placeholder code, or
            development artifacts that should not ship. Flag them in the report.

execution_rules:
  - Every assertion must trace to a specific requirement or behavioral contract.
  - If a logic bug is found, write the failing test first, then fix the code (TDD).
  - Do NOT skip a failing test by weakening the assertion. Fix the source.

report_output: "spec/logic_testing_report.md"
```

---

## Testing Type 3: Codebase Security Review

### Objective

Audit the codebase for vulnerabilities using the STRIDE threat model and OWASP Top 10 framework. Test every identified attack surface with concrete exploit attempts.

### Instructions

```yaml
research_phase:
  - Query the knowledge graph for all entry points where external/user data enters the system.
  - Map the trust boundaries — where does validated data become unvalidated.
  - Identify all cryptographic operations, authentication logic, and authorization checks.
  - Review build configuration, CI/CD pipelines, and dependency manifests for supply chain risks.

plan_structure:
  milestones:
    - name: "Milestone N: [Attack Surface Name]"
      stride_mapping:
        - threat: "Spoofing"
          test: >
            Attempt to forge identity or impersonate a trusted component.
            Example: inject a crafted AST bypassing the compiler's validation.

        - threat: "Tampering"
          test: >
            Modify data in transit or at rest.
            Example: poison instruction opcodes, corrupt memory arrays,
            alter configuration at runtime.

        - threat: "Repudiation"
          test: >
            Verify that critical actions are logged and attributable.
            Example: ensure error logs capture the exact failing input.

        - threat: "Information Disclosure"
          test: >
            Attempt to read memory out of bounds, extract internal state
            through error messages, or access data beyond authorization.

        - threat: "Denial of Service"
          test: >
            Craft inputs that cause the application to hang, crash, or
            consume unbounded resources. Example: infinite loops, ReDoS,
            stack overflow via deep recursion.

        - threat: "Elevation of Privilege"
          test: >
            Attempt to execute operations beyond the intended permission
            level. Example: bypass input validation to execute arbitrary
            code or access restricted APIs.

      owasp_mapping:
        - "Injection (SQL, XSS, Command Injection)"
        - "Broken Authentication (if applicable)"
        - "Sensitive Data Exposure"
        - "Security Misconfiguration (build config, CI/CD secrets)"
        - "Vulnerable Dependencies (npm audit, known CVEs)"

execution_rules:
  - For each identified threat, write a concrete test that attempts the exploit.
  - The test MUST either prove the system rejects the attack (pass) or expose the vulnerability (fail).
  - If a vulnerability is found, patch it immediately, then re-run the test to confirm the fix.
  - Review all dependencies for known vulnerabilities (e.g., npm audit, Snyk).
  - Review CI/CD configuration for secret leaks, unsafe script injection, or missing validation steps.

report_output: "spec/codebase_security_review_report.md"
```

---

## Testing Type 4: QA Testing

### Objective

Validate the application from a user's perspective. Test every feature with multiple input combinations, edge cases, and real browser interactions to ensure the product works as expected.

### Instructions

```yaml
research_phase:
  - Query the knowledge graph for all user-facing features and UI components.
  - List every interactive element (buttons, inputs, dropdowns, viewers).
  - Identify all user workflows (e.g., write code → compile → step → view output).
  - Map the combinations: what happens when features interact with each other.

plan_structure:
  milestones:
    - name: "Milestone N: [Feature Area]"
      test_categories:
        - category: "Happy Path"
          description: >
            Execute the standard user workflow end-to-end and verify
            expected output at each step.

        - category: "Boundary Inputs"
          description: >
            Test with empty input, maximum-length input, special characters,
            Unicode, and whitespace-only input.

        - category: "Error Recovery"
          description: >
            Trigger every error state (invalid syntax, runtime errors,
            missing data) and verify that the application displays a
            clear, helpful error message and remains usable.

        - category: "Interaction Combinations"
          description: >
            Test sequences that users might realistically attempt:
            compile then immediately reset, step rapidly 100 times,
            edit code while execution is paused, resize the window
            during rendering.

        - category: "Visual & Layout"
          description: >
            Verify that the UI renders correctly across different viewport
            sizes. Check for overflow, clipping, misaligned elements,
            and broken layouts.

        - category: "Browser-Based Validation (if applicable)"
          description: >
            Use a real browser automation tool (e.g., Chrome DevTools MCP,
            Playwright, Kimi WebBridge) to interact with the live
            application and verify DOM state, console errors, and
            network requests.

execution_rules:
  - Test in the actual runtime environment (browser, Node, etc.), not just unit tests.
  - If browser-based testing is available, use it for DOM and visual checks.
  - Every error message shown to the user must be verified for clarity and accuracy.
  - If a QA defect is found, write a regression test, fix the code, then re-test.

report_output: "spec/qa_testing_report.md"
```

---

## Quick Reference: Agent Invocation Prompt

When starting a testing phase, use the following prompt structure (fill in the blanks):

```
1. Since there are many tests, I want you to go [component/milestone]-wise
   in ordered manner rather than doing random tests.
2. Follow @[.agents/AGENTS.md] — as mentioned in that file, whenever during
   testing you make an error, you must log it and self-update AGENTS.md.

/goal Your goal is to complete all the tests and fix all the issues. The
final report should be 100% pass without any error.

Testing type: [space-time-complexity | logic | security | qa]
Refer to: spec/template_testing.md
```

---

## Checklist: Verifying Completeness

After each testing phase, confirm every item:

- [ ] Plan was created and approved before any test was written.
- [ ] Tests were executed milestone-by-milestone in strict order.
- [ ] Every failure was fixed at the source (no weakened assertions).
- [ ] Full test suite was run at the end with 0 failures.
- [ ] All errors encountered by the agent were logged in `telemetry/error_log.md`.
- [ ] `AGENTS.md` was updated with any new rules learned from mistakes.
- [ ] Knowledge graph was updated (`graphify update .` or equivalent).
- [ ] Final report was written to the appropriate file in `spec/`.
