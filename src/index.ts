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
import { isPathInWorkspace, getWorkspaceRoot } from "./filesystem/workspace.js";
import { compileSpec } from "./arena-spec/compiler.js";
import { validateSpec } from "./arena-spec/validator.js";
import { repairSpec } from "./arena-spec/repair.js";
import { explainSpecErrors } from "./arena-spec/explain-errors.js";
import type { ArenaModelSpec } from "./arena-spec/schema.js";
import type { CapabilityCatalog } from "./arena-spec/capability-catalog.js";
import { listTemplates, loadTemplate } from "./templates/template-loader.js";
import { listDoeTemplates, cloneDoeTemplate } from "./templates/doe-templates.js";
import { extractResults } from "./results/extractor.js";
import { diagnose } from "./results/diagnosis.js";
import { generateReport } from "./results/report.js";
import { getSource, getBlocks, getMacros, runMacro } from "./siman/client.js";
import { runExperiment } from "./scenarios/runner.js";
import type { ExperimentConfig } from "./scenarios/types.js";
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
          backupId: manifest.id,
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

      // --- Catalog tools ---
      case "arena_generate_capability_catalog": {
        const catResult = await callBridge("generateCapabilityCatalog", {}, BRIDGE_TIMEOUTS.openArena) as { catalog?: CapabilityCatalog };
        if (catResult?.catalog) {
          const workspace = getWorkspaceRoot();
          const catalogPath = path.join(workspace, "arena-capabilities.json");
          fs.writeFileSync(catalogPath, JSON.stringify(catResult.catalog, null, 2));
          result = {
            catalog: catResult.catalog,
            savedAt: catalogPath,
            panels: catResult.catalog.panels?.length ?? 0,
            modules: catResult.catalog.panels?.reduce((acc, p) => acc + (p.modules?.length ?? 0), 0) ?? 0,
          };
        } else {
          result = catResult;
        }
        break;
      }

      case "arena_capabilities_read": {
        const workspace = getWorkspaceRoot();
        const catalogPath = path.join(workspace, "arena-capabilities.json");
        if (!fs.existsSync(catalogPath)) {
          return err("No capability catalog found. Run arena_generate_capability_catalog first.");
        }
        const catalog: CapabilityCatalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
        result = { catalog };
        break;
      }

      // --- Template tools ---
      case "arena_list_templates": {
        result = listTemplates();
        break;
      }

      case "arena_create_from_template": {
        const templateId = args?.templateId as string;
        const params = args?.params as Record<string, string | number> | undefined;
        const rawSaveAs = args?.saveAs as string | undefined;
        const runAfter = args?.runAfterBuild === true;

        // Load and expand template
        const spec = loadTemplate(templateId, params);

        // Reuse build logic (inline to avoid duplication)
        const validation = validateSpec(spec);
        if (!validation.valid) {
          return err(`Template "${templateId}" validation failed:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
        }

        let resolvedSavePath: string | undefined;
        if (rawSaveAs) {
          const check = isPathInWorkspace(rawSaveAs);
          if (!check.ok) return err(check.reason);
          resolvedSavePath = check.resolved;
        }

        const plan = compileSpec(spec, resolvedSavePath);

        await callBridge("openArena", { visible: false }, BRIDGE_TIMEOUTS.openArena);
        await callBridge("createNewModel");

        const moduleCaptions = new Map<string, string>();

        for (const step of plan.steps) {
          switch (step.type) {
            case "createModule": {
              const created = await callBridge("createModule", step.params, BRIDGE_TIMEOUTS.createModule) as { caption?: string };
              const specRef = step.moduleRef;
              if (specRef && created?.caption) {
                moduleCaptions.set(specRef, created.caption);
              }
              break;
            }
            case "setProperty": {
              const specCaption = step.params.caption as string;
              const realCaption = moduleCaptions.get(specCaption) || specCaption;
              const setResult = await callBridge("setModuleProperty", {
                ...step.params,
                caption: realCaption,
              }, BRIDGE_TIMEOUTS.setModuleProperty) as { captionAfter?: string };
              if (setResult?.captionAfter) {
                moduleCaptions.set(specCaption, setResult.captionAfter);
              }
              break;
            }
            case "addConnection": {
              const fromId = step.params.fromCaption as string;
              const toId = step.params.toCaption as string;
              await callBridge("addConnection", {
                fromCaption: moduleCaptions.get(fromId) || fromId,
                toCaption: moduleCaptions.get(toId) || toId,
              });
              break;
            }
            case "setReplicationLength":
              await callBridge("setReplicationLength", step.params);
              break;
            case "saveModel":
              await callBridge("saveModel", step.params, BRIDGE_TIMEOUTS.saveModel);
              break;
            case "createEntity":
              await callBridge("createEntity", step.params);
              break;
            case "createResource":
              await callBridge("createResource", step.params);
              break;
            case "createQueue":
              await callBridge("createQueue", step.params);
              break;
            case "createSchedule":
              await callBridge("createSchedule", step.params);
              break;
            case "createSet":
              await callBridge("createSet", step.params);
              break;
            case "createFailure":
              await callBridge("createFailure", step.params);
              break;
          }
        }

        if (runAfter) {
          await callBridge("runModel", { batchMode: true, quietMode: true }, BRIDGE_TIMEOUTS.runModel);
        }

        result = {
          templateId,
          modelName: spec.name,
          modules: plan.modules,
          steps: plan.steps.length,
          savedAs: resolvedSavePath || `${spec.name}.doe`,
          ranSimulation: runAfter,
        };
        break;
      }

      // --- Results tools ---
      case "arena_extract_results": {
        const metrics = await extractResults(callBridge);
        result = { metrics };
        break;
      }

      case "arena_get_summary": {
        const simanResult = await callBridge("getModelResults", {}) as { results?: { modelName?: string; status?: string; simulationTime?: number } };
        const metrics = await extractResults(callBridge);
        result = {
          modelName: simanResult?.results?.modelName ?? "",
          runAt: new Date().toISOString(),
          status: simanResult?.results?.status ?? "unknown",
          simulationTime: simanResult?.results?.simulationTime ?? 0,
          metrics,
        };
        break;
      }

      case "arena_diagnose_model": {
        const diagMetrics = await extractResults(callBridge);
        const diagnosis = diagnose(diagMetrics);
        result = { diagnosis, metrics: diagMetrics };
        break;
      }

      case "arena_generate_report": {
        const reportMetrics = await extractResults(callBridge);
        const reportDiagnosis = diagnose(reportMetrics);
        const simanInfo = await callBridge("getModelResults", {}) as { results?: { modelName?: string; status?: string; simulationTime?: number } };
        const report = generateReport(
          {
            modelName: simanInfo?.results?.modelName ?? "Arena Model",
            runAt: new Date().toISOString(),
            status: simanInfo?.results?.status ?? "completed",
            simulationTime: simanInfo?.results?.simulationTime ?? 0,
            metrics: reportMetrics,
          },
          reportDiagnosis,
        );
        result = report;
        break;
      }

      // --- Scenario tools ---
      case "arena_run_experiment": {
        const config = args as unknown as ExperimentConfig;
        if (!config.baseSpec || !config.scenarios || config.scenarios.length < 2) {
          return err("arena_run_experiment requires baseSpec and at least 2 scenarios");
        }
        const report = await runExperiment(callBridge, config);
        result = report;
        break;
      }

      // --- SIMAN / VBA tools ---
      case "arena_get_siman_source": {
        const simanResult = await getSource(callBridge);
        result = simanResult;
        break;
      }

      case "arena_get_siman_blocks": {
        const blocks = await getBlocks(callBridge);
        result = { blocks };
        break;
      }

      case "arena_get_vba_macros": {
        const macros = await getMacros(callBridge);
        result = { macros };
        break;
      }

      case "arena_run_vba_macro": {
        const macroName = args?.macroName as string;
        const ok = await runMacro(callBridge, macroName);
        result = { ok, message: ok ? `Macro "${macroName}" executed` : "Failed to execute macro" };
        break;
      }

      // --- Repair tools ---
      case "arena_repair_spec": {
        const rawSpec = args?.spec as ArenaModelSpec;
        const validation = validateSpec(rawSpec);
        result = repairSpec(rawSpec, validation);
        break;
      }

      case "arena_explain_spec_errors": {
        const rawSpec = args?.spec as ArenaModelSpec;
        const validation = validateSpec(rawSpec);
        result = { explanations: explainSpecErrors(validation) };
        break;
      }

      // --- Doe template tools ---
      case "arena_list_doe_templates": {
        result = listDoeTemplates();
        break;
      }

      case "arena_clone_doe_template": {
        const templateId = args?.templateId as string;
        const saveAs = args?.saveAs as string;
        result = cloneDoeTemplate(templateId, saveAs);
        break;
      }

      // --- Arena Spec tools ---
      case "arena_validate_spec": {
        const spec = args?.spec as ArenaModelSpec;
        const validation = validateSpec(spec);
        result = validation;
        break;
      }

      case "arena_build_model": {
        const spec = args?.spec as ArenaModelSpec;
        const rawSaveAs = args?.saveAs as string | undefined;
        const runAfter = args?.runAfterBuild === true;

        // 1. Validate spec
        const validation = validateSpec(spec);
        if (!validation.valid) {
          return err(`Spec validation failed:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
        }

        // 2. Validate saveAs path
        let resolvedSavePath: string | undefined;
        if (rawSaveAs) {
          const check = isPathInWorkspace(rawSaveAs);
          if (!check.ok) return err(check.reason);
          resolvedSavePath = check.resolved;
        }

        // 3. Compile to build plan
        const plan = compileSpec(spec, resolvedSavePath);

        // 4. Execute build plan
        await callBridge("openArena", { visible: false }, BRIDGE_TIMEOUTS.openArena);
        await callBridge("createNewModel");

        // Track real captions from Arena (Arena may assign "Create 1", not spec id)
        const moduleCaptions = new Map<string, string>();

        for (const step of plan.steps) {
          switch (step.type) {
            case "createModule": {
              const created = await callBridge("createModule", step.params, BRIDGE_TIMEOUTS.createModule) as { caption?: string };
              const specRef = step.moduleRef;
              if (specRef && created?.caption) {
                moduleCaptions.set(specRef, created.caption);
              }
              break;
            }
            case "setProperty": {
              // Use real caption if available, then fall back to spec id
              const specCaption = step.params.caption as string;
              const realCaption = moduleCaptions.get(specCaption) || specCaption;
              const setResult = await callBridge("setModuleProperty", {
                ...step.params,
                caption: realCaption,
              }, BRIDGE_TIMEOUTS.setModuleProperty) as { captionAfter?: string };
              if (setResult?.captionAfter) {
                moduleCaptions.set(specCaption, setResult.captionAfter);
              }
              break;
            }
            case "addConnection": {
              // Resolve both from/to using real captions
              const fromId = step.params.fromCaption as string;
              const toId = step.params.toCaption as string;
              await callBridge("addConnection", {
                fromCaption: moduleCaptions.get(fromId) || fromId,
                toCaption: moduleCaptions.get(toId) || toId,
              });
              break;
            }
            case "setReplicationLength":
              await callBridge("setReplicationLength", step.params);
              break;
            case "saveModel":
              await callBridge("saveModel", step.params, BRIDGE_TIMEOUTS.saveModel);
              break;
            case "createEntity":
              await callBridge("createEntity", step.params);
              break;
            case "createResource":
              await callBridge("createResource", step.params);
              break;
            case "createQueue":
              await callBridge("createQueue", step.params);
              break;
            case "createSchedule":
              await callBridge("createSchedule", step.params);
              break;
            case "createSet":
              await callBridge("createSet", step.params);
              break;
            case "createFailure":
              await callBridge("createFailure", step.params);
              break;
          }
        }

        // 5. Run if requested
        if (runAfter) {
          await callBridge("runModel", { batchMode: true, quietMode: true }, BRIDGE_TIMEOUTS.runModel);
        }

        result = {
          modelName: spec.name,
          modules: plan.modules,
          steps: plan.steps.length,
          savedAs: resolvedSavePath || `${spec.name}.doe`,
          ranSimulation: runAfter,
          warnings: validation.warnings,
        };
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
