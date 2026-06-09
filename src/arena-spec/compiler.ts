import type { ArenaModelSpec, FlowModule } from "./schema.js";
import type { CompileStep } from "./modules/index.js";
import type { DataStep } from "./data/index.js";
import { compileCreate } from "./modules/create.js";
import { compileProcess } from "./modules/process.js";
import { compileDispose } from "./modules/dispose.js";
import { compileDecide } from "./modules/decide.js";
import { compileAssign } from "./modules/assign.js";
import { compileEntities } from "./data/entities.js";
import { compileResources } from "./data/resources.js";
import { calculateLayout } from "./layout.js";
import { validateSpec } from "./validator.js";

export type CompilePlan = {
  steps: Array<CompileStep | DataStep>;
  modules: Array<{ id: string; type: string; caption: string }>;
};

export function compileSpec(spec: ArenaModelSpec, savePath?: string): CompilePlan {
  const validation = validateSpec(spec);
  if (!validation.valid) {
    throw new Error(`Spec validation failed:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  const layout = calculateLayout(spec);
  const layoutMap = new Map(layout.map((p) => [p.id, p]));
  const steps: Array<CompileStep | DataStep> = [];
  const modules: Array<{ id: string; type: string; caption: string }> = [];

  // 1. Create entities
  if (spec.entities && spec.entities.length > 0) {
    steps.push(...compileEntities(spec.entities));
  }

  // 2. Create resources
  if (spec.resources && spec.resources.length > 0) {
    steps.push(...compileResources(spec.resources));
  }

  // 3. Create flow modules
  for (const mod of spec.flow) {
    const pos = layoutMap.get(mod.id);
    if (!pos) throw new Error(`No layout position for module: ${mod.id}`);

    let modSteps: CompileStep[];
    switch (mod.type) {
      case "create":
        modSteps = compileCreate(mod as any, pos);
        break;
      case "process":
        modSteps = compileProcess(mod as any, pos);
        break;
      case "dispose":
        modSteps = compileDispose(mod as any, pos);
        break;
      case "decide":
        modSteps = compileDecide(mod as any, pos);
        break;
      case "assign":
        modSteps = compileAssign(mod as any, pos);
        break;
      default:
        throw new Error(`Unsupported module type: ${mod.type}`);
    }
    steps.push(...modSteps);
    modules.push({ id: mod.id, type: mod.type, caption: mod.id });
  }

  // 4. Add connections
  for (const [from, to] of spec.connections) {
    steps.push({
      type: "addConnection",
      moduleRef: from,
      params: { fromCaption: from, toCaption: to },
    });
  }

  // 5. Set replication length if specified
  if (spec.replicationLength !== undefined) {
    steps.push({
      type: "setReplicationLength",
      params: { length: spec.replicationLength },
    });
  }

  // 6. Save model
  const finalPath = savePath || `${spec.name}.doe`;
  steps.push({
    type: "saveModel",
    params: { path: finalPath },
  });

  return { steps, modules };
}
