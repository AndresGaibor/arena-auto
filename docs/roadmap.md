# Roadmap

## Project Phases Overview

The project is organized into 15 implementation phases plus a documentation phase. Each phase builds on the previous one.

## Current Status

- **Version**: 0.3.0
- **Completed phases**: 9 of 15 (Phases 0-4, 6, 9-10)
- **Pending phases**: 5 (Phases 5, 7-8, 11-13)
- **This phase**: Phase 14 (Documentation) — IN PROGRESS
- **Tests**: 175+ passing across 17 unit test files
- **MCP Tools**: 34 registered
- **Bridge Handlers**: 19 registered
- **Templates**: 7 JSON templates in 4 categories

## Completed (v0.1 -- v0.3)

### Phase 0 -- Bridge Stabilization
- stdin/stdout JSON-RPC I/O loop
- Handler registry (19 handlers)
- Arena lifecycle (open/close)
- Model management (open/close/create/save)
- Module operations (create/get/set/connect/list)
- Simulation control (run/set replication length)
- Result extraction & variable access
- Data element creation (resources, entities, queues, schedules, sets, failures)
- Timeouts and error handling per operation
- Bridge process lifecycle management

### Phase 1 -- M/M/1 Functional
- End-to-end model creation workflow
- Basic create/process/dispose compilation
- Validator with fundamental checks
- Example JSON spec (mm1.json)

### Phase 2 -- ArenaModelSpec v0.2
- Full TypeScript schema with 24 flow module types
- Top-level fields: name, timeUnits, replications, replicationLength, warmupPeriod
- Resource, entity, queue, variable, attribute, schedule definitions
- Set, station, transporter, conveyor, distance, statistic definitions
- Connection format: array of [fromId, toId] pairs

### Phase 3 -- Basic Module Compilers
- Create, Process, Dispose, Decide, Assign, Record
- Distribution validation (EXPO, NORM, UNIF, TRIA, etc.) and Arena expression format
- Time unit handling (Hours/Minutes/Seconds with aliases)
- Auto-layout calculation for module positioning
- Normalizer (ID sanitization, name resolution)

### Phase 4 -- Capability Catalog
- COM exploration tool to discover panels, modules, properties
- Arena capability catalog generation and reading
- Dynamic property discovery

### Phase 6 -- Templates
- Template directory structure (queueing/manufacturing/advanced/services)
- JSON template format with `{{param}}` substitution
- `_params` metadata with defaults and descriptions
- Template loading and parameter expansion
- 7 templates: mm1, mmc, finite_capacity, serial_line, quality_inspection, rework_loop, batching
- .doe template cloning system
- `arena_list_templates` and `arena_create_from_template` tools

### Phase 9 -- Results & Diagnosis
- SIMAN result extraction (entity, queue, resource, variable stats)
- CSV report parsing fallback
- Bottleneck detection (>85% utilization)
- Saturation detection (>95% utilization)
- Queue congestion analysis
- Entity time-in-system analysis
- Health score (0-100)
- Markdown report generation

### Phase 10 -- Scenarios & Comparison
- Experiment configuration with base spec + scenario patches
- Deep-merge patching (dot-notation paths)
- Automated building, running, and extracting for each scenario
- Cross-scenario metric comparison
- Scenario ranking with strengths/weaknesses
- Markdown experiment report with comparison tables

## In Progress

### Phase 14 -- Documentation
- `docs/architecture.md` -- system architecture overview
- `docs/arena-model-spec.md` -- spec reference with all flow types
- `docs/bridge-protocol.md` -- JSON-RPC-like protocol documentation
- `docs/tools.md` -- all 34 MCP tools documented
- `docs/templates.md` -- template system documentation
- `docs/testing.md` -- testing guide
- `docs/troubleshooting.md` -- common issue resolution
- `docs/roadmap.md` -- project roadmap

## Pending

### Phase 5 -- Resources, Queues, Schedules
- Full data element compilation (currently basic)
- Schedule-based resource capacity changes
- Queue discipline options (FIFO, LIFO, attribute-based)
- Resource failure modeling
- Cost tracking for resources and entities

### Phase 7 -- Intermediate Modules
- Batch/Separate in full detail
- Hold/Signal/Match synchronization patterns
- Search (queue scanning)
- Store/Unstore (holding areas)
- ReadWrite (file I/O from simulation)

### Phase 8 -- Logistics & Movement
- Station/Route/Enter/Leave networks
- PickStation with multiple selection rules
- Transporter (vehicle) modeling
- Conveyor (fixed/accumulating) systems
- Access/Release modules
- Distance-based routing

### Phase 11 -- Auto-Repair Specs
- Currently basic repair exists (`src/arena-spec/repair.ts`)
- Extend to handle more validation error types
- Suggest fixes for common mistakes
- Automatic ID generation for unnamed modules

### Phase 12 -- .doe Template Fallback
- Currently basic .doe cloning exists
- Integrate .doe templates with the spec pipeline
- Fall back to .doe templates when JSON spec approach is insufficient
- Open and manipulate pre-built .doe files programmatically

### Phase 13 -- SIMAN/VBA Fallback
- Currently basic SIMAN/VBA access exists
- Use SIMAN source manipulation as alternative to COM module creation
- VBA macro execution for complex model manipulation
- SIMAN block-level operations

## Future (v1.0+)

### Phase 15 -- Optimization & Performance
- Batch model building (multiple specs)
- Parallel scenario execution
- Cached capability catalogs
- Faster result extraction

### Phase 16 -- UI & Visualization
- Arena canvas screenshot capture
- Model topology visualization
- Queue length time-series charts
- Resource utilization charts

### Phase 17 -- Advanced Analytics
- Warmup period detection (automated)
- Number of replications determination (automated)
- Confidence interval analysis
- Design of experiments (DOE) integration
- Optimization (OptQuest-like)

### Phase 18 -- Integration & Distribution
- REST API wrapper around MCP server
- Docker container for development (non-COM parts)
- CI/CD pipeline
- Package distribution

## Version History

| Version | Date | Phases | Key Features |
|---------|------|--------|-------------|
| v0.1 | — | 0-2 | Bridge, M/M/1, ArenaModelSpec v0.2 |
| v0.2 | — | 3-4, 6 | Module compilers, catalog, templates |
| v0.3 | — | 9-10 | Results, diagnosis, scenarios |
| v0.4 | — | 14 | Documentation |
| v0.5 | — | 5, 7 | Resources, queues, schedules, intermediate modules |
| v0.6 | — | 8 | Logistics & movement |
| v0.7 | — | 11-13 | Repair, .doe fallback, SIMAN/VBA |
| v1.0 | — | 15+ | Optimization, analytics, distribution |
