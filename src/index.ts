import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { allTools } from "./mcp/tools.js";
import { ok, err } from "./mcp/responses.js";
import { callBridge, destroyBridge } from "./bridge/client.js";
import { BridgeError } from "./bridge/errors.js";
import { logger } from "./utils/logger.js";
import { readFileSafe } from "./filesystem/reader.js";
import { applyPatch, writeFileSafe } from "./filesystem/writer.js";
import { generateDiff, formatDiff } from "./filesystem/diff.js";
import { createBackup, listBackups, restoreBackup } from "./filesystem/backup.js";
import { isPathInWorkspace } from "./filesystem/workspace.js";
import path from "path";
import fs from "fs";

const server = new Server(
  { name: "arena-auto-main", version: "0.3.0" },
  { capabilities: { tools: {} } },
);

// Timeout mapping per operation (ms)
const BRIDGE_TIMEOUTS: Record<string, number> = {
  openArena: 15_000,
  closeArena: 10_000,
  openModel: 30_000,
  runModel: 300_000, // 5 minutes - simulation may run long
  exportResults: 30_000,
  saveModel: 15_000,
  createModule: 15_000,
  setModuleProperty: 10_000,
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  try {
    logger.info("tool_call", { tool: name, args });

    let result: unknown;

    switch (name) {
      // --- Arena tools ---
      case "arena_open":
        result = await callBridge("openArena", { visible: args?.visible ?? false }, BRIDGE_TIMEOUTS.openArena);
        break;
      case "arena_close":
        result = await callBridge("closeArena", {}, BRIDGE_TIMEOUTS.closeArena);
        destroyBridge();
        break;
      case "arena_open_model":
        result = await callBridge("openModel", { path: args?.path }, BRIDGE_TIMEOUTS.openModel);
        break;
      case "arena_close_model":
        result = await callBridge("closeModel");
        break;
      case "arena_create_new_model":
        result = await callBridge("createNewModel");
        break;
      case "arena_create_module":
        result = await callBridge("createModule", {
          panelName: args?.panelName ?? "DiscreteProcessing",
          moduleName: args?.moduleName,
          x: args?.x ?? 100,
          y: args?.y ?? 200,
        }, BRIDGE_TIMEOUTS.createModule);
        break;
      case "arena_set_module_property":
        result = await callBridge("setModuleProperty", {
          caption: args?.caption,
          property: args?.property,
          value: args?.value,
        }, BRIDGE_TIMEOUTS.setModuleProperty);
        break;
      case "arena_get_module_property":
        result = await callBridge("getModuleProperty", { caption: args?.caption, property: args?.property });
        break;
      case "arena_list_module_properties":
        result = await callBridge("listModuleProperties", { caption: args?.caption });
        break;
      case "arena_add_connection":
        result = await callBridge("addConnection", { fromCaption: args?.fromCaption, toCaption: args?.toCaption });
        break;
      case "arena_save_model":
        result = await callBridge("saveModel", { path: args?.path }, BRIDGE_TIMEOUTS.saveModel);
        break;
      case "arena_run_model":
        result = await callBridge("runModel", {
          batchMode: args?.batchMode ?? true,
          quietMode: args?.quietMode ?? true,
        }, BRIDGE_TIMEOUTS.runModel);
        break;
      case "arena_get_variable":
        result = await callBridge("getVariable", { name: args?.name });
        break;
      case "arena_set_variable":
        result = await callBridge("setVariable", { name: args?.name, value: args?.value });
        break;
      case "arena_list_variables":
        result = await callBridge("listVariables");
        break;
      case "arena_list_modules":
        result = await callBridge("listModules");
        break;
      case "arena_export_results":
        result = await callBridge("exportResults", { format: args?.format ?? "txt" }, BRIDGE_TIMEOUTS.exportResults);
        break;
      case "arena_get_queue_length":
        result = await callBridge("getQueueLength", { queueName: args?.queueName });
        break;
      case "arena_get_resource_state":
        result = await callBridge("getResourceState", { resourceName: args?.resourceName });
        break;
      case "arena_get_model_info":
        result = await callBridge("getModelInfo");
        break;
      case "arena_explore_com":
        result = await callBridge("exploreCom");
        break;

      // --- Filesystem tools ---
      case "file_list": {
        const dirPath = args?.path as string;
        const check = isPathInWorkspace(dirPath);
        if (!check.ok) return err(check.reason);
        const resolved = check.resolved;
        if (!fs.existsSync(resolved)) return err(`Directory not found: ${dirPath}`);
        const entries = fs.readdirSync(resolved, { withFileTypes: true });
        const listing = entries.map((e) => {
          const fullPath = path.join(resolved, e.name);
          let stat: fs.Stats | undefined;
          try { stat = fs.statSync(fullPath); } catch { /* ignore */ }
          return {
            name: e.name,
            type: e.isDirectory() ? "directory" : "file",
            size: stat?.size ?? 0,
            modified: stat?.mtime.toISOString(),
          };
        }).sort((a, b) => a.name.localeCompare(b.name));
        result = { path: dirPath, entries: listing, count: listing.length };
        break;
      }

      case "file_read": {
        const filePath = args?.path as string;
        const maxBytes = (args?.maxBytes as number) ?? 20_000;
        result = readFileSafe(filePath, maxBytes);
        break;
      }

      case "file_patch": {
        const patchResult = applyPatch(args?.path as string, args?.patches as Array<{ old: string; new: string }>, {
          createBackup: args?.createBackup !== false,
          dryRun: args?.dryRun === true,
        });
        result = patchResult;
        break;
      }

      case "file_write": {
        const writeResult = writeFileSafe(args?.path as string, args?.content as string, {
          createBackup: args?.createBackup !== false,
        });
        result = writeResult;
        break;
      }

      case "file_diff": {
        const diff = generateDiff(args?.path as string, args?.newContent as string);
        const formatted = formatDiff(diff);
        result = {
          path: diff.path,
          summary: diff.summary,
          diff: formatted,
        };
        break;
      }

      case "file_backup": {
        const manifest = createBackup(args?.path as string, "file_backup");
        result = {
          backupId: manifest.createdAt,
          files: manifest.files,
        };
        break;
      }

      case "file_restore": {
        const restored = restoreBackup(args?.backupId as string);
        result = {
          restored,
          message: `Restored ${restored.length} file(s) from backup`,
        };
        break;
      }

      case "file_backup_list": {
        const backups = listBackups();
        result = { backups };
        break;
      }

      default:
        return err(`Unknown tool: ${name}`);
    }

    const durationMs = Date.now() - startTime;
    logger.info("tool_result", { tool: name, durationMs, ok: true });

    return ok(result);
  } catch (e) {
    const durationMs = Date.now() - startTime;
    logger.error("tool_error", {
      tool: name,
      durationMs,
      error: e instanceof Error ? e.message : String(e),
    });

    if (e instanceof BridgeError) {
      const message = e.code === "TIMEOUT"
        ? `The operation exceeded the maximum allowed time.`
        : `[${e.code}] ${e.message}`;
      return err(message);
    }
    return err((e as Error).message);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("Server started", { transport: "stdio" });
}

main().catch((e) => {
  logger.error("Fatal startup error", { error: (e as Error).message });
  process.exit(1);
});
