import type { ArenaModelSpec, FlowModule, CreateModule, ProcessModule, DecideModule, AssignModule, RecordModule, BatchModule, SeparateModule, HoldModule, SignalModule, MatchModule, SearchModule, StoreModule, UnstoreModule, ReadWriteModule, StationModule, RouteModule, EnterModule, LeaveModule, PickStationModule, TransporterModule, ConveyorModule, AccessModule, ReleaseModule } from "./schema.js";
import type { CompileStep } from "./modules/index.js";
import type { DataStep } from "./data/index.js";
import { compileCreate } from "./modules/create.js";
import { compileProcess } from "./modules/process.js";
import { compileDispose } from "./modules/dispose.js";
import { compileDecide } from "./modules/decide.js";
import { compileAssign } from "./modules/assign.js";
import { compileRecord } from "./modules/record.js";
import { compileBatch } from "./modules/batch.js";
import { compileSeparate } from "./modules/separate.js";
import { compileHold } from "./modules/hold.js";
import { compileSignal } from "./modules/signal.js";
import { compileMatch } from "./modules/match.js";
import { compileSearch } from "./modules/search.js";
import { compileStore } from "./modules/store.js";
import { compileUnstore } from "./modules/unstore.js";
import { compileReadWrite } from "./modules/readwrite.js";
import { compileStation } from "./modules/station.js";
import { compileRoute } from "./modules/route.js";
import { compileEnter } from "./modules/enter.js";
import { compileLeave } from "./modules/leave.js";
import { compilePickStation } from "./modules/pickstation.js";
import { compileTransporterModule } from "./modules/transporter.js";
import { compileConveyorModule } from "./modules/conveyor.js";
import { compileAccess } from "./modules/access.js";
import { compileRelease } from "./modules/release.js";
import { compileEntities } from "./data/entities.js";
import { compileResources } from "./data/resources.js";
import { compileQueues } from "./data/queues.js";
import { compileSchedules } from "./data/schedules.js";
import { compileSets } from "./data/sets.js";
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

  // 3. Create queues
  if (spec.queues && spec.queues.length > 0) {
    steps.push(...compileQueues(spec.queues));
  }

  // 4. Create schedules
  if (spec.schedules && spec.schedules.length > 0) {
    steps.push(...compileSchedules(spec.schedules));
  }

  // 5. Create sets
  if (spec.sets && spec.sets.length > 0) {
    steps.push(...compileSets(spec.sets));
  }

  // Build ID → name maps for entity and resource references
  const entityNameMap = new Map(spec.entities?.map((e) => [e.id, e.name || e.id]) ?? []);
  const resourceNameMap = new Map(spec.resources?.map((r) => [r.id, r.name || r.id]) ?? []);

  // 6. Create flow modules
  for (const mod of spec.flow) {
    const pos = layoutMap.get(mod.id);
    if (!pos) throw new Error(`No layout position for module: ${mod.id}`);

    let modSteps: CompileStep[];
    switch (mod.type) {
      case "create": {
        const createMod = mod as CreateModule;
        const resolvedEntity = entityNameMap.get(createMod.entity) ?? createMod.entity;
        modSteps = compileCreate({ ...createMod, entity: resolvedEntity }, pos);
        break;
      }
      case "process": {
        const procMod = mod as ProcessModule;
        const resolvedResource = procMod.resource
          ? (resourceNameMap.get(procMod.resource) ?? procMod.resource)
          : undefined;
        modSteps = compileProcess({ ...procMod, resource: resolvedResource }, pos);
        break;
      }
      case "dispose":
        modSteps = compileDispose(mod as any, pos);
        break;
      case "decide":
        modSteps = compileDecide(mod as any, pos);
        break;
      case "assign":
        modSteps = compileAssign(mod as any, pos);
        break;
      case "record":
        modSteps = compileRecord(mod as any, pos);
        break;
      case "batch":
        modSteps = compileBatch(mod as any, pos);
        break;
      case "separate":
        modSteps = compileSeparate(mod as any, pos);
        break;
      case "hold":
        modSteps = compileHold(mod as HoldModule, pos);
        break;
      case "signal":
        modSteps = compileSignal(mod as SignalModule, pos);
        break;
      case "match":
        modSteps = compileMatch(mod as MatchModule, pos);
        break;
      case "search":
        modSteps = compileSearch(mod as SearchModule, pos);
        break;
      case "store":
        modSteps = compileStore(mod as StoreModule, pos);
        break;
      case "unstore":
        modSteps = compileUnstore(mod as UnstoreModule, pos);
        break;
      case "readwrite":
        modSteps = compileReadWrite(mod as ReadWriteModule, pos);
        break;
      case "station":
        modSteps = compileStation(mod as StationModule, pos);
        break;
      case "route":
        modSteps = compileRoute(mod as RouteModule, pos);
        break;
      case "enter":
        modSteps = compileEnter(mod as EnterModule, pos);
        break;
      case "leave":
        modSteps = compileLeave(mod as LeaveModule, pos);
        break;
      case "pickstation":
        modSteps = compilePickStation(mod as PickStationModule, pos);
        break;
      case "transporter":
        modSteps = compileTransporterModule(mod as TransporterModule, pos);
        break;
      case "conveyor":
        modSteps = compileConveyorModule(mod as ConveyorModule, pos);
        break;
      case "access":
        modSteps = compileAccess(mod as AccessModule, pos);
        break;
      case "release":
        modSteps = compileRelease(mod as ReleaseModule, pos);
        break;
      default:
        throw new Error(`Unsupported module type: ${(mod as FlowModule).type}`);
    }
    steps.push(...modSteps);
    modules.push({ id: mod.id, type: mod.type, caption: mod.id });
  }

  // 7. Add connections
  for (const [from, to] of spec.connections) {
    steps.push({
      type: "addConnection",
      moduleRef: from,
      params: { fromCaption: from, toCaption: to },
    });
  }

  // 8. Set replication length if specified
  if (spec.replicationLength !== undefined) {
    steps.push({
      type: "setReplicationLength",
      params: { length: spec.replicationLength },
    });
  }

  // 9. Save model
  const finalPath = savePath || `${spec.name}.doe`;
  steps.push({
    type: "saveModel",
    params: { path: finalPath },
  });

  return { steps, modules };
}
