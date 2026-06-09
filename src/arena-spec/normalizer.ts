import type { ArenaModelSpec, EntityDef, ResourceDef, FlowModule } from "./schema.js";

export type NormalizedSpec = ArenaModelSpec & {
  _normalized: true;
};

const ID_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function toSafeId(name: string): string {
  return name
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1")
    || "_unnamed";
}

export function ensureSafeId(id: string): string {
  if (ID_RE.test(id)) return id;
  return toSafeId(id);
}

export function normalizeSpec(raw: ArenaModelSpec): NormalizedSpec {
  const spec = { ...raw };

  spec.name = spec.name?.trim() || "UnnamedModel";

  const entityMap = new Map<string, string>();
  if (spec.entities) {
    spec.entities = spec.entities.map((e) => {
      const safeId = ensureSafeId(e.id);
      entityMap.set(e.id, safeId);
      return { ...e, id: safeId, name: e.name || safeId };
    });
  }

  const resourceMap = new Map<string, string>();
  if (spec.resources) {
    spec.resources = spec.resources.map((r) => {
      const safeId = ensureSafeId(r.id);
      resourceMap.set(r.id, safeId);
      return { ...r, id: safeId, name: r.name || safeId };
    });
  }

  const queueMap = new Map<string, string>();
  if (spec.queues) {
    spec.queues = spec.queues.map((q) => {
      const safeId = ensureSafeId(q.id);
      queueMap.set(q.id, safeId);
      return { ...q, id: safeId, name: q.name || safeId };
    });
  }

  const varMap = new Map<string, string>();
  if (spec.variables) {
    spec.variables = spec.variables.map((v) => {
      const safeId = ensureSafeId(v.id);
      varMap.set(v.id, safeId);
      return { ...v, id: safeId, name: v.name || safeId };
    });
  }

  const attrMap = new Map<string, string>();
  if (spec.attributes) {
    spec.attributes = spec.attributes.map((a) => {
      const safeId = ensureSafeId(a.id);
      attrMap.set(a.id, safeId);
      return { ...a, id: safeId, name: a.name || safeId };
    });
  }

  // Normalize flow modules
  spec.flow = spec.flow.map((mod) => {
    const m: FlowModule = { ...mod };
    m.id = ensureSafeId(mod.id);
    return m;
  });

  // Normalize connections (resolve remapped IDs)
  spec.connections = spec.connections.map(([from, to]) => [
    ensureSafeId(from),
    ensureSafeId(to),
  ] as [string, string]);

  // Normalize optional fields
  if (spec.timeUnits) spec.timeUnits = spec.timeUnits.charAt(0).toUpperCase() + spec.timeUnits.slice(1).toLowerCase() as any;
  if (spec.baseTimeUnits) spec.baseTimeUnits = spec.baseTimeUnits.charAt(0).toUpperCase() + spec.baseTimeUnits.slice(1).toLowerCase() as any;

  return spec as NormalizedSpec;
}

export function hasUnsafeIds(spec: ArenaModelSpec): boolean {
  const check = (id: string) => !ID_RE.test(id);
  if (check(spec.name)) return true;
  for (const mod of spec.flow) {
    if (check(mod.id)) return true;
  }
  if (spec.entities) { for (const e of spec.entities) { if (check(e.id)) return true; } }
  if (spec.resources) { for (const r of spec.resources) { if (check(r.id)) return true; } }
  if (spec.queues) { for (const q of spec.queues) { if (check(q.id)) return true; } }
  if (spec.variables) { for (const v of spec.variables) { if (check(v.id)) return true; } }
  if (spec.attributes) { for (const a of spec.attributes) { if (check(a.id)) return true; } }
  return false;
}
