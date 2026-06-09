import { describe, it, expect } from "bun:test";
import { validateSpec } from "../../src/arena-spec/validator.js";
import type { ArenaModelSpec } from "../../src/arena-spec/schema.js";

function baseSpec(overrides?: Partial<ArenaModelSpec>): ArenaModelSpec {
  return {
    name: "test",
    flow: [
      { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
      { id: "d1", type: "dispose" },
    ],
    connections: [["c1", "d1"]],
    ...overrides,
  };
}

describe("validateSpec - entity validation", () => {
  it("rejects duplicate entity IDs", () => {
    const spec = baseSpec({
      entities: [
        { id: "e1", name: "Entity1" },
        { id: "e1", name: "Entity2" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate entity ID"))).toBe(true);
  });

  it("rejects Create referencing non-existent entity", () => {
    const spec = baseSpec({
      entities: [{ id: "e2", name: "E2" }],
      flow: [
        { id: "c1", type: "create", entity: "ghost", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("ghost"))).toBe(true);
  });

  it("accepts Create referencing existing entity", () => {
    const spec = baseSpec({
      entities: [{ id: "e1", name: "Entity1" }],
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(true);
  });
});

describe("validateSpec - resource validation", () => {
  it("rejects duplicate resource IDs", () => {
    const spec = baseSpec({
      resources: [
        { id: "r1", capacity: 1 },
        { id: "r1", capacity: 2 },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate resource ID"))).toBe(true);
  });

  it("rejects Process with non-existent resource", () => {
    const spec = baseSpec({
      resources: [{ id: "r1", capacity: 1 }],
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "p1", type: "process", resource: "ghost", delay: { distribution: { type: "EXPO", params: [4] } } },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "p1"], ["p1", "d1"]],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("ghost"))).toBe(true);
  });
});

describe("validateSpec - distribution validation", () => {
  it("rejects EXPO with negative mean", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [-1] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("mean > 0"))).toBe(true);
  });

  it("rejects UNIF with min >= max", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "UNIF", params: [5, 3] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("min < max"))).toBe(true);
  });

  it("rejects TRIA with out-of-order params", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "TRIA", params: [5, 3, 4] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("min < mode < max"))).toBe(true);
  });

  it("rejects NORM with negative stddev", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "NORM", params: [10, -1] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
  });

  it("rejects ERLA with non-integer k", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "ERLA", params: [5, 1.5] } } },
        { id: "d1", type: "dispose" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
  });

  it("accepts valid distributions", () => {
    const specs: ArenaModelSpec[] = [
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "UNIF", params: [1, 5] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "TRIA", params: [1, 3, 5] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "NORM", params: [10, 2] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "ERLA", params: [10, 3] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "WEIB", params: [2, 1] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "GAMM", params: [2, 1] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "BETA", params: [2, 3] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "POIS", params: [5] } } }, { id: "d1", type: "dispose" }] }),
      baseSpec({ flow: [{ id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "constant", params: [42] } } }, { id: "d1", type: "dispose" }] }),
    ];
    for (const s of specs) {
      expect(validateSpec(s).valid).toBe(true);
    }
  });
});

describe("validateSpec - decide validation", () => {
  it("rejects Decide with no branches", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "dec1", type: "decide", branches: [] },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "dec1"], ["dec1", "d1"]],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("at least one branch"))).toBe(true);
  });

  it("warns when probabilities don't sum to 1", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "dec1", type: "decide", branches: [{ type: "probability", value: 0.5 }] },
        { id: "d1", type: "dispose" },
      ],
      connections: [["c1", "dec1"], ["dec1", "d1"]],
    });
    const result = validateSpec(spec);
    expect(result.warnings.some((e) => e.includes("sum"))).toBe(true);
  });
});

describe("validateSpec - schedule validation", () => {
  it("rejects schedule with no durations", () => {
    const spec = baseSpec({
      schedules: [{ id: "s1", type: "capacity", timeUnits: "Hours", durations: [] }],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("at least one duration"))).toBe(true);
  });

  it("rejects schedule with negative duration length", () => {
    const spec = baseSpec({
      schedules: [{ id: "s1", type: "capacity", timeUnits: "Hours", durations: [{ value: 1, length: -1 }] }],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
  });
});

describe("validateSpec - general validation", () => {
  it("rejects duplicate queue IDs", () => {
    const spec = baseSpec({
      queues: [
        { id: "q1", discipline: "FIFO" },
        { id: "q1", discipline: "LIFO" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate queue ID"))).toBe(true);
  });

  it("rejects duplicate variable IDs", () => {
    const spec = baseSpec({
      variables: [
        { id: "v1", type: "number", initialValue: 0 },
        { id: "v1", type: "string", initialValue: "x" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate variable ID"))).toBe(true);
  });

  it("rejects duplicate attribute IDs", () => {
    const spec = baseSpec({
      attributes: [
        { id: "a1", type: "number", initialValue: 0 },
        { id: "a1", type: "string", initialValue: "x" },
      ],
    });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate attribute ID"))).toBe(true);
  });

  it("rejects invalid timeUnits", () => {
    const spec = baseSpec({ timeUnits: "Invalid" as any });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
  });

  it("warns on disconnected modules", () => {
    const spec = baseSpec({
      flow: [
        { id: "c1", type: "create", entity: "e1", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "d1", type: "dispose" },
        { id: "orphan", type: "dispose" },
      ],
      connections: [["c1", "d1"]],
    });
    const result = validateSpec(spec);
    expect(result.warnings.some((e) => e.includes("orphan"))).toBe(true);
  });

  it("rejects negative warmupPeriod", () => {
    const spec = baseSpec({ warmupPeriod: -1 });
    const result = validateSpec(spec);
    expect(result.valid).toBe(false);
  });
});
