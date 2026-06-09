import type {
  ArenaModelSpec,
  FlowModule,
  CreateModule,
  ProcessModule,
  DecideModule,
  BatchModule,
} from "./schema.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export function validateSpec(spec: ArenaModelSpec): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must have name
  if (!spec.name || spec.name.trim() === "") {
    errors.push("Model must have a name");
  }

  // Must have at least one Create
  const creates = spec.flow.filter((m) => m.type === "create");
  if (creates.length === 0) {
    errors.push("Model must have at least one Create module");
  }

  // Must have at least one Dispose
  const disposes = spec.flow.filter((m) => m.type === "dispose");
  if (disposes.length === 0) {
    errors.push("Model must have at least one Dispose module");
  }

  // All IDs must be unique
  const ids = spec.flow.map((m) => m.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    errors.push("All flow module IDs must be unique");
  }

  // All connections must reference existing module IDs
  const idSet = new Set(ids);
  for (const [from, to] of spec.connections) {
    if (!idSet.has(from)) {
      errors.push(`Connection references non-existent source module: "${from}"`);
    }
    if (!idSet.has(to)) {
      errors.push(`Connection references non-existent target module: "${to}"`);
    }
  }

  // If entities defined, Create must reference an existing entity
  if (spec.entities && spec.entities.length > 0) {
    const entityIds = new Set(spec.entities.map((e) => e.id));
    for (const create of creates) {
      if (!entityIds.has(create.entity)) {
        errors.push(`Create "${create.id}" references non-existent entity: "${create.entity}"`);
      }
    }
  }

  // Process modules: if resource is specified, it must exist
  if (spec.resources && spec.resources.length > 0) {
    const resourceIds = new Set(spec.resources.map((r) => r.id));
    const processes = spec.flow.filter((m): m is ProcessModule => m.type === "process");
    for (const proc of processes) {
      if (proc.resource && !resourceIds.has(proc.resource)) {
        errors.push(`Process "${proc.id}" references non-existent resource: "${proc.resource}"`);
      }
    }
  }

  // Decide: check probability branches sum
  for (const mod of spec.flow) {
    if (mod.type === "decide") {
      const decide = mod as DecideModule;
      const probSum = decide.branches
        .filter((b): b is { type: "probability"; value: number } => b.type === "probability")
        .reduce((sum, b) => sum + b.value, 0);
      if (probSum > 0 && Math.abs(probSum - 1) > 0.001) {
        warnings.push(`Decide "${decide.id}": probability branches sum to ${probSum}, expected 1`);
      }
    }
  }

  // Connections must not have duplicate entries
  const connSet = new Set(spec.connections.map(([a, b]) => `${a}->${b}`));
  if (connSet.size !== spec.connections.length) {
    errors.push("Duplicate connections found");
  }

  // Batch: batchSize must be > 1
  for (const mod of spec.flow) {
    if (mod.type === "batch") {
      const batch = mod as BatchModule;
      if (batch.batchSize < 2) {
        errors.push(`Batch "${batch.id}": batchSize must be at least 2`);
      }
    }
  }

  // Replications must be positive
  if (spec.replications !== undefined && spec.replications < 1) {
    errors.push("Replications must be at least 1");
  }
  if (spec.replicationLength !== undefined && spec.replicationLength < 1) {
    errors.push("ReplicationLength must be at least 1");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
