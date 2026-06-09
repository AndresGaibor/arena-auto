# Arena Auto — Agent Guide

## 1. Project Objective

Convert `arena-auto` into a professional Arena Simulation model generator using MCP + COM bridge.

The system can:
- Receive a structured model specification (ArenaModelSpec)
- Validate, normalize, and compile it
- Build the model in Arena via COM
- Run simulations
- Extract results
- Diagnose bottlenecks
- Compare scenarios
- Generate reports

## 2. Architecture

```
User / LLM
    ↓
ArenaModelSpec (JSON)
    ↓
validateSpec()      — validates structure & semantics
    ↓
compileSpec()       — compiles to build plan (steps)
    ↓
callBridge()        — executes steps via COM bridge
    ↓
Arena Simulation    — real Arena instance
    ↓
extractResults()    — reads SIMAN stats / report
    ↓
diagnose()          — detects bottlenecks, saturation
    ↓
report              — markdown report
```

### Directory Structure

```
src/
  arena-spec/       — Schema, validator, normalizer, compiler, modules
  bridge/           — MCP bridge client & protocol
  filesystem/       — Workspace-safe file tools
  mcp/              — MCP tool definitions & schemas
  results/          — Results extraction, diagnosis, reports
  scenarios/        — Experiment runner, comparator
  templates/        — Template loader & parameter expansion
  utils/            — Logger, helpers
  index.ts          — Main MCP server (tool dispatch)
bridge/
  index.cjs         — Bridge I/O loop & handler registry
  arena/            — COM interaction (lifecycle, modules, data, results, simulation)
templates/          — Model template JSON files
tests/
  unit/             — Unit tests
```

## 3. Build & Test Commands

```bash
bun install                    # Install dependencies
bun run bridge:check           # Validate bridge JS syntax
bun run check                  # TypeScript type check
bun test                       # Run all unit tests
bun test tests/unit/NAME       # Run specific test file
bun start                      # Start MCP server
```

## 4. Security Rules

- **NEVER** write files outside the configured workspace
- **NEVER** edit .doe files as raw text (they are binary COM objects)
- **NEVER** use stdout for MCP logs (use the logger module)
- **NEVER** leave placeholder handlers that return `ok: true` without real implementation
- **ALWAYS** validate paths with `isPathInWorkspace()` before file operations
- **ALWAYS** check `bridge:check` and `tsc` before committing

## 5. Implementation Order

Follow this exact order. Do NOT skip ahead.

```
1.  Phase 0  — Bridge stabilization          ✅ DONE
2.  Phase 1  — M/M/1 functional              ✅ DONE
3.  Phase 2  — ArenaModelSpec v0.2           ✅ DONE
4.  Phase 3  — Basic module compilers        ✅ DONE
5.  Phase 4  — Capability catalog            ✅ DONE
6.  Phase 6  — Templates                     ✅ DONE
7.  Phase 9  — Results & diagnosis           ✅ DONE
8.  Phase 10 — Scenarios & comparison        ✅ DONE
9.  Phase 5  — Resources, queues, schedules  ⏳ PENDING
10. Phase 7  — Intermediate modules          ⏳ PENDING
11. Phase 8  — Logistics & movement          ⏳ PENDING
12. Phase 11 — Auto-repair specs             ⏳ PENDING
13. Phase 12 — .doe template fallback        ⏳ PENDING
14. Phase 13 — SIMAN/VBA fallback            ⏳ PENDING
15. Phase 14 — Documentation                 ⏳ PENDING
```

## 6. What NOT To Do

- Do NOT add advanced modules if M/M/1 fails
- Do NOT skip validation — always check `validateSpec()` before building
- Do NOT create large PRs without tests
- Do NOT change the bridge protocol without updating both sides
- Do NOT use `any` types when proper types exist
- Do NOT add emojis to code or documentation
- Do NOT create documentation files unless explicitly asked

## 7. Definition of Done

A phase is complete when:
- All new code compiles (`bun run check`)
- Bridge syntax validates (`bun run bridge:check`)
- All tests pass (`bun test`)
- New functionality has unit tests
- No type errors

## 8. Commit Strategy

- One commit per phase
- Commit message format: `phase-N: short description`
- Include summary of changes in commit body
- Never commit secrets or environment files

## 9. Current State

- **Tests:** 175 passing across 14 files
- **MCP Tools:** 34 registered
- **Bridge Handlers:** 19 registered
- **Templates:** 7 JSON templates in 3 categories
- **Status:** `bun run check` clean, `bun run bridge:check` clean
