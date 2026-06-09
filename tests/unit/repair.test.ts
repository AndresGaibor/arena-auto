import { describe, it, expect } from "bun:test";
import { repairSpec } from "../../src/arena-spec/repair.js";
import { validateSpec } from "../../src/arena-spec/validator.js";
import type { ArenaModelSpec } from "../../src/arena-spec/schema.js";

function baseSpec(overrides?: Partial<ArenaModelSpec>): ArenaModelSpec {
  return {
    name: "test",
    timeUnits: "Minutes",
    replications: 5,
    replicationLength: 480,
    flow: [
      { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
      { id: "d1", type: "dispose" },
    ],
    connections: [["c1", "d1"]],
    ...overrides,
  };
}

describe("repairSpec - Missing Dispose", () => {
  it("adds a Dispose module when none exists", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
      ],
      connections: [],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "add_dispose")).toBe(true);
    expect(result.spec.flow.some((m) => m.type === "dispose")).toBe(true);
  });

  it("connects the new Dispose to the terminal module", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
      ],
      connections: [],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.spec.connections.length).toBe(1);
    expect(result.spec.connections[0]![0]).toBe("c1");
    expect(result.spec.connections[0]![1]).toBe("Dispose");
  });
});

describe("repairSpec - Missing Queue", () => {
  it("adds a queue for a Process referencing a resource", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      replications: 5,
      replicationLength: 480,
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "p1", type: "process", resource: "Server", delay: { distribution: { type: "EXPO", params: [4] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "p1"], ["p1", "d1"]],
      resources: [{ id: "Server", capacity: 1 }],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "add_queue")).toBe(true);
    expect(result.spec.queues?.some((q) => q.id === "Server.Queue")).toBe(true);
  });

  it("does not add queue if one already exists", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      replications: 5,
      replicationLength: 480,
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "p1", type: "process", resource: "Server", delay: { distribution: { type: "EXPO", params: [4] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "p1"], ["p1", "d1"]],
      resources: [{ id: "Server", capacity: 1 }],
      queues: [{ id: "Server.Queue" }],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "add_queue")).toBe(false);
  });
});

describe("repairSpec - Normalize probabilities", () => {
  it("normalizes probability branches summing near 1", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "dec1", type: "decide", branches: [{ type: "probability", value: 0.48 }, { type: "probability", value: 0.48 }] },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "dec1"], ["dec1", "d1"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "normalize_probabilities")).toBe(true);
    const decide = result.spec.flow.find((m) => m.id === "dec1") as any;
    const sum = decide.branches.reduce((s: number, b: any) => s + b.value, 0);
    expect(Math.abs(sum - 1)).toBeLessThanOrEqual(0.001);
  });

  it("does not normalize probabilities that sum to 1 already", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "dec1", type: "decide", branches: [{ type: "probability", value: 0.7 }, { type: "probability", value: 0.3 }] },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "dec1"], ["dec1", "d1"]],
    });
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "normalize_probabilities")).toBe(false);
  });
});

describe("repairSpec - Duplicate IDs", () => {
  it("renames duplicate flow module IDs", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      flow: [
        { id: "dup", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "dup", type: "dispose" },
      ],
      connections: [["dup", "dup"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "rename_duplicate_id")).toBe(true);
    const ids = result.spec.flow.map((m) => m.id);
    expect(ids[0]).toBe("dup");
    expect(ids[1]).toBe("dup_2");
  });

  it("renames duplicate entity IDs", () => {
    const spec = baseSpec({
      entities: [
        { id: "e1" },
        { id: "e1" },
      ],
    });
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "rename_duplicate_entity")).toBe(true);
    expect(result.spec.entities?.[0]?.id).toBe("e1");
    expect(result.spec.entities?.[1]?.id).toBe("e1_2");
  });

  it("renames duplicate resource IDs", () => {
    const spec = baseSpec({
      resources: [
        { id: "Res", capacity: 1 },
        { id: "Res", capacity: 2 },
      ],
    });
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "rename_duplicate_resource")).toBe(true);
    expect(result.spec.resources?.[1]?.id).toBe("Res_2");
  });

  it("renames duplicate queue IDs", () => {
    const spec = baseSpec({
      queues: [
        { id: "q1" },
        { id: "q1" },
      ],
    });
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "rename_duplicate_queue")).toBe(true);
  });

  it("renames duplicate variable IDs", () => {
    const spec = baseSpec({
      variables: [
        { id: "v1", type: "number" },
        { id: "v1", type: "number" },
      ],
    });
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "rename_duplicate_variable")).toBe(true);
  });

  it("renames duplicate attribute IDs", () => {
    const spec = baseSpec({
      attributes: [
        { id: "a1", type: "number" },
        { id: "a1", type: "number" },
      ],
    });
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "rename_duplicate_attribute")).toBe(true);
  });
});

describe("repairSpec - Missing defaults", () => {
  it("fills missing timeUnits", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "set_default" && r.description.includes("timeUnits"))).toBe(true);
    expect(result.spec.timeUnits).toBe("Minutes");
  });

  it("fills missing replications", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "set_default" && r.description.includes("replications"))).toBe(true);
    expect(result.spec.replications).toBe(5);
  });

  it("fills missing replicationLength", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      replications: 5,
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "set_default" && r.description.includes("replicationLength"))).toBe(true);
    expect(result.spec.replicationLength).toBe(480);
  });
});

describe("repairSpec - Missing entity type", () => {
  it("assigns first entity to Create with empty entity", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      flow: [
        { id: "c1", type: "create", entity: "", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
      entities: [{ id: "Customer" }],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "assign_entity")).toBe(true);
    const create = result.spec.flow.find((m) => m.id === "c1") as any;
    expect(create.entity).toBe("Customer");
  });

  it("creates entity if none exists", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      timeUnits: "Minutes",
      flow: [
        { id: "c1", type: "create", entity: "", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(result.repairs.some((r) => r.type === "create_entity")).toBe(true);
    const create = result.spec.flow.find((m) => m.id === "c1") as any;
    expect(create.entity).toBeTruthy();
    expect(result.spec.entities?.some((e) => e.id === create.entity)).toBe(true);
  });
});

describe("repairSpec - stillInvalid", () => {
  it("returns empty stillInvalid when fully repaired", () => {
    const spec: ArenaModelSpec = {
      name: "test",
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
    };
    const validation = validateSpec(spec);
    const result = repairSpec(spec, validation);
    expect(Array.isArray(result.stillInvalid)).toBe(true);
  });
});
