import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  openArena, closeArena,
  openModel, closeModel, createNewModel,
  runModel,
  getVariable, setVariable, listVariables,
  listModules,
  exportResults,
  getQueueLength, getResourceState,
  getModelInfo, exploreCom,
  createModule,
  getModuleProperty, setModuleProperty, listModuleProperties,
  addConnection, saveModel,
} from "./bridge.js";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: "text", text: msg }], isError: true };
}

const server = new Server(
  { name: "arena-mcp", version: "0.2.0" },
  { capabilities: { tools: {} } },
);

const tools = [
  {
    name: "arena_open",
    description: "Open Arena application (COM connection)",
    inputSchema: {
      type: "object",
      properties: {
        visible: { type: "boolean", description: "Make Arena window visible", default: false },
      },
    },
  },
  {
    name: "arena_close",
    description: "Close Arena application and cleanup COM resources",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "arena_open_model",
    description: "Open a .doe Arena model file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Full path to .doe file" },
      },
      required: ["path"],
    },
  },
  {
    name: "arena_close_model",
    description: "Close the currently open model",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "arena_create_new_model",
    description: "Create a new empty Arena model",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "arena_create_module",
    description: "Create a module in the model (e.g. Create, Process, Dispose, Decide, Assign)",
    inputSchema: {
      type: "object",
      properties: {
        panelName: { type: "string", description: "Panel name: DiscreteProcessing, DataDefinition, Decisions, InputOutput, etc.", default: "DiscreteProcessing" },
        moduleName: { type: "string", description: "Module type: Create, Process, Dispose, Decide, Assign, etc." },
        x: { type: "number", description: "X position on canvas", default: 100 },
        y: { type: "number", description: "Y position on canvas", default: 200 },
      },
      required: ["moduleName"],
    },
  },
  {
    name: "arena_set_module_property",
    description: "Set a module property via Data(operandName, value). E.g. property='Name', value='MyModule'",
    inputSchema: {
      type: "object",
      properties: {
        caption: { type: "string", description: "Module caption (e.g. 'Create 1', 'Process 1')" },
        property: { type: "string", description: "Property/operand name (e.g. 'Name', 'Entity Type', 'Value', 'Units')" },
        value: { type: "string", description: "New value" },
      },
      required: ["caption", "property", "value"],
    },
  },
  {
    name: "arena_get_module_property",
    description: "Get a module property value",
    inputSchema: {
      type: "object",
      properties: {
        caption: { type: "string", description: "Module caption" },
        property: { type: "string", description: "Property name" },
      },
      required: ["caption", "property"],
    },
  },
  {
    name: "arena_list_module_properties",
    description: "List all readable properties for a module",
    inputSchema: {
      type: "object",
      properties: {
        caption: { type: "string", description: "Module caption" },
      },
      required: ["caption"],
    },
  },
  {
    name: "arena_add_connection",
    description: "Connect two modules",
    inputSchema: {
      type: "object",
      properties: {
        fromCaption: { type: "string", description: "Source module caption" },
        toCaption: { type: "string", description: "Target module caption" },
      },
      required: ["fromCaption", "toCaption"],
    },
  },
  {
    name: "arena_run_model",
    description: "Run the simulation model",
    inputSchema: {
      type: "object",
      properties: {
        batchMode: { type: "boolean", description: "Run in batch mode (no UI)", default: true },
        quietMode: { type: "boolean", description: "Suppress dialogs", default: true },
      },
    },
  },
  {
    name: "arena_save_model",
    description: "Save the current model to a .doe file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Save path (default: Arena documents folder)" },
      },
    },
  },
  {
    name: "arena_get_variable",
    description: "Read a SIMAN variable value from the model",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "arena_set_variable",
    description: "Set a SIMAN variable value in the model",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" }, value: { type: "number" } },
      required: ["name", "value"],
    },
  },
  {
    name: "arena_list_variables",
    description: "List all SIMAN variables in the model",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "arena_list_modules",
    description: "List all modules in the model",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "arena_export_results",
    description: "Export simulation results report",
    inputSchema: {
      type: "object",
      properties: { format: { type: "string", description: "txt, csv, xls", default: "txt" } },
    },
  },
  {
    name: "arena_get_queue_length",
    description: "Get current queue length for a named queue",
    inputSchema: {
      type: "object",
      properties: { queueName: { type: "string" } },
      required: ["queueName"],
    },
  },
  {
    name: "arena_get_resource_state",
    description: "Get current state of a resource",
    inputSchema: {
      type: "object",
      properties: { resourceName: { type: "string" } },
      required: ["resourceName"],
    },
  },
  {
    name: "arena_get_model_info",
    description: "Get model info (name, simulation time, status)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "arena_explore_com",
    description: "Explore COM API capabilities (panels, module definitions, etc.)",
    inputSchema: { type: "object", properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "arena_open": return ok(await openArena(args?.visible as boolean));
      case "arena_close": return ok(await closeArena());
      case "arena_open_model": return ok(await openModel(args?.path as string));
      case "arena_close_model": return ok(await closeModel());
      case "arena_create_new_model": return ok(await createNewModel());
      case "arena_create_module": return ok(await createModule(args?.panelName as string, args?.moduleName as string, args?.x as number, args?.y as number));
      case "arena_set_module_property": return ok(await setModuleProperty(args?.caption as string, args?.property as string, args?.value as string));
      case "arena_get_module_property": return ok(await getModuleProperty(args?.caption as string, args?.property as string));
      case "arena_list_module_properties": return ok(await listModuleProperties(args?.caption as string));
      case "arena_add_connection": return ok(await addConnection(args?.fromCaption as string, args?.toCaption as string));
      case "arena_save_model": return ok(await saveModel(args?.path as string));
      case "arena_run_model": return ok(await runModel(args?.batchMode as boolean, args?.quietMode as boolean));
      case "arena_get_variable": return ok(await getVariable(args?.name as string));
      case "arena_set_variable": return ok(await setVariable(args?.name as string, args?.value as number));
      case "arena_list_variables": return ok(await listVariables());
      case "arena_list_modules": return ok(await listModules());
      case "arena_export_results": return ok(await exportResults(args?.format as string));
      case "arena_get_queue_length": return ok(await getQueueLength(args?.queueName as string));
      case "arena_get_resource_state": return ok(await getResourceState(args?.resourceName as string));
      case "arena_get_model_info": return ok(await getModelInfo());
      case "arena_explore_com": return ok(await exploreCom());
      default: return err(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err((e as Error).message);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[arena-mcp] Server running on stdio");
}

main().catch((e) => {
  console.error("[arena-mcp] Fatal:", e);
  process.exit(1);
});
