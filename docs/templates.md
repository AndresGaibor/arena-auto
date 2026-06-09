# Template System

## Overview

The template system allows creating Arena models from parameterized JSON templates. Templates are stored as `.json` files in the `templates/` directory. Each template contains an `ArenaModelSpec` with `{{param}}` substitution markers and a `_params` metadata section describing available parameters.

## Directory Structure

```
templates/
├── queueing/               # Queueing system templates
│   ├── mm1.json            # M/M/1 single-server queue
│   ├── mmc.json            # M/M/c multi-server queue
│   └── finite_capacity.json # Finite capacity queue with balking
├── manufacturing/          # Manufacturing templates
│   ├── serial_line.json    # 3-station serial production line
│   ├── quality_inspection.json # Quality check with pass/reject
│   └── rework_loop.json    # Rework loop with conditional return
├── advanced/               # Advanced templates
│   └── batching.json       # Batch processing with assembly/separation
└── services/               # Service templates (empty, ready for expansion)
```

## Template Format

A template file is a valid JSON object with an `ArenaModelSpec` structure plus a `_params` metadata section.

### Structure

```json
{
  "name": "{{modelName}}",
  "description": "Template description",
  "timeUnits": "{{timeUnits}}",
  "replications": {{replications}},
  "replicationLength": {{replicationLength}},
  "entities": [ ... ],
  "resources": [ ... ],
  "flow": [ ... ],
  "connections": [ ... ],
  "_params": {
    "modelName": { "default": "MyModel", "description": "Model name" },
    "timeUnits": { "default": "Minutes", "description": "Time unit" },
    "replications": { "default": 5, "description": "Number of replications" }
  }
}
```

### Parameter Substitution

- Parameters use `{{paramName}}` syntax in the JSON values
- Both string and numeric defaults are supported
- The `_params` section is stripped from the final spec after expansion
- If a parameter is referenced but not provided, the `{{paramName}}` placeholder remains as-is (which will cause validation to fail, providing clear feedback)

### Parameter System

Each parameter in `_params` has:
- `default`: string or number — used when no override is provided
- `description`: string — human-readable description shown by `arena_list_templates`

## Available Templates

### Queueing

| Template ID | Name | Category | Description | Parameters |
|------------|------|----------|-------------|-----------|
| `mm1` | M/M/1 Queue | queueing | Single-server queue with exponential interarrival/service times | modelName, entityName, resourceName, resourceCapacity, arrivalMean, serviceMean, timeUnits, replications, replicationLength |
| `mmc` | M/M/c Queue | queueing | Multi-server queue with N parallel servers | modelName, entityName, resourceName, numServers, arrivalMean, serviceMean, timeUnits, replications, replicationLength |
| `finite_capacity` | Finite Capacity | queueing | Queue with finite capacity and balking | modelName, entityName, resourceName, resourceCapacity, arrivalMean, serviceMean, maxQueue, timeUnits, replications, replicationLength |

### Manufacturing

| Template ID | Name | Category | Description | Parameters |
|------------|------|----------|-------------|-----------|
| `serial_line` | Serial Line | manufacturing | 3-station serial production line | modelName, entityName, arrivalMean, station1Name/Cap, station2Name/Cap, station3Name/Cap, op1Dist/Param1/Param2, op2Dist/Param1/Param2, op3Dist/Param1/Param2, timeUnits, replications, replicationLength |
| `quality_inspection` | Quality Inspection | manufacturing | Inspection with accept/reject decision | modelName, entityName, arrivalMean, inspectDist/Param1/Param2/Param3, passRate, rejectRate, timeUnits, replications, replicationLength |
| `rework_loop` | Rework Loop | manufacturing | Rework loop with conditional return to process | modelName, entityName, arrivalMean, processDist/Param1/Param2, passRate, reworkRate, scrapRate, timeUnits, replications, replicationLength |

### Advanced

| Template ID | Name | Category | Description | Parameters |
|------------|------|----------|-------------|-----------|
| `batching` | Batching | advanced | Batch processing with assembly/separation | modelName, entityName, arrivalMean, batchSize, processDist, processParam1, processParam2, timeUnits, replications, replicationLength |

## How to Add a New Template

1. **Choose a category**: place the file in the appropriate subdirectory under `templates/` (or create a new one).

2. **Create the JSON file** with:
   - Standard `ArenaModelSpec` structure (see `docs/arena-model-spec.md`)
   - `{{paramName}}` placeholders for configurable values
   - A `_params` object documenting each parameter with `default` and `description`

3. **Parameter conventions**:
   - `modelName` — always include as the spec name
   - `entityName` — entity type name (string)
   - `resourceName` — resource name (string)
   - `arrivalMean` — mean interarrival time (number)
   - `serviceMean` — mean service time (number)
   - `timeUnits` — "Hours", "Minutes", or "Seconds"
   - `replications` — replication count (number)
   - `replicationLength` — length per replication (number)

4. **Verify**: load the template with `loadTemplate("your_id", { ... })` and validate with `validateSpec()`.

5. **Test**: write a unit test in `tests/unit/template-loader.test.ts`.

## Template Loading Flow

```
arena_list_templates
  -> listTemplates()
    -> walks templates/ directory recursively
    -> reads each .json file
    -> extracts _params metadata
    -> returns catalog of TemplateMeta objects

arena_create_from_template
  -> loadTemplate(templateId, params)
    -> reads JSON file
    -> replaces {{param}} tokens with provided or default values
    -> strips _params section
    -> returns ArenaModelSpec
  -> validateSpec(spec)
  -> compileSpec(spec)
  -> execute build plan via bridge
  -> optionally run simulation
```

## .doe Template System

In addition to JSON model templates, the system supports cloning pre-built `.doe` template files from the `doe-templates/` directory.

- `arena_list_doe_templates` — lists available `.doe` files
- `arena_clone_doe_template` — copies a `.doe` file to a workspace path

This is useful for models that cannot be represented purely through the ArenaModelSpec format and require manual Arena-created starting points.
