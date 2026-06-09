# Architecture

## Overview

Arena Auto MCP is a Model Context Protocol server that controls Rockwell Automation Arena Simulation via COM Automation. It translates structured model specifications (ArenaModelSpec) into Arena models, runs simulations, extracts results, and generates diagnosis reports.

## System Layers

```
+------------------------------------------------------------------+
|                     MCP Server (TypeScript)                        |
|  src/index.ts -- tool dispatch, spec pipeline, results pipeline   |
+------------------------------------------------------------------+
          |  stdin/stdout JSON-RPC-like messages
          v
+------------------------------------------------------------------+
|                  Bridge (Node.js / winax)                          |
|  bridge/index.cjs -- I/O loop, handler registry                   |
|  bridge/arena/*.cjs -- COM interaction handlers                   |
+------------------------------------------------------------------+
          |  winax (ActiveX Object)
          v
+------------------------------------------------------------------+
|                  Arena.Application (COM)                           |
|  Create/Process/Dispose... modules, SIMAN variables, reports     |
+------------------------------------------------------------------+
```

### 1. MCP Server Layer (`src/`)

- **Entry point**: `src/index.ts` — registers 34 MCP tools, dispatches calls to bridge client or local modules
- **Tool defs**: `src/mcp/tools.ts` — tool definitions with names, descriptions, and JSON schemas
- **Schemas**: `src/mcp/schemas.ts` — JSON Schema definitions for all tool input parameters
- **Responses**: `src/mcp/responses.ts` — helper functions for structured MCP responses

### 2. Bridge COM Layer (`bridge/`)

- **Entry point**: `bridge/index.cjs` — stdin/stdout I/O loop, parses JSON requests, dispatches to handlers
- **Lifecycle**: `bridge/arena/lifecycle.cjs` — ActiveXObject creation, Arena open/close, model tracking
- **Models**: `bridge/arena/models.cjs` — model management (open, close, create, save)
- **Modules**: `bridge/arena/modules.cjs` — module operations (create, get/set property, connect, list)
- **Simulation**: `bridge/arena/simulation.cjs` — run model, set replication length
- **Results**: `bridge/arena/results.cjs` — extract results, export reports, read/write variables
- **Data**: `bridge/arena/data.cjs` — create entities, resources, queues, schedules, sets, failures
- **SIMAN**: `bridge/arena/siman.cjs` — SIMAN source, blocks, VBA macros

### 3. ArenaModelSpec Pipeline

The spec pipeline converts a structured JSON specification into an Arena model:

```
ArenaModelSpec (JSON)
       |
       v
  normalizeSpec()     -- sanitize IDs, resolve aliases, format time units
       |
       v
  validateSpec()      -- structural & semantic validation (34+ checks)
       |
       v
  compileSpec()       -- compile to build plan (ordered steps)
       |  - calculateLayout() -- auto-position modules on canvas
       |  - compileEntities/resources/queues/schedules/sets
       |  - compileCreate/Process/Dispose/Decide/Assign/etc (25 module types)
       |  - add connections, set replication length, save model
       v
  Build Plan          -- array of CompileStep/DataStep objects
       |
       v
  callBridge()        -- execute each step via COM bridge
       |
       v
  Arena Model         -- running in Arena.Application
```

**Components:**
- `src/arena-spec/schema.ts` — TypeScript types for ArenaModelSpec
- `src/arena-spec/validator.ts` — structural & semantic validation
- `src/arena-spec/normalizer.ts` — ID sanitization, name resolution
- `src/arena-spec/compiler.ts` — spec-to-plan compilation
- `src/arena-spec/modules/*.ts` — 25 module compilers (one per module type)
- `src/arena-spec/data/*.ts` — entity/resource/queue/schedule/set/failure compilers
- `src/arena-spec/layout.ts` — automatic canvas layout positioning
- `src/arena-spec/distributions.ts` — distribution validation & Arena expression formatting
- `src/arena-spec/units.ts` — time unit normalization & conversion
- `src/arena-spec/expression.ts` — SIMAN expression parsing
- `src/arena-spec/repair.ts` — auto-repair of common spec errors
- `src/arena-spec/explain-errors.ts` — human-readable error explanations
- `src/arena-spec/capability-catalog.ts` — COM capability discovery types

### 4. Results Processing Pipeline

```
Arena Model (after simulation)
       |
       v
  extractResults()    -- read SIMAN statistics via COM
       |  - entity metrics (number in/out, avg time, WIP)
       |  - queue metrics (avg/max length, wait time)
       |  - resource metrics (utilization, busy, idle)
       |  - variable metrics (final values)
       |  Falls back to CSV report parsing if SIMAN direct fails
       v
  SimulationMetrics    -- structured numeric results
       |
       v
  diagnose()           -- analyze for bottlenecks, saturation, congestion
       |  - resources >85% utilization flagged as bottlenecks
       |  - resources >95% flagged as saturated
       |  - queues with high avg/max flagged as congested
       |  - health score (0-100)
       v
  Diagnosis            -- issues + suggestions + score
       |
       v
  generateReport()     -- produce Markdown report
       |
       v
  Report               -- summary + diagnosis + markdown string
```

**Components:**
- `src/results/extractor.ts` — result extraction from bridge and CSV fallback
- `src/results/diagnosis.ts` — bottleneck/congestion detection
- `src/results/report.ts` — Markdown report generation
- `src/results/types.ts` — result data types

### 5. Scenarios System

```
ExperimentConfig (baseSpec + scenarios[])
       |
       v
  runExperiment()     -- for each scenario:
       |  1. applyPatches() -- deep-merge spec patches
       |  2. buildAndRun() -- compile, build in Arena, run, extract results
       |  3. diagnose() -- analyze results
       v
  ScenarioResult[]    -- results per scenario
       |
       v
  compare() / rank() / findBest()  -- cross-scenario comparison
       |
       v
  ExperimentReport    -- Markdown report with comparison tables, ranking
```

**Components:**
- `src/scenarios/runner.ts` — experiment orchestrator
- `src/scenarios/patcher.ts` — deep-merge patch application
- `src/scenarios/comparator.ts` — metric comparison & ranking
- `src/scenarios/types.ts` — scenario data types

### 6. Template System

```
listTemplates()       -- scan templates/ directory for JSON files
       |
       v
  TemplateMeta[]      -- id, name, description, category, params
       |
loadTemplate(id, params)  -- read JSON, replace {{param}} tokens
       |
       v
  ArenaModelSpec      -- ready for validation + compilation
```

**Components:**
- `src/templates/template-loader.ts` — template discovery, loading, parameter expansion
- `src/templates/doe-templates.ts` — .doe file template cloning

### 7. Filesystem Layer

- `src/filesystem/workspace.ts` — path validation, workspace root resolution
- `src/filesystem/reader.ts` — safe file reading with size limits
- `src/filesystem/writer.ts` — atomic write + patch application with backup
- `src/filesystem/diff.ts` — diff generation between current and proposed content
- `src/filesystem/backup.ts` — backup manifest management
- `src/filesystem/guards.ts` — binary file detection, size limits

### 8. SIMAN/VBA Client

- `src/siman/client.ts` — TypeScript wrappers around bridge SIMAN/VBA handlers
- `src/siman/types.ts` — SIMAN-related types

## Data Flow Diagram

```
                          +---------------------+
                          |   LLM / MCP Client   |
                          +----------+----------+
                                     |  MCP protocol (stdio)
                                     v
                          +---------------------+
                          |   src/index.ts      |
                          |   (tool dispatch)    |
                          +--+-------+--------+-+
                             |       |        |
               +-------------+       |        +--------------+
               v                     v                       v
     +-----------------+   +----------------+   +-------------------+
     | Arena Bridge    |   | File System    |   | Spec Pipeline     |
     | (bridge client) |   | (workspace)    |   | (validate/compile)|
     +--------+--------+   +--------+-------+   +---------+---------+
              |                      |                     |
              v                      v                     v
     +-----------------+   +----------------+   +-------------------+
     | bridge/index.cjs|   | .arena-auto/   |   | ArenaModelSpec    |
     | (COM bridge)    |   | backups/       |   | (validated JSON)  |
     +--------+--------+   +----------------+   +---------+---------+
              |                                           |
              v                                           v
     +-----------------+                           +-------------------+
     | Arena.Application|                          | Build Plan        |
     | (COM)            |                          | (ordered steps)   |
     +--------+---------+                          +---------+---------+
              |                                              |
              +--- createModule, setProperty, addConnection -+
              |
              v
     +-----------------+
     | Arena Model     |
     | (.doe + SIMAN)  |
     +--------+---------+
              |
              v
     +-----------------+
     | Run Simulation  |
     +--------+---------+
              |
              v
     +-----------------+
     | Extract Results |
     +--------+---------+
              |
              v
     +-----------------+
     | Diagnose / Reprt|
     +-----------------+
```

## Directory Structure

```
arena-mcp/
├── src/                          # TypeScript MCP server source
│   ├── index.ts                  # Main server (tool dispatch)
│   ├── mcp/
│   │   ├── tools.ts              # 34 MCP tool definitions
│   │   ├── schemas.ts            # Input JSON schemas
│   │   └── responses.ts          # Response helpers
│   ├── arena-spec/               # ArenaModelSpec pipeline
│   │   ├── schema.ts             # TypeScript types
│   │   ├── validator.ts          # 34+ validation checks
│   │   ├── normalizer.ts         # ID sanitization
│   │   ├── compiler.ts           # Spec to build plan
│   │   ├── layout.ts             # Auto-layout positioning
│   │   ├── distributions.ts      # Distribution validation & expressions
│   │   ├── units.ts              # Time unit handling
│   │   ├── expression.ts         # SIMAN expression parsing
│   │   ├── repair.ts             # Auto-repair common errors
│   │   ├── explain-errors.ts     # Human-readable error messages
│   │   ├── capability-catalog.ts # COM capability discovery types
│   │   ├── modules/              # 25 module compilers (create.ts, process.ts, etc.)
│   │   ├── data/                 # Data element compilers (entities, resources, etc.)
│   │   └── examples/             # Example specs (mm1.json, queueing.json, rework.json)
│   ├── bridge/
│   │   ├── client.ts             # Bridge process management & communication
│   │   └── errors.ts             # Bridge error types
│   ├── filesystem/
│   │   ├── workspace.ts          # Path validation
│   │   ├── reader.ts             # Safe file reading
│   │   ├── writer.ts             # Atomic writes & patches
│   │   ├── diff.ts               # Diff generation
│   │   ├── backup.ts             # Backup management
│   │   └── guards.ts             # Security guards
│   ├── results/
│   │   ├── extractor.ts          # Result extraction
│   │   ├── diagnosis.ts          # Bottleneck detection
│   │   ├── report.ts             # Markdown report generation
│   │   └── types.ts              # Result data types
│   ├── scenarios/
│   │   ├── runner.ts             # Experiment orchestrator
│   │   ├── patcher.ts            # Spec patching
│   │   ├── comparator.ts         # Cross-scenario comparison
│   │   └── types.ts              # Scenario types
│   ├── siman/
│   │   ├── client.ts             # SIMAN/VBA wrappers
│   │   └── types.ts              # SIMAN types
│   ├── templates/
│   │   ├── template-loader.ts    # Template loading & expansion
│   │   └── doe-templates.ts      # .doe template cloning
│   └── utils/
│       ├── logger.ts             # Structured logging (stderr + file)
│       └── paths.ts              # Path utilities
├── bridge/                       # Node.js COM bridge (CommonJS)
│   ├── index.cjs                 # I/O loop & handler registry
│   └── arena/
│       ├── lifecycle.cjs         # Arena open/close
│       ├── models.cjs            # Model management
│       ├── modules.cjs           # Module operations
│       ├── simulation.cjs        # Run/control simulation
│       ├── results.cjs           # Results & variables
│       ├── data.cjs              # Data element creation
│       └── siman.cjs             # SIMAN/VBA access
├── templates/                    # Model template JSON files
│   ├── queueing/                 # mm1.json, mmc.json, finite_capacity.json
│   ├── manufacturing/            # serial_line.json, quality_inspection.json, rework_loop.json
│   ├── advanced/                 # batching.json
│   └── services/                 # (empty, ready for service templates)
├── doe-templates/                # Pre-built .doe template files
├── tests/                        # Test suite
│   ├── unit/                     # 17 unit test files
│   └── integration/              # Integration tests (require Arena)
├── docs/                         # Documentation
├── .arena-auto/                  # Runtime data
│   ├── backups/                  # Automatic file backups
│   └── logs/                     # Structured log files
├── models/                       # Generated .doe model output
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```
