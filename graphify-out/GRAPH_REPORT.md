# Graph Report - 8086 (2026-07-25)

## Corpus Check

- 105 files · ~89,825 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 981 nodes · 1007 edges · 66 communities (58 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `3658a811`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]

## God Nodes (most connected - your core abstractions)

1. `Emulator` - 22 edges
2. `Code Review and Quality` - 19 edges
3. `compilerOptions` - 18 edges
4. `compile8086()` - 17 edges
5. `Logger` - 17 edges
6. `Security and Hardening` - 16 edges
7. `compilerOptions` - 15 edges
8. `Git Workflow and Versioning` - 15 edges
9. `Product Requirements Document (PRD)` - 15 edges
10. `Product Requirements Document (PRD)` - 15 edges

## Surprising Connections (you probably didn't know these)

- `App()` --calls--> `initialCPUState()` [EXTRACTED]
  src/App.tsx → src/utils/emulator.ts
- `Emulator` --references--> `ParsedInstruction` [EXTRACTED]
  src/utils/emulator.ts → src/utils/compiler.ts

## Import Cycles

- None detected.

## Communities (66 total, 8 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.10
Nodes (20): App(), ViewMode, compile8086(), CompilerResult, encodeInstruction(), Operand, OperandType, ParsedInstruction (+12 more)

### Community 1 - "Community 1"

Cohesion: 0.05
Nodes (38): husky.sh script, dependencies, lucide-react, react, react-dom, devDependencies, happy-dom, husky (+30 more)

### Community 2 - "Community 2"

Cohesion: 0.07
Nodes (29): 1. Correctness, 2. Readability & Simplicity, 3. Architecture, 4. Security, 5. Performance, Change Descriptions, Change Sizing, Code Review and Quality (+21 more)

### Community 3 - "Community 3"

Cohesion: 0.07
Nodes (29): Always Do (No Exceptions), Ask First (Requires Human Approval), Broken Access Control, Broken Authentication, Common Rationalizations, Cross-Site Scripting (XSS), File Upload Safety, Injection (SQL, NoSQL, OS Command) (+21 more)

### Community 4 - "Community 4"

Cohesion: 0.07
Nodes (28): Automated Tests, Background, Component 1: Test Infrastructure Setup, Component 2: Compiler Tests, Component 3: Emulator Tests, Component 4: Examples Integration Tests, Component 5: Cyber Attack / Security Tests, Component 6: Pre-Commit Hooks (Husky + lint-staged) (+20 more)

### Community 5 - "Community 5"

Cohesion: 0.07
Nodes (28): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Name Tests Descriptively, One Assertion Per Concept, Overview, Prefer Real Implementations Over Mocks (+20 more)

### Community 6 - "Community 6"

Cohesion: 0.07
Nodes (26): 1. Commit Early, Commit Often, 2. Atomic Commits, 3. Descriptive Messages, 4. Keep Concerns Separate, 5. Size Your Changes, Branch Naming, Branching Strategy, Change Summaries (+18 more)

### Community 7 - "Community 7"

Cohesion: 0.08
Nodes (24): Accessibility Verification with DevTools, Available Tools, Browser Testing with DevTools, Clean Console Standard, Common Rationalizations, Console Analysis Patterns, Content Boundary Markers, For Network Issues (+16 more)

### Community 8 - "Community 8"

Cohesion: 0.08
Nodes (24): Accessibility, Code Quality, Common Rationalizations, Documentation, Error Reporting, Feature Flag Strategy, Infrastructure, Monitoring and Observability (+16 more)

### Community 9 - "Community 9"

Cohesion: 0.08
Nodes (23): 1. Contract First, 2. Consistent Error Semantics, 3. Validate at Boundaries, 4. Prefer Addition Over Modification, 5. Predictable Naming, API and Interface Design, Common Rationalizations, Core Principles (+15 more)

### Community 10 - "Community 10"

Cohesion: 0.08
Nodes (23): Automation Beyond CI, Basic CI Pipeline, Build Cop Role, CI/CD and Automation, CI Optimization, Common Rationalizations, Dependabot / Renovate, Deployment Strategies (+15 more)

### Community 11 - "Community 11"

Cohesion: 0.08
Nodes (23): Accessibility (WCAG 2.1 AA), ARIA Labels, Avoid the AI Aesthetic, Color, Common Rationalizations, Component Architecture, Component Patterns, Design System Adherence (+15 more)

### Community 12 - "Community 12"

Cohesion: 0.08
Nodes (23): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+15 more)

### Community 13 - "Community 13"

Cohesion: 0.09
Nodes (22): Anti-Patterns, Common Rationalizations, Confusion Management, Context Engineering, Context Packing Strategies, Level 1: Rules Files, Level 2: Specs and Architecture, Level 3: Relevant Source Files (+14 more)

### Community 14 - "Community 14"

Cohesion: 0.09
Nodes (22): Adapter Pattern, Code Is a Liability, Common Rationalizations, Compulsory vs Advisory Deprecation, Core Principles, Deprecation and Migration, Deprecation Planning Starts at Design Time, Feature Flag Migration (+14 more)

### Community 15 - "Community 15"

Cohesion: 0.09
Nodes (22): Common Rationalizations, Contract-First Slicing, Implementation Rules, Increment Checklist, Incremental Implementation, Overview, Red Flags, Risk-First Slicing (+14 more)

### Community 16 - "Community 16"

Cohesion: 0.09
Nodes (21): 1. Preserve Behavior Exactly, 2. Follow Project Conventions, 3. Prefer Clarity Over Cleverness, 4. Maintain Balance, 5. Scope to What Changed, Code Simplification, Common Rationalizations, Language-Specific Guidance (+13 more)

### Community 17 - "Community 17"

Cohesion: 0.09
Nodes (21): Build Failure Triage, Common Rationalizations, Debugging and Error Recovery, Error-Specific Patterns, Instrumentation Guidelines, Overview, Red Flags, Runtime Error Triage (+13 more)

### Community 18 - "Community 18"

Cohesion: 0.10
Nodes (20): ADR Lifecycle, ADR Template, API Documentation, Architecture Decision Records (ADRs), Changelog Maintenance, Common Rationalizations, Document Known Gotchas, Documentation and ADRs (+12 more)

### Community 19 - "Community 19"

Cohesion: 0.10
Nodes (20): Common Rationalizations, Core Web Vitals Targets, Large Bundle Size, Missing Caching (Backend), Missing Image Optimization (Frontend), N+1 Queries (Backend), Overview, Performance Budget (+12 more)

### Community 20 - "Community 20"

Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 21 - "Community 21"

Cohesion: 0.11
Nodes (17): Example 1: Vague Early-Stage Concept (Full 3-Phase Session), Example 2: Feature Idea Within an Existing Product (Codebase-Aware), Example 3: Process/Workflow Idea (Non-Product), Ideation Session Examples, Key Assumptions to Validate, MVP Scope, Not Doing (and Why), Open Questions (+9 more)

### Community 22 - "Community 22"

Cohesion: 0.11
Nodes (17): Common Rationalizations, Example, Interaction with Other Skills, Interview Me, Loading Constraints, Output, Overview, Red Flags (+9 more)

### Community 23 - "Community 23"

Cohesion: 0.11
Nodes (17): Common Rationalizations, Output Files, Overview, Parallelization Opportunities, Plan Document Template, Planning and Task Breakdown, Red Flags, See Also (+9 more)

### Community 24 - "Community 24"

Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 25 - "Community 25"

Cohesion: 0.12
Nodes (15): Common Rationalizations, Cross-model escalation, Doubt-Driven Development, Interaction with Other Skills, Loading Constraints, Overview, Red Flags, Step 1: CLAIM — Surface what stands (+7 more)

### Community 26 - "Community 26"

Cohesion: 0.12
Nodes (15): 10. Assumptions & Constraints, 11. Dependencies, 12. Risks & Open Questions, 13. Timeline / Milestones, 14. Appendix, 1. Title & Summary, 2. Problem Statement, 3. Goals & Success Metrics (+7 more)

### Community 27 - "Community 27"

Cohesion: 0.12
Nodes (15): 10. Assumptions & Constraints, 11. Dependencies, 12. Risks & Open Questions, 13. Timeline / Milestones, 14. Appendix, 1. Title & Summary, 2. Problem Statement, 3. Goals & Success Metrics (+7 more)

### Community 28 - "Community 28"

Cohesion: 0.13
Nodes (14): Anti-patterns to Avoid, Detailed Instructions, How It Works, Idea Refine, Output, Phase 1: Understand & Expand (Divergent), Phase 2: Evaluate & Converge, Phase 3: Sharpen & Ship (+6 more)

### Community 29 - "Community 29"

Cohesion: 0.13
Nodes (14): 1. Define "working" before instrumenting, 2. Pick the right signal for each question, 3. Structured logging, 4. Metrics, 5. Distributed tracing, 6. Alerting, 7. Verify the telemetry itself, Common Rationalizations (+6 more)

### Community 30 - "Community 30"

Cohesion: 0.13
Nodes (14): 1. Surface Assumptions, 2. Manage Confusion Actively, 3. Push Back When Warranted, 4. Enforce Simplicity, 5. Maintain Scope Discipline, 6. Verify, Don't Assume, Core Operating Behaviors, Failure Modes to Avoid (+6 more)

### Community 31 - "Community 31"

Cohesion: 0.15
Nodes (12): Common Rationalizations, Keeping the Spec Alive, Overview, Phase 1: Specify, Phase 2: Plan, Phase 3: Tasks, Phase 4: Implement, Red Flags (+4 more)

### Community 32 - "Community 32"

Cohesion: 0.17
Nodes (11): 1. User Value, 2. Feasibility, 3. Differentiation, Assumption Audit, Core Evaluation Dimensions, Decision Framework, Might Be True (Nice to Have), Must Be True (Dealbreakers) (+3 more)

### Community 33 - "Community 33"

Cohesion: 0.17
Nodes (11): Common Rationalizations, Overview, Red Flags, Source-Driven Development, Step 1: Detect Stack and Versions, Step 2: Fetch Official Documentation, Step 3: Implement Following Documented Patterns, Step 4: Cite Your Sources (+3 more)

### Community 34 - "Community 34"

Cohesion: 0.22
Nodes (8): Agent Idea Discovery & Validation — Execution Spec, Milestone 0 — Scope Lock (do this first, don't skip), Milestone 1 — Parallel Discovery (one subagent per field), Milestone 2 — Idea Bank Compilation, Milestone 3 — Validation Rubric Definition, Milestone 4 — Parallel Validation Research, Milestone 5 — Final Ranked Output, Run Order Summary

### Community 35 - "Community 35"

Cohesion: 0.22
Nodes (8): Analogous Inspiration, Constraint-Based Ideation, First Principles Thinking, How Might We (HMW), Ideation Frameworks Reference, Jobs to Be Done (JTBD), Pre-mortem, SCAMPER

### Community 36 - "Community 36"

Cohesion: 0.25
Nodes (7): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 37 - "Community 37"

Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 38 - "Community 38"

Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 39 - "Community 39"

Cohesion: 0.20
Nodes (9): 2026-07-24: Example Code Bug, 2026-07-24: Incomplete Emulator Jump Instruction Set, 2026-07-24: Invalid Unicode escape sequence in TypeScript, 2026-07-24: Memory Displacement Parsing, 2026-07-24: Memory Size Inference Bug, 2026-07-24: Test Assertions on Clobbered Registers, 2026-07-25: CI Performance Bounds Timeout, 2026-07-25: Oxlint `eslint-disable` Directive Placement (+1 more)

### Community 40 - "Community 40"

Cohesion: 0.40
Nodes (4): 1. Microsoft STRIDE Framework, 2. OWASP Top 10, Cyber Security Frameworks, Implementation Guidelines for TDD

### Community 41 - "Community 41"

Cohesion: 0.25
Nodes (7): 💻 8086 Microprocessor Simulator (TSEC), 👥 Contributors, ✨ Features, 🚀 Getting Started, Installation & Local Setup, 📜 License, Prerequisites

### Community 42 - "Community 42"

Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 43 - "Community 43"

Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 44 - "Community 44"

Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 56 - "Community 56"

Cohesion: 0.07
Nodes (29): Arithmetic Instructions, Combinatorial Scenarios, Combinatorial Scenarios, Console Output, Control Flow — All Conditional Jumps, Cross-Example Combinations, Data Transfer Instructions, Error Handling Tests (+21 more)

### Community 57 - "Community 57"

Cohesion: 0.13
Nodes (14): Component 1: Compiler (`compile8086`), Component 2: Emulator Execution (`Emulator.step`), Component 3: UI State Management (`App.tsx`), Component 4: Telemetry & Logging (`Logger`), Overview, Space Complexity, Space Complexity, Space Complexity (+6 more)

### Community 58 - "Community 58"

Cohesion: 0.22
Nodes (8): 1. Regex Denial of Service (ReDoS) [STRIDE: Denial of Service], 2. Instruction Opcodes & Fallthrough [STRIDE: Tampering], 3. Memory Out of Bounds Spoofing [STRIDE: Information Disclosure], 4. Cross-Site Scripting (XSS) [OWASP: Injection], 5. Log Injection & Context Masking [OWASP: Log Injection / STRIDE: Information Disclosure], Codebase Security Review Report, Cyber Attack Mitigation Results, Overview

### Community 59 - "Community 59"

Cohesion: 0.22
Nodes (8): 1. Interface Constraints & Boundary Inputs, 2. Browser Integration checks, 3. Edge Case Assertions, 4. Error Boundaries & Telemetry, Conclusion, Overview, QA Testing Report, Test Areas Executed

### Community 60 - "Community 60"

Cohesion: 0.29
Nodes (6): 1. Compiler Instruction Logic, 2. Emulator Instruction Logic, 3. Data Synchronization (App Contract), 4. Telemetry & Error Boundaries, Logic Testing Report, Overview

### Community 61 - "Community 61"

Cohesion: 0.10
Nodes (20): Checklist: Verifying Completeness, General Rules (Apply to ALL Testing Types), Instructions, Instructions, Instructions, Instructions, Objective, Objective (+12 more)

### Community 64 - "Community 64"

Cohesion: 0.11
Nodes (7): ErrorBoundary, Props, State, LogEntry, Logger, LogLevel, REDACTED_KEYS

### Community 65 - "Community 65"

Cohesion: 0.25
Nodes (7): 1. Objective, 2. Test Execution Details, 3. Conclusion, Milestone 1: Structural UI Sanity, Milestone 2: Pre-Commit Hook Strictness, Milestone 3: CI Performance Scaling (UI Deep Cloning), UI Integration & Layout Testing Report

## Knowledge Gaps

- **699 isolated node(s):** `idea-refine.sh script`, `husky.sh script`, `$schema`, `plugins`, `react/rules-of-hooks` (+694 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `Community 64` to `Community 0`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `idea-refine.sh script`, `husky.sh script`, `$schema` to the rest of the system?**
  _699 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10459183673469388 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
