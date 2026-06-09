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

export const allTools = [...arenaTools, ...fileTools];
