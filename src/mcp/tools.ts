import { toolSchemas } from "./schemas.js";

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: object;
};

export const arenaTools: ToolDefinition[] = [
  {
    name: "arena_open",
    description: "Open Arena application (COM connection)",
    inputSchema: toolSchemas.arena_open,
  },
  {
    name: "arena_close",
    description: "Close Arena application and cleanup COM resources",
    inputSchema: toolSchemas.arena_close,
  },
  {
    name: "arena_open_model",
    description: "Open a .doe Arena model file",
    inputSchema: toolSchemas.arena_open_model,
  },
  {
    name: "arena_close_model",
    description: "Close the currently open model",
    inputSchema: toolSchemas.arena_close_model,
  },
  {
    name: "arena_create_new_model",
    description: "Create a new empty Arena model",
    inputSchema: toolSchemas.arena_create_new_model,
  },
  {
    name: "arena_create_module",
    description: "Create a module in the model (e.g. Create, Process, Dispose, Decide, Assign)",
    inputSchema: toolSchemas.arena_create_module,
  },
  {
    name: "arena_set_module_property",
    description: "Set a module property via Data(operandName, value)",
    inputSchema: toolSchemas.arena_set_module_property,
  },
  {
    name: "arena_get_module_property",
    description: "Get a module property value",
    inputSchema: toolSchemas.arena_get_module_property,
  },
  {
    name: "arena_list_module_properties",
    description: "List all readable properties for a module",
    inputSchema: toolSchemas.arena_list_module_properties,
  },
  {
    name: "arena_add_connection",
    description: "Connect two modules",
    inputSchema: toolSchemas.arena_add_connection,
  },
  {
    name: "arena_run_model",
    description: "Run the simulation model",
    inputSchema: toolSchemas.arena_run_model,
  },
  {
    name: "arena_save_model",
    description: "Save the current model to a .doe file",
    inputSchema: toolSchemas.arena_save_model,
  },
  {
    name: "arena_get_variable",
    description: "Read a SIMAN variable value from the model",
    inputSchema: toolSchemas.arena_get_variable,
  },
  {
    name: "arena_set_variable",
    description: "Set a SIMAN variable value in the model",
    inputSchema: toolSchemas.arena_set_variable,
  },
  {
    name: "arena_list_variables",
    description: "List all SIMAN variables in the model",
    inputSchema: toolSchemas.arena_list_variables,
  },
  {
    name: "arena_list_modules",
    description: "List all modules in the model",
    inputSchema: toolSchemas.arena_list_modules,
  },
  {
    name: "arena_export_results",
    description: "Export simulation results report",
    inputSchema: toolSchemas.arena_export_results,
  },
  {
    name: "arena_get_queue_length",
    description: "Get current queue length for a named queue",
    inputSchema: toolSchemas.arena_get_queue_length,
  },
  {
    name: "arena_get_resource_state",
    description: "Get current state of a resource",
    inputSchema: toolSchemas.arena_get_resource_state,
  },
  {
    name: "arena_get_model_info",
    description: "Get model info (name, simulation time, status)",
    inputSchema: toolSchemas.arena_get_model_info,
  },
  {
    name: "arena_explore_com",
    description: "Explore COM API capabilities (panels, module definitions, etc.)",
    inputSchema: toolSchemas.arena_explore_com,
  },
];

export const fileTools: ToolDefinition[] = [
  {
    name: "file_list",
    description: "List files and directories in the workspace",
    inputSchema: toolSchemas.file_list,
  },
  {
    name: "file_read",
    description: "Read a file from the workspace safely",
    inputSchema: toolSchemas.file_read,
  },
  {
    name: "file_patch",
    description: "Apply text patches to a file with backup and dry-run support",
    inputSchema: toolSchemas.file_patch,
  },
  {
    name: "file_write",
    description: "Write content to a file in the workspace",
    inputSchema: toolSchemas.file_write,
  },
  {
    name: "file_diff",
    description: "Show diff between current file and proposed content",
    inputSchema: toolSchemas.file_diff,
  },
  {
    name: "file_backup",
    description: "Create a backup of a file",
    inputSchema: toolSchemas.file_backup,
  },
  {
    name: "file_restore",
    description: "Restore a file from a backup",
    inputSchema: toolSchemas.file_restore,
  },
  {
    name: "file_backup_list",
    description: "List available backups",
    inputSchema: toolSchemas.file_backup_list,
  },
];

export const resultsTools: ToolDefinition[] = [
  {
    name: "arena_extract_results",
    description: "Extract simulation results (entity, queue, resource stats, variables) after running a model",
    inputSchema: toolSchemas.arena_extract_results,
  },
  {
    name: "arena_get_summary",
    description: "Get a structured summary of simulation results",
    inputSchema: toolSchemas.arena_get_summary,
  },
  {
    name: "arena_diagnose_model",
    description: "Analyze simulation results to detect bottlenecks, saturated resources, and congested queues",
    inputSchema: toolSchemas.arena_diagnose_model,
  },
  {
    name: "arena_generate_report",
    description: "Generate a full Markdown simulation report with metrics, diagnosis, and recommendations",
    inputSchema: toolSchemas.arena_generate_report,
  },
];

export const specTools: ToolDefinition[] = [
  {
    name: "arena_validate_spec",
    description: "Validate an ArenaModelSpec without building it",
    inputSchema: toolSchemas.arena_validate_spec,
  },
  {
    name: "arena_build_model",
    description: "Compile and build a complete Arena model from an ArenaModelSpec",
    inputSchema: toolSchemas.arena_build_model,
  },
];

export const templateTools: ToolDefinition[] = [
  {
    name: "arena_list_templates",
    description: "List available model templates with their parameters and descriptions",
    inputSchema: toolSchemas.arena_list_templates,
  },
  {
    name: "arena_create_from_template",
    description: "Create an Arena model from a template with parameter overrides. Expands template, validates spec, then compiles and builds the model.",
    inputSchema: toolSchemas.arena_create_from_template,
  },
];

export const catalogTools: ToolDefinition[] = [
  {
    name: "arena_generate_capability_catalog",
    description: "Connect to Arena COM, discover all panels, module definitions, and probe properties to build a capability catalog saved to arena-capabilities.json",
    inputSchema: toolSchemas.arena_generate_capability_catalog,
  },
  {
    name: "arena_capabilities_read",
    description: "Read the saved arena-capabilities.json catalog from the workspace",
    inputSchema: toolSchemas.arena_capabilities_read,
  },
];

export const scenarioTools: ToolDefinition[] = [
  {
    name: "arena_run_experiment",
    description: "Run an experiment with multiple scenarios, comparing changes to a base spec. Each scenario applies patches to the base spec, builds the model, runs it, and compares results.",
    inputSchema: toolSchemas.arena_run_experiment,
  },
];

export const repairTools: ToolDefinition[] = [
  {
    name: "arena_repair_spec",
    description: "Auto-repair common ArenaModelSpec validation errors",
    inputSchema: toolSchemas.arena_repair_spec,
  },
  {
    name: "arena_explain_spec_errors",
    description: "Get human-readable explanations for spec validation errors",
    inputSchema: toolSchemas.arena_explain_spec_errors,
  },
];

export const doeTemplateTools: ToolDefinition[] = [
  {
    name: "arena_list_doe_templates",
    description: "List available .doe template files that can be cloned",
    inputSchema: toolSchemas.arena_list_doe_templates,
  },
  {
    name: "arena_clone_doe_template",
    description: "Clone a .doe template file to a new location in the workspace",
    inputSchema: toolSchemas.arena_clone_doe_template,
  },
];

export const simanTools: ToolDefinition[] = [
  {
    name: "arena_get_siman_source",
    description: "Get the SIMAN source code of the current model",
    inputSchema: toolSchemas.arena_get_siman_source,
  },
  {
    name: "arena_get_siman_blocks",
    description: "List SIMAN blocks in the current model",
    inputSchema: toolSchemas.arena_get_siman_blocks,
  },
  {
    name: "arena_get_vba_macros",
    description: "List VBA macros available in the current model",
    inputSchema: toolSchemas.arena_get_vba_macros,
  },
  {
    name: "arena_run_vba_macro",
    description: "Run a VBA macro by name",
    inputSchema: toolSchemas.arena_run_vba_macro,
  },
];

export const allTools = [...arenaTools, ...fileTools, ...specTools, ...catalogTools, ...templateTools, ...resultsTools, ...scenarioTools, ...repairTools, ...doeTemplateTools, ...simanTools];
