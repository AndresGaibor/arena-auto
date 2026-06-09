import type { ArenaModelSpec } from "./schema.js";
import type { ValidationResult } from "./validator.js";
import { validateSpec } from "./validator.js";

export type RepairAction = {
  type: string;
  description: string;
  autoFix: boolean;
};

export type RepairResult = {
  spec: ArenaModelSpec;
  repairs: RepairAction[];
  stillInvalid: string[];
};

function nextId(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export function repairSpec(spec: ArenaModelSpec, validation: ValidationResult): RepairResult {
  const repairs: RepairAction[] = [];
  const cloned: ArenaModelSpec = JSON.parse(JSON.stringify(spec));

  const usedIds = new Set(cloned.flow.map(m => m.id));
  const usedEntityIds = new Set((cloned.entities || []).map(e => e.id));
  const usedQueueIds = new Set((cloned.queues || []).map(q => q.id));

  // 1. Missing Dispose
  const hasDispose = cloned.flow.some(m => m.type === "dispose");
  if (!hasDispose) {
    const outgoingFrom = new Set(cloned.connections.map(c => c[0]));
    const terminal = cloned.flow.filter(m => m.type !== "dispose" && !outgoingFrom.has(m.id));
    for (const mod of terminal) {
      const disposeId = nextId("Dispose", usedIds);
      usedIds.add(disposeId);
      cloned.flow.push({ id: disposeId, type: "dispose" });
      cloned.connections.push([mod.id, disposeId]);
      repairs.push({
        type: "add_dispose",
        description: `Added Dispose module "${disposeId}" after "${mod.id}"`,
        autoFix: true,
      });
    }
  }

  // 2. Missing Queue for Process modules that reference a resource
  if (cloned.resources && cloned.resources.length > 0) {
    const queueIds = new Set((cloned.queues || []).map(q => q.id));
    if (!cloned.queues) cloned.queues = [];
    for (const mod of cloned.flow) {
      if (mod.type === "process" && (mod as any).resource) {
        const resId = (mod as any).resource as string;
        const expectedQueue = `${resId}.Queue`;
        if (!queueIds.has(expectedQueue)) {
          queueIds.add(expectedQueue);
          (cloned.queues as any[]).push({ id: expectedQueue, discipline: "FIFO" });
          repairs.push({
            type: "add_queue",
            description: `Added Queue "${expectedQueue}" for resource "${resId}" used by Process "${mod.id}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // 3. Normalize probabilities near 1
  for (const mod of cloned.flow) {
    if (mod.type === "decide") {
      const decide = mod as any;
      const probBranches = decide.branches.filter((b: any) => b.type === "probability");
      if (probBranches.length > 0) {
        const probSum = probBranches.reduce((sum: number, b: any) => sum + b.value, 0);
        if (probSum > 0 && Math.abs(probSum - 1) > 0.001 && Math.abs(probSum - 1) <= 0.05) {
          const factor = 1 / probSum;
          for (const b of probBranches) {
            b.value = Math.round(b.value * factor * 1000) / 1000;
          }
          repairs.push({
            type: "normalize_probabilities",
            description: `Normalized Decide "${decide.id}" probabilities from ${probSum.toFixed(3)} to 1`,
            autoFix: true,
          });
        }
      }
    }
  }

  // 4. Rename duplicate flow module IDs
  const seenIds = new Map<string, number[]>();
  cloned.flow.forEach((m, i) => {
    const entry = seenIds.get(m.id) || [];
    entry.push(i);
    seenIds.set(m.id, entry);
  });
  for (const [id, indices] of seenIds) {
    if (indices.length > 1) {
      let suffix = 2;
      for (const idx of indices) {
        if (idx === indices[0]) continue;
        const newId = `${id}_${suffix}`;
        const oldId = cloned.flow[idx]!.id;
        cloned.flow[idx]!.id = newId;
        for (const conn of cloned.connections) {
          if (conn[0] === oldId) conn[0] = newId;
          if (conn[1] === oldId) conn[1] = newId;
        }
        suffix++;
        repairs.push({
          type: "rename_duplicate_id",
          description: `Renamed duplicate flow module ID "${oldId}" to "${newId}"`,
          autoFix: true,
        });
      }
    }
  }

  // Rename duplicate entity IDs
  if (cloned.entities) {
    const arr = cloned.entities;
    const seenEntities = new Map<string, number[]>();
    arr.forEach((e, i) => {
      const entry = seenEntities.get(e.id) || [];
      entry.push(i);
      seenEntities.set(e.id, entry);
    });
    for (const [id, indices] of seenEntities) {
      if (indices.length > 1) {
        let suffix = 2;
        for (const idx of indices) {
          if (idx === indices[0]) continue;
          const newId = `${id}_${suffix}`;
          const oldId = arr[idx]!.id;
          arr[idx]!.id = newId;
          suffix++;
          repairs.push({
            type: "rename_duplicate_entity",
            description: `Renamed duplicate entity ID "${oldId}" to "${newId}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // Rename duplicate resource IDs
  if (cloned.resources) {
    const arr = cloned.resources;
    const seenResources = new Map<string, number[]>();
    arr.forEach((r, i) => {
      const entry = seenResources.get(r.id) || [];
      entry.push(i);
      seenResources.set(r.id, entry);
    });
    for (const [id, indices] of seenResources) {
      if (indices.length > 1) {
        let suffix = 2;
        for (const idx of indices) {
          if (idx === indices[0]) continue;
          const newId = `${id}_${suffix}`;
          const oldId = arr[idx]!.id;
          arr[idx]!.id = newId;
          suffix++;
          repairs.push({
            type: "rename_duplicate_resource",
            description: `Renamed duplicate resource ID "${oldId}" to "${newId}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // Rename duplicate queue IDs
  if (cloned.queues) {
    const arr = cloned.queues;
    const seenQueues = new Map<string, number[]>();
    arr.forEach((q, i) => {
      const entry = seenQueues.get(q.id) || [];
      entry.push(i);
      seenQueues.set(q.id, entry);
    });
    for (const [id, indices] of seenQueues) {
      if (indices.length > 1) {
        let suffix = 2;
        for (const idx of indices) {
          if (idx === indices[0]) continue;
          const newId = `${id}_${suffix}`;
          const oldId = arr[idx]!.id;
          arr[idx]!.id = newId;
          suffix++;
          repairs.push({
            type: "rename_duplicate_queue",
            description: `Renamed duplicate queue ID "${oldId}" to "${newId}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // Rename duplicate variable IDs
  if (cloned.variables) {
    const arr = cloned.variables;
    const seenVars = new Map<string, number[]>();
    arr.forEach((v, i) => {
      const entry = seenVars.get(v.id) || [];
      entry.push(i);
      seenVars.set(v.id, entry);
    });
    for (const [id, indices] of seenVars) {
      if (indices.length > 1) {
        let suffix = 2;
        for (const idx of indices) {
          if (idx === indices[0]) continue;
          const newId = `${id}_${suffix}`;
          const oldId = arr[idx]!.id;
          arr[idx]!.id = newId;
          suffix++;
          repairs.push({
            type: "rename_duplicate_variable",
            description: `Renamed duplicate variable ID "${oldId}" to "${newId}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // Rename duplicate attribute IDs
  if (cloned.attributes) {
    const arr = cloned.attributes;
    const seenAttrs = new Map<string, number[]>();
    arr.forEach((a, i) => {
      const entry = seenAttrs.get(a.id) || [];
      entry.push(i);
      seenAttrs.set(a.id, entry);
    });
    for (const [id, indices] of seenAttrs) {
      if (indices.length > 1) {
        let suffix = 2;
        for (const idx of indices) {
          if (idx === indices[0]) continue;
          const newId = `${id}_${suffix}`;
          const oldId = arr[idx]!.id;
          arr[idx]!.id = newId;
          suffix++;
          repairs.push({
            type: "rename_duplicate_attribute",
            description: `Renamed duplicate attribute ID "${oldId}" to "${newId}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // 5. Missing default values
  if (!cloned.timeUnits) {
    cloned.timeUnits = "Minutes";
    repairs.push({ type: "set_default", description: 'Set timeUnits to "Minutes"', autoFix: true });
  }
  if (cloned.replications === undefined || cloned.replications === null) {
    cloned.replications = 5;
    repairs.push({ type: "set_default", description: "Set replications to 5", autoFix: true });
  }
  if (cloned.replicationLength === undefined || cloned.replicationLength === null) {
    cloned.replicationLength = 480;
    repairs.push({ type: "set_default", description: "Set replicationLength to 480", autoFix: true });
  }

  // 6. Missing entity type on Create module
  for (const mod of cloned.flow) {
    if (mod.type === "create") {
      const create = mod as any;
      if (!create.entity || create.entity.trim() === "") {
        if (cloned.entities && cloned.entities.length > 0) {
          create.entity = cloned.entities[0]!.id;
          repairs.push({
            type: "assign_entity",
            description: `Assigned entity "${create.entity}" to Create module "${create.id}"`,
            autoFix: true,
          });
        } else {
          const entityId = nextId("Entity_1", usedEntityIds);
          usedEntityIds.add(entityId);
          if (!cloned.entities) cloned.entities = [];
          cloned.entities.push({ id: entityId });
          create.entity = entityId;
          repairs.push({
            type: "create_entity",
            description: `Created entity "${entityId}" and assigned to Create module "${create.id}"`,
            autoFix: true,
          });
        }
      }
    }
  }

  // Re-validate to determine remaining errors
  const revalidation = validateSpec(cloned);

  return { spec: cloned, repairs, stillInvalid: revalidation.errors };
}
