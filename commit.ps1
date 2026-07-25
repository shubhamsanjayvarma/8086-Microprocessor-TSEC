git add .gitignore README.md package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts .oxlintrc.json
git commit -m "chore: initialize project architecture and build configurations"

git add index.html public/ src/main.tsx src/App.tsx src/App.css src/index.css src/assets/
git commit -m "feat(ui): implement React frontend, layout styles, and assets"

git add src/utils/compiler.ts
git commit -m "feat(compiler): implement two-pass 8086 assembly parser and byte encoder"

git add src/utils/emulator.ts
git commit -m "feat(emulator): implement 8086 CPU runtime, memory limits, and instruction set"

git add src/utils/examples.ts
git commit -m "feat: add default 8086 assembly code examples for UI"

git add .agents/AGENTS.md telemetry/error_log.md
git rm --cached agent/.gitkeep
git commit -m "chore(agents): establish dynamic project rules, remove placeholders, and add error telemetry"

git add .github/workflows/lint-and-test.yml .husky/pre-commit
git commit -m "ci: configure strict pre-commit hooks and Github Actions testing pipeline"

git add graphify-out/
git commit -m "docs(graphify): generate AST code knowledge graph for agent context"

git add tests/compiler/compiler.test.ts tests/logic/compiler-parsing.test.ts
git commit -m "test(compiler): add comprehensive parsing and label resolution unit tests"

git add tests/emulator/emulator.test.ts tests/logic/emulator-instructions.test.ts
git commit -m "test(emulator): add opcode execution, flag mutation, and math logic tests"

git add tests/examples/examples.test.ts tests/logic/data-flow.test.ts
git commit -m "test: add data flow bounds and default example integrity tests"

git add tests/logic/app-contract.test.tsx tests/logic/app-memory-validation.test.tsx tests/logic/memory-safety.test.ts
git commit -m "test(ui): add React state synchronization and physical memory bounds testing"

git add tests/security/security.test.ts tests/security/stride.test.ts
git commit -m "test(security): implement STRIDE threat models and OWASP injection tests"

git add tests/performance/compiler.perf.test.ts tests/performance/emulator.perf.test.ts tests/performance/ui.perf.test.tsx
git commit -m "test(perf): add Big-O time and space complexity performance benchmarks"
