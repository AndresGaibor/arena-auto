# MCP Tools Reference

The server exposes **34 tools** organized into 10 categories. All tools are defined in `src/mcp/tools.ts` with input schemas in `src/mcp/schemas.ts`.

## Arena Basics (21 tools)

### `arena_open`
Open Arena application (COM connection).
- **Params**: `{ visible?: boolean }`
- **Example**: `arena_open({ visible: true })`

### `arena_close`
Close Arena application and cleanup COM resources.
- **Params**: `{}`

### `arena_open_model`
Open a .doe Arena model file.
- **Params**: `{ path: string }` — full path to .doe file
- **Example**: `arena_open_model({ path: "C:/model/queue.doe" })`

### `arena_close_model`
Close the currently open model.
- **Params**: `{}`

### `arena_create_new_model`
Create a new empty Arena model.
- **Params**: `{}`

### `arena_create_module`
Create a module in the model.
- **Params**: `{ panelName?: string, moduleName: string, x?: number, y?: number }`
- **Default panel**: "DiscreteProcessing"
- **Example**: `arena_create_module({ moduleName: "Create", x: 100, y: 200 })`

### `arena_set_module_property`
Set a module property via Data(operandName, value).
- **Params**: `{ caption: string, property: string, value: string }`
- **Example**: `arena_set_module_property({ caption: "Create 1", property: "Name", value: "Arrival" })`

### `arena_get_module_property`
Get a module property value.
- **Params**: `{ caption: string, property: string }`
- **Example**: `arena_get_module_property({ caption: "Create 1", property: "Name" })`

### `arena_list_module_properties`
List all readable properties for a module.
- **Params**: `{ caption: string }`

### `arena_add_connection`
Connect two modules visually.
- **Params**: `{ fromCaption: string, toCaption: string }`

### `arena_run_model`
Run the simulation model.
- **Params**: `{ batchMode?: boolean, quietMode?: boolean }`
- **Defaults**: batchMode=true, quietMode=true

### `arena_save_model`
Save the current model to a .doe file.
- **Params**: `{ path?: string }`
- **Example**: `arena_save_model({ path: "C:/model/output.doe" })`

### `arena_get_variable`
Read a SIMAN variable value from the model.
- **Params**: `{ name: string }`

### `arena_set_variable`
Set a SIMAN variable value in the model.
- **Params**: `{ name: string, value: number }`

### `arena_list_variables`
List all SIMAN variables in the model.
- **Params**: `{}`

### `arena_list_modules`
List all modules in the model (with types and captions).
- **Params**: `{}`

### `arena_export_results`
Export simulation results report.
- **Params**: `{ format?: "txt" | "csv" | "xls" }`
- **Default format**: "txt"

### `arena_get_queue_length`
Get current queue length for a named queue.
- **Params**: `{ queueName: string }`

### `arena_get_resource_state`
Get current state of a resource.
- **Params**: `{ resourceName: string }`

### `arena_get_model_info`
Get model info (name, simulation time, status).
- **Params**: `{}`

### `arena_explore_com`
Explore COM API capabilities (panels, module definitions, etc.).
- **Params**: `{}`

## Filesystem (8 tools)

### `file_list`
List files and directories in the workspace.
- **Params**: `{ path: string, pattern?: string }`

### `file_read`
Read a file from the workspace safely (with size limit).
- **Params**: `{ path: string, maxBytes?: number }`
- **Default maxBytes**: 20000

### `file_patch`
Apply text patches to a file with backup and dry-run support.
- **Params**: `{ path: string, patches: Array<{ old: string, new: string }>, createBackup?: boolean, dryRun?: boolean }`

### `file_write`
Write content to a file in the workspace (atomic write).
- **Params**: `{ path: string, content: string, createBackup?: boolean }`

### `file_diff`
Show diff between current file and proposed content.
- **Params**: `{ path: string, newContent: string }`

### `file_backup`
Create a backup of a file.
- **Params**: `{ path: string }`

### `file_restore`
Restore a file from a backup.
- **Params**: `{ backupId: string }`

### `file_backup_list`
List available backups.
- **Params**: `{}`

## Simulation Results (4 tools)

### `arena_extract_results`
Extract simulation results (entity, queue, resource stats, variables) after running a model. Reads via SIMAN COM with CSV report fallback.
- **Params**: `{}`

### `arena_get_summary`
Get a structured summary of simulation results including all metrics.
- **Params**: `{}`

### `arena_diagnose_model`
Analyze simulation results to detect bottlenecks (resources >85%), saturated resources (>95%), and congested queues. Returns a health score (0-100).
- **Params**: `{}`

### `arena_generate_report`
Generate a full Markdown simulation report with metrics, diagnosis, and recommendations.
- **Params**: `{}`

## Arena Spec (2 tools)

### `arena_validate_spec`
Validate an ArenaModelSpec JSON without building it. Runs 34+ structural and semantic checks.
- **Params**: `{ spec: ArenaModelSpec }`

### `arena_build_model`
Compile and build a complete Arena model from an ArenaModelSpec. Validates, computes layout, compiles to build plan, creates all modules, sets properties, adds connections, and saves.
- **Params**: `{ spec: ArenaModelSpec, saveAs?: string, runAfterBuild?: boolean }`

## Capability Catalog (2 tools)

### `arena_generate_capability_catalog`
Connect to Arena COM, discover all panels, module definitions, and probe properties to build a capability catalog saved to `arena-capabilities.json` in the workspace.
- **Params**: `{}`

### `arena_capabilities_read`
Read the saved `arena-capabilities.json` catalog from the workspace.
- **Params**: `{}`

## Templates (2 tools)

### `arena_list_templates`
List available model templates with their parameters and descriptions. Scans the `templates/` directory.
- **Params**: `{}`

### `arena_create_from_template`
Create an Arena model from a template with parameter overrides. Expands `{{param}}` tokens, validates the spec, compiles, builds in Arena, and optionally runs.
- **Params**: `{ templateId: string, params?: object, saveAs?: string, runAfterBuild?: boolean }`

## Scenarios (1 tool)

### `arena_run_experiment`
Run an experiment with multiple scenarios comparing changes to a base spec. Each scenario applies patches to the base spec, builds the model in Arena, runs it, and compares results. Produces a Markdown report with comparison tables and ranking.
- **Params**: `{ baseSpec: ArenaModelSpec, scenarios: Array<{ name, description?, patches }> }`

## Auto-Repair (2 tools)

### `arena_repair_spec`
Auto-repair common ArenaModelSpec validation errors (missing names, unsafe IDs, etc.).
- **Params**: `{ spec: ArenaModelSpec, autoFix?: boolean }`

### `arena_explain_spec_errors`
Get human-readable explanations for spec validation errors.
- **Params**: `{ spec: ArenaModelSpec }`

## .doe Templates (2 tools)

### `arena_list_doe_templates`
List available .doe template files that can be cloned. Scans the `doe-templates/` directory.
- **Params**: `{}`

### `arena_clone_doe_template`
Clone a .doe template file to a new location in the workspace.
- **Params**: `{ templateId: string, saveAs: string }`

## SIMAN / VBA (4 tools)

### `arena_get_siman_source`
Get the SIMAN source code of the current model as plain text.
- **Params**: `{}`

### `arena_get_siman_blocks`
List SIMAN blocks in the current model with labels and types.
- **Params**: `{}`

### `arena_get_vba_macros`
List VBA macros available in the current model.
- **Params**: `{}`

### `arena_run_vba_macro`
Run a VBA macro by name.
- **Params**: `{ macroName: string }`

## Tool Category Summary

| Category | Count | Tools |
|----------|-------|-------|
| Arena Basics | 21 | open, close, openModel, closeModel, createNewModel, createModule, setModuleProperty, getModuleProperty, listModuleProperties, addConnection, runModel, saveModel, getVariable, setVariable, listVariables, listModules, exportResults, getQueueLength, getResourceState, getModelInfo, exploreCom |
| Filesystem | 8 | file_list, file_read, file_patch, file_write, file_diff, file_backup, file_restore, file_backup_list |
| Simulation Results | 4 | arena_extract_results, arena_get_summary, arena_diagnose_model, arena_generate_report |
| Arena Spec | 2 | arena_validate_spec, arena_build_model |
| Capability Catalog | 2 | arena_generate_capability_catalog, arena_capabilities_read |
| Templates | 2 | arena_list_templates, arena_create_from_template |
| Scenarios | 1 | arena_run_experiment |
| Auto-Repair | 2 | arena_repair_spec, arena_explain_spec_errors |
| .doe Templates | 2 | arena_list_doe_templates, arena_clone_doe_template |
| SIMAN / VBA | 4 | arena_get_siman_source, arena_get_siman_blocks, arena_get_vba_macros, arena_run_vba_macro |

**Total: 34 tools**
