import type {
  ArenaModelSpec,
  CreateModule,
  ProcessModule,
  DecideModule,
  BatchModule,
  Distribution,
  EntityDef,
  ResourceDef,
  FlowModule,
  HoldModule,
  SignalModule,
  MatchModule,
  ReadWriteModule,
  StationModule,
  RouteModule,
  EnterModule,
  LeaveModule,
  PickStationModule,
  AccessModule,
  ReleaseModule,
} from "./schema.js";
import { validateDistribution } from "./distributions.js";
import { isValidTimeUnit } from "./units.js";

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

  // Validate time units
  if (spec.timeUnits && !isValidTimeUnit(spec.timeUnits)) {
    errors.push(`Invalid timeUnits: "${spec.timeUnits}". Use Hours, Minutes, or Seconds`);
  }

  // Validate baseTimeUnits
  if (spec.baseTimeUnits && !isValidTimeUnit(spec.baseTimeUnits)) {
    errors.push(`Invalid baseTimeUnits: "${spec.baseTimeUnits}". Use Hours, Minutes, or Seconds`);
  }

  // WarmupPeriod must be positive
  if (spec.warmupPeriod !== undefined && spec.warmupPeriod < 0) {
    errors.push("warmupPeriod must be >= 0");
  }

  // All flow module IDs must be unique
  const ids = spec.flow.map((m) => m.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    errors.push(`Duplicate flow module IDs: ${[...new Set(dupes)].join(", ")}`);
  }

  // Check disconnected modules
  const connected = new Set<string>();
  for (const [from, to] of spec.connections) {
    connected.add(from);
    connected.add(to);
  }
  for (const mod of spec.flow) {
    if (!connected.has(mod.id) && spec.connections.length > 0) {
      warnings.push(`Module "${mod.id}" has no connections`);
    }
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

  // If entities defined, check for duplicates
  const entityIds = new Set<string>();
  if (spec.entities) {
    for (const ent of spec.entities) {
      if (entityIds.has(ent.id)) {
        errors.push(`Duplicate entity ID: "${ent.id}"`);
      }
      entityIds.add(ent.id);
    }
  }

  // If entities defined, Create must reference an existing entity
  if (spec.entities && spec.entities.length > 0) {
    for (const create of creates) {
      if (!entityIds.has(create.entity)) {
        errors.push(`Create "${create.id}" references non-existent entity: "${create.entity}"`);
      }
    }
  }

  // Resources: check duplicates and references
  const resourceIds = new Set<string>();
  if (spec.resources) {
    for (const res of spec.resources) {
      if (resourceIds.has(res.id)) {
        errors.push(`Duplicate resource ID: "${res.id}"`);
      }
      resourceIds.add(res.id);
    }
  }

  // Process modules: if resource is specified, it must exist
  const processes = spec.flow.filter((m): m is ProcessModule => m.type === "process");
  for (const proc of processes) {
    if (proc.resource && resourceIds.size > 0 && !resourceIds.has(proc.resource)) {
      errors.push(`Process "${proc.id}" references non-existent resource: "${proc.resource}"`);
    }
  }

  // Process: validate delay distribution
  for (const proc of processes) {
    const distErr = validateDistribution(proc.delay.distribution);
    if (distErr) {
      errors.push(`Process "${proc.id}" delay: ${distErr}`);
    }
    if (proc.delay.units && !isValidTimeUnit(proc.delay.units)) {
      errors.push(`Process "${proc.id}" invalid delay units: "${proc.delay.units}"`);
    }
  }

  // Create: validate arrival distribution
  for (const create of creates) {
    const distErr = validateDistribution(create.arrival.distribution);
    if (distErr) {
      errors.push(`Create "${create.id}" arrival: ${distErr}`);
    }
    if (create.arrival.entitiesPerArrival !== undefined && create.arrival.entitiesPerArrival < 1) {
      errors.push(`Create "${create.id}": entitiesPerArrival must be >= 1`);
    }
    if (create.arrival.maxArrivals !== undefined && create.arrival.maxArrivals < 1) {
      errors.push(`Create "${create.id}": maxArrivals must be >= 1`);
    }
  }

  // Decide: check probability branches sum
  for (const mod of spec.flow) {
    if (mod.type === "decide") {
      const decide = mod as DecideModule;
      if (decide.branches.length === 0) {
        errors.push(`Decide "${decide.id}" must have at least one branch`);
        continue;
      }
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
    errors.push("replicationLength must be at least 1");
  }

  // Schedules validation
  if (spec.schedules) {
    for (const sched of spec.schedules) {
      if (!sched.durations || sched.durations.length === 0) {
        errors.push(`Schedule "${sched.id}" must have at least one duration`);
      }
      for (const d of sched.durations) {
        if (d.length <= 0) {
          errors.push(`Schedule "${sched.id}": duration length must be > 0`);
        }
      }
    }
  }

  // Queues validation
  if (spec.queues) {
    const queueIds = new Set<string>();
    for (const q of spec.queues) {
      if (queueIds.has(q.id)) {
        errors.push(`Duplicate queue ID: "${q.id}"`);
      }
      queueIds.add(q.id);
    }
  }

  // Attributes validation
  if (spec.attributes) {
    const attrIds = new Set<string>();
    for (const a of spec.attributes) {
      if (attrIds.has(a.id)) {
        errors.push(`Duplicate attribute ID: "${a.id}"`);
      }
      attrIds.add(a.id);
    }
  }

  // Variables validation
  if (spec.variables) {
    const varIds = new Set<string>();
    for (const v of spec.variables) {
      if (varIds.has(v.id)) {
        errors.push(`Duplicate variable ID: "${v.id}"`);
      }
      varIds.add(v.id);
    }
  }

  // Hold: must specify action
  for (const mod of spec.flow) {
    if (mod.type === "hold") {
      const hold = mod as HoldModule;
      if (!hold.action) {
        errors.push(`Hold "${hold.id}" must specify an action (wait, scan, or signal)`);
      }
      if (hold.action === "scan" && !hold.scanCondition) {
        errors.push(`Hold "${hold.id}" with action "scan" must specify a scanCondition`);
      }
      if (hold.action === "signal" && !hold.signal) {
        errors.push(`Hold "${hold.id}" with action "signal" must specify a signal name`);
      }
    }
  }

  // Signal: must have signal name and limit
  for (const mod of spec.flow) {
    if (mod.type === "signal") {
      const sig = mod as SignalModule;
      if (!sig.signal) {
        errors.push(`Signal "${sig.id}" must specify a signal name`);
      }
      if (sig.limit === undefined || sig.limit < 1) {
        errors.push(`Signal "${sig.id}" must have a limit >= 1`);
      }
    }
  }

  // Match: must have at least 2 entities
  for (const mod of spec.flow) {
    if (mod.type === "match") {
      const match = mod as MatchModule;
      if (!match.entities || match.entities.length < 2) {
        errors.push(`Match "${match.id}" must have at least 2 entities to match`);
      }
    }
  }

  // ReadWrite: must specify mode and filename
  for (const mod of spec.flow) {
    if (mod.type === "readwrite") {
      const rw = mod as ReadWriteModule;
      if (!rw.mode) {
        errors.push(`ReadWrite "${rw.id}" must specify a mode (read or write)`);
      }
      if (!rw.filename) {
        errors.push(`ReadWrite "${rw.id}" must specify a filename`);
      }
    }
  }

  // Station: must have station name
  for (const mod of spec.flow) {
    if (mod.type === "station") {
      const s = mod as StationModule;
      if (!s.station) {
        errors.push(`Station "${s.id}" must specify a station name`);
      }
    }
  }

  // Route: must have station and route time
  for (const mod of spec.flow) {
    if (mod.type === "route") {
      const r = mod as RouteModule;
      if (!r.station) {
        errors.push(`Route "${r.id}" must specify a station name`);
      }
      if (r.routeTime === undefined || r.routeTime === null) {
        errors.push(`Route "${r.id}" must specify a route time`);
      }
      if (r.units && !isValidTimeUnit(r.units)) {
        errors.push(`Route "${r.id}" invalid route time units: "${r.units}"`);
      }
    }
  }

  // Enter: must have station
  for (const mod of spec.flow) {
    if (mod.type === "enter") {
      const e = mod as EnterModule;
      if (!e.station) {
        errors.push(`Enter "${e.id}" must specify a station name`);
      }
    }
  }

  // Leave: must have station
  for (const mod of spec.flow) {
    if (mod.type === "leave") {
      const l = mod as LeaveModule;
      if (!l.station) {
        errors.push(`Leave "${l.id}" must specify a station name`);
      }
    }
  }

  // PickStation: must have at least one station and valid rule
  for (const mod of spec.flow) {
    if (mod.type === "pickstation") {
      const p = mod as PickStationModule;
      if (!p.stations || p.stations.length === 0) {
        errors.push(`PickStation "${p.id}" must have at least one station`);
      }
      const validRules = ["random", "smallestQueue", "largestQueue", "specific"];
      if (!validRules.includes(p.rule)) {
        errors.push(`PickStation "${p.id}" invalid rule "${p.rule}". Must be one of: ${validRules.join(", ")}`);
      }
      if (p.rule === "specific" && !p.specificStation) {
        errors.push(`PickStation "${p.id}" with rule "specific" must specify a specificStation`);
      }
    }
  }

  // Access: must have conveyor name
  for (const mod of spec.flow) {
    if (mod.type === "access") {
      const a = mod as AccessModule;
      if (!a.conveyor) {
        errors.push(`Access "${a.id}" must specify a conveyor name`);
      }
    }
  }

  // Release: must have conveyor name
  for (const mod of spec.flow) {
    if (mod.type === "release") {
      const r = mod as ReleaseModule;
      if (!r.conveyor) {
        errors.push(`Release "${r.id}" must specify a conveyor name`);
      }
    }
  }

  // StationDef validation
  if (spec.stations) {
    const stationIds = new Set<string>();
    for (const s of spec.stations) {
      if (stationIds.has(s.id)) {
        errors.push(`Duplicate station ID: "${s.id}"`);
      }
      stationIds.add(s.id);
    }
  }

  // TransporterDef validation
  if (spec.transporters) {
    const transporterIds = new Set<string>();
    for (const t of spec.transporters) {
      if (transporterIds.has(t.id)) {
        errors.push(`Duplicate transporter ID: "${t.id}"`);
      }
      transporterIds.add(t.id);
      if (t.capacity < 1) {
        errors.push(`Transporter "${t.id}" capacity must be >= 1`);
      }
      if (t.speed <= 0) {
        errors.push(`Transporter "${t.id}" speed must be > 0`);
      }
    }
  }

  // ConveyorDef validation
  if (spec.conveyors) {
    const conveyorIds = new Set<string>();
    for (const c of spec.conveyors) {
      if (conveyorIds.has(c.id)) {
        errors.push(`Duplicate conveyor ID: "${c.id}"`);
      }
      conveyorIds.add(c.id);
      if (c.capacity < 1) {
        errors.push(`Conveyor "${c.id}" capacity must be >= 1`);
      }
      if (c.length <= 0) {
        errors.push(`Conveyor "${c.id}" length must be > 0`);
      }
      if (c.speed <= 0) {
        errors.push(`Conveyor "${c.id}" speed must be > 0`);
      }
    }
  }

  // DistanceDef validation
  if (spec.distances) {
    for (const d of spec.distances) {
      if (!d.from) {
        errors.push(`Distance definition must have a "from" station`);
      }
      if (!d.to) {
        errors.push(`Distance definition must have a "to" station`);
      }
      if (d.distance <= 0) {
        errors.push(`Distance from "${d.from}" to "${d.to}" must be > 0`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
