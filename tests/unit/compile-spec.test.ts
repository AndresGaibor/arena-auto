import { describe, it, expect } from "bun:test";
import { compileSpec } from "../../src/arena-spec/compiler.js";
import { validateSpec } from "../../src/arena-spec/validator.js";
import { calculateLayout } from "../../src/arena-spec/layout.js";
import { distributionToExpression } from "../../src/arena-spec/modules/index.js";
import type { ArenaModelSpec } from "../../src/arena-spec/schema.js";

describe("distributionToExpression", () => {
  it("converts EXPO(5)", () => {
    expect(distributionToExpression({ type: "EXPO", params: [5] })).toBe("EXPO(5)");
  });
  it("converts TRIA(1,3,5)", () => {
    expect(distributionToExpression({ type: "TRIA", params: [1, 3, 5] })).toBe("TRIA(1, 3, 5)");
  });
  it("converts constant(42)", () => {
    expect(distributionToExpression({ type: "constant", params: [42] })).toBe("42");
  });
});

describe("validateSpec", () => {
  it("rejects model without name", () => {
    const result = validateSpec({ name: "", flow: [], connections: [] } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Model must have a name");
  });

  it("rejects model without Create", () => {
    const result = validateSpec({ name: "test", flow: [], connections: [] } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Model must have at least one Create module");
  });

  it("rejects model without Dispose", () => {
    const result = validateSpec({
      name: "test",
      flow: [{ id: "a", type: "create", entity: "e", arrival: { distribution: { type: "EXPO", params: [5] } } }],
      connections: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Model must have at least one Dispose module");
  });

  it("rejects duplicate IDs", () => {
    const result = validateSpec({
      name: "test",
      flow: [
        { id: "same", type: "create", entity: "e", arrival: { distribution: { type: "EXPO", params: [5] } } },
        { id: "same", type: "dispose" },
      ],
      connections: [],
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("All flow module IDs must be unique");
  });

  it("rejects connection to non-existent module", () => {
    const result = validateSpec({
      name: "test",
      flow: [{ id: "a", type: "create", entity: "e", arrival: { distribution: { type: "EXPO", params: [5] } } }],
      connections: [["a", "ghost"]],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("ghost"))).toBe(true);
  });
});

const mm1Spec: ArenaModelSpec = {
  name: "MM1_Test",
  timeUnits: "Minutes",
  replications: 5,
  replicationLength: 480,
  entities: [{ id: "customer", name: "Customer" }],
  resources: [{ id: "server", name: "Server", capacity: 1 }],
  flow: [
    {
      id: "Arrival",
      type: "create",
      entity: "customer",
      arrival: { distribution: { type: "EXPO", params: [5] } },
    },
    {
      id: "Service",
      type: "process",
      resource: "server",
      delay: { distribution: { type: "EXPO", params: [4] }, units: "Minutes" },
    },
    { id: "Exit", type: "dispose" },
  ],
  connections: [
    ["Arrival", "Service"],
    ["Service", "Exit"],
  ],
};

describe("compileSpec (MM1)", () => {
  it("validates MM1 spec as valid", () => {
    const v = validateSpec(mm1Spec);
    expect(v.valid).toBe(true);
  });

  it("compiles MM1 spec without error", () => {
    const plan = compileSpec(mm1Spec);
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.modules.length).toBe(3);
  });

  it("includes createEntity step for entities", () => {
    const plan = compileSpec(mm1Spec);
    const entitySteps = plan.steps.filter((s) => s.type === "createEntity");
    expect(entitySteps.length).toBe(1);
  });

  it("includes createResource step for resources", () => {
    const plan = compileSpec(mm1Spec);
    const resourceSteps = plan.steps.filter((s) => s.type === "createResource");
    expect(resourceSteps.length).toBe(1);
  });

  it("includes 3 createModule steps (Create, Process, Dispose)", () => {
    const plan = compileSpec(mm1Spec);
    const creates = plan.steps.filter((s) => s.type === "createModule");
    expect(creates.length).toBe(3);
  });

  it("includes 2 addConnection steps", () => {
    const plan = compileSpec(mm1Spec);
    const conns = plan.steps.filter((s) => s.type === "addConnection");
    expect(conns.length).toBe(2);
  });

  it("includes final saveModel step", () => {
    const plan = compileSpec(mm1Spec);
    const saves = plan.steps.filter((s) => s.type === "saveModel");
    expect(saves.length).toBe(1);
  });

  it("assigns moduleRef to every createModule step", () => {
    const plan = compileSpec(mm1Spec);
    for (const s of plan.steps) {
      if (s.type === "createModule") {
        expect(s.moduleRef).toBeTruthy();
      }
    }
  });
});

describe("calculateLayout", () => {
  it("positions modules sequentially", () => {
    const pos = calculateLayout(mm1Spec);
    const arrivalPos = pos.find((p) => p.id === "Arrival");
    const servicePos = pos.find((p) => p.id === "Service");
    const exitPos = pos.find((p) => p.id === "Exit");
    expect(arrivalPos).toBeDefined();
    expect(servicePos).toBeDefined();
    expect(exitPos).toBeDefined();
    if (arrivalPos && servicePos) {
      expect(servicePos.x).toBeGreaterThan(arrivalPos.x);
    }
  });
});
