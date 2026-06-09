import { describe, it, expect } from "bun:test";
import { compileSpec } from "../../src/arena-spec/compiler.js";
import { validateSpec } from "../../src/arena-spec/validator.js";
import { calculateLayout } from "../../src/arena-spec/layout.js";
import { distributionToExpression } from "../../src/arena-spec/modules/index.js";
import { compileQueue, compileQueues } from "../../src/arena-spec/data/queues.js";
import { compileSchedule, compileSchedules } from "../../src/arena-spec/data/schedules.js";
import { compileSet, compileSets } from "../../src/arena-spec/data/sets.js";
import { compileFailure, compileFailures } from "../../src/arena-spec/data/failures.js";
import { compileResource } from "../../src/arena-spec/data/resources.js";
import type { DataStep } from "../../src/arena-spec/data/index.js";
import type { ArenaModelSpec, ResourceDef, QueueDef, ScheduleDef, SetDef } from "../../src/arena-spec/schema.js";

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
    expect(result.errors.some((e) => e.includes("Duplicate flow module"))).toBe(true);
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

// --- Model: Quality Inspection (Decide + Dispose) ---
const inspectionSpec: ArenaModelSpec = {
  name: "QualityInspection",
  flow: [
    { id: "Arrival", type: "create", entity: "part", arrival: { distribution: { type: "EXPO", params: [1] } } },
    { id: "Inspect", type: "process", delay: { distribution: { type: "TRIA", params: [0.5, 1, 1.5] } } },
    { id: "Decision", type: "decide", branches: [{ type: "probability", value: 0.9 }, { type: "probability", value: 0.1 }] },
    { id: "Pass", type: "dispose" },
    { id: "Reject", type: "dispose" },
  ],
  connections: [
    ["Arrival", "Inspect"],
    ["Inspect", "Decision"],
    ["Decision", "Pass"],
    ["Decision", "Reject"],
  ],
};

describe("compileSpec (QualityInspection with Decide)", () => {
  it("validates inspection spec", () => {
    expect(validateSpec(inspectionSpec).valid).toBe(true);
  });

  it("compiles inspection spec", () => {
    const plan = compileSpec(inspectionSpec);
    expect(plan.modules.length).toBe(5);
    expect(plan.steps.filter((s) => s.type === "createModule").length).toBe(5);
    expect(plan.steps.filter((s) => s.type === "addConnection").length).toBe(4);
  });

  it("assigns different y positions for branches", () => {
    const pos = calculateLayout(inspectionSpec);
    const passPos = pos.find((p) => p.id === "Pass");
    const rejectPos = pos.find((p) => p.id === "Reject");
    expect(passPos).toBeDefined();
    expect(rejectPos).toBeDefined();
    if (passPos && rejectPos) {
      expect(passPos.y).not.toBe(rejectPos.y);
    }
  });
});

// --- Model: Assign + Record ---
const assignRecordSpec: ArenaModelSpec = {
  name: "AssignRecord",
  flow: [
    { id: "Arrival", type: "create", entity: "item", arrival: { distribution: { type: "EXPO", params: [2] } } },
    { id: "AssignAttr", type: "assign", assignments: [{ variable: "ArrivalTime", value: "TNOW" }] },
    { id: "ProcessOp", type: "process", delay: { distribution: { type: "UNIF", params: [1, 3] } } },
    { id: "RecordTime", type: "record", expression: "TNOW - ArrivalTime", name: "SystemTime" },
    { id: "Exit", type: "dispose" },
  ],
  connections: [
    ["Arrival", "AssignAttr"],
    ["AssignAttr", "ProcessOp"],
    ["ProcessOp", "RecordTime"],
    ["RecordTime", "Exit"],
  ],
};

describe("compileSpec (Assign + Record)", () => {
  it("validates and compiles assign/record model", () => {
    expect(validateSpec(assignRecordSpec).valid).toBe(true);
    const plan = compileSpec(assignRecordSpec);
    expect(plan.modules.length).toBe(5);
    expect(plan.steps.filter((s) => s.type === "createModule").length).toBe(5);
    expect(plan.steps.filter((s) => s.type === "addConnection").length).toBe(4);
  });

  it("includes assign steps with correct variable name", () => {
    const plan = compileSpec(assignRecordSpec);
    const assignSteps = plan.steps.filter((s) => s.params.property === "Assignment1");
    expect(assignSteps.length).toBe(1);
  });

  it("includes record steps", () => {
    const plan = compileSpec(assignRecordSpec);
    expect(plan.steps.some((s) => s.params.property === "Expression" && s.params.value === "TNOW - ArrivalTime")).toBe(true);
  });
});

// --- Model: Batch + Separate ---
const batchSpec: ArenaModelSpec = {
  name: "BatchSeparate",
  flow: [
    { id: "Arrival", type: "create", entity: "item", arrival: { distribution: { type: "EXPO", params: [1] } } },
    { id: "BatchOp", type: "batch", batchSize: 5, rule: "Any Entity" },
    { id: "ProcessBatch", type: "process", delay: { distribution: { type: "constant", params: [2] } } },
    { id: "SeparateOp", type: "separate", duplicates: 5 },
    { id: "Exit", type: "dispose" },
  ],
  connections: [
    ["Arrival", "BatchOp"],
    ["BatchOp", "ProcessBatch"],
    ["ProcessBatch", "SeparateOp"],
    ["SeparateOp", "Exit"],
  ],
};

describe("compileSpec (Batch + Separate)", () => {
  it("validates and compiles batch/separate model", () => {
    expect(validateSpec(batchSpec).valid).toBe(true);
    const plan = compileSpec(batchSpec);
    expect(plan.modules.length).toBe(5);
    expect(plan.steps.filter((s) => s.type === "createModule").length).toBe(5);
  });

  it("includes batch size step", () => {
    const plan = compileSpec(batchSpec);
    expect(plan.steps.some((s) => s.params.property === "Batch Size" && s.params.value === "5")).toBe(true);
  });

  it("includes separate duplicate step", () => {
    const plan = compileSpec(batchSpec);
    expect(plan.steps.some((s) => s.params.property === "Duplicate" && s.params.value === "5")).toBe(true);
  });
});

// --- Phase 5: Resources, Queues, Schedules Advanced ---

describe("compileQueue", () => {
  it("creates a queue step with FIFO discipline by default", () => {
    const step = compileQueue({ id: "q1", name: "MyQueue" })[0]!;
    expect(step.type).toBe("createQueue");
    expect(step.params.id).toBe("q1");
    expect(step.params.discipline).toBe("FIFO");
  });

  it("accepts explicit discipline and attribute name", () => {
    const step = compileQueue({ id: "q2", discipline: "LowestAttribute", attributeName: "Priority" })[0]!;
    expect(step.params.discipline).toBe("LowestAttribute");
    expect(step.params.attributeName).toBe("Priority");
  });

  it("compileQueues returns empty for undefined", () => {
    expect(compileQueues()).toEqual([]);
  });
});

describe("compileSchedule", () => {
  it("creates a schedule step with durations", () => {
    const step = compileSchedule({
      id: "sched1",
      name: "Shift1",
      type: "capacity",
      timeUnits: "Hours",
      durations: [{ value: 2, length: 8 }, { value: 0, length: 16 }],
    })[0]!;
    expect(step.type).toBe("createSchedule");
    expect(step.params.durations).toHaveLength(2);
  });

  it("compileSchedules returns empty for undefined", () => {
    expect(compileSchedules()).toEqual([]);
  });
});

describe("compileSet", () => {
  it("creates a set step with members", () => {
    const step = compileSet({ id: "set1", name: "Workers", type: "resource", members: ["Alice", "Bob"] })[0]!;
    expect(step.type).toBe("createSet");
    expect(step.params.setType).toBe("resource");
    expect(step.params.members).toEqual(["Alice", "Bob"]);
  });

  it("compileSets returns empty for undefined", () => {
    expect(compileSets()).toEqual([]);
  });
});

describe("compileResource with failures and costs", () => {
  it("includes resource step with costs", () => {
    const resource: ResourceDef = {
      id: "server",
      capacity: 1,
      costs: { perHour: 10, perUse: 1 },
    };
    const steps = compileResource(resource);
    expect(steps.some((s) => s.type === "createResource")).toBe(true);
    const resStep = steps.find((s) => s.type === "createResource")!;
    expect(resStep.params.costs).toEqual({ perHour: 10, perUse: 1 });
  });

  it("adds failure steps for resource failures", () => {
    const resource: ResourceDef = {
      id: "machine",
      capacity: 1,
      failures: [{ type: "count", count: 100, length: 5 }],
    };
    const steps = compileResource(resource);
    const createRes = steps.filter((s) => s.type === "createResource");
    const createFail = steps.filter((s) => s.type === "createFailure");
    expect(createRes.length).toBe(1);
    expect(createFail.length).toBe(1);
    expect(createFail[0]!.params.id).toBe("machine_failure");
  });

  it("creates no failure steps when no failures defined", () => {
    const steps = compileResource({ id: "simple", capacity: 1 });
    const fails = steps.filter((s) => s.type === "createFailure");
    expect(fails.length).toBe(0);
  });
});

describe("compileFailure", () => {
  it("creates a failure step with parent id prefix", () => {
    const step = compileFailure({ type: "count", count: 50, length: 10 }, "res1")[0]!;
    expect(step.type).toBe("createFailure");
    expect(step.params.id).toBe("res1_failure");
  });

  it("compileFailures returns empty for undefined", () => {
    expect(compileFailures("res1")).toEqual([]);
  });
});

describe("compileSpec with queues, schedules, sets", () => {
  const fullSpec: ArenaModelSpec = {
    name: "FullPhase5",
    entities: [{ id: "item" }],
    resources: [{ id: "worker", capacity: 2 }],
    queues: [{ id: "queue1", discipline: "LIFO" }],
    schedules: [{ id: "shift", type: "capacity", timeUnits: "Hours", durations: [{ value: 1, length: 8 }] }],
    sets: [{ id: "team", name: "TeamA", type: "resource", members: ["worker"] }],
    flow: [
      { id: "Arrival", type: "create", entity: "item", arrival: { distribution: { type: "EXPO", params: [1] } } },
      { id: "Process", type: "process", resource: "worker", delay: { distribution: { type: "EXPO", params: [2] } } },
      { id: "Exit", type: "dispose" },
    ],
    connections: [["Arrival", "Process"], ["Process", "Exit"]],
  };

  it("validates full spec", () => {
    expect(validateSpec(fullSpec).valid).toBe(true);
  });

  it("includes createQueue steps", () => {
    const plan = compileSpec(fullSpec);
    const queueSteps = plan.steps.filter((s): s is DataStep => s.type === "createQueue");
    expect(queueSteps.length).toBe(1);
    expect(queueSteps[0]!.params.discipline).toBe("LIFO");
  });

  it("includes createSchedule steps", () => {
    const plan = compileSpec(fullSpec);
    const schedSteps = plan.steps.filter((s): s is DataStep => s.type === "createSchedule");
    expect(schedSteps.length).toBe(1);
  });

  it("includes createSet steps", () => {
    const plan = compileSpec(fullSpec);
    const setSteps = plan.steps.filter((s): s is DataStep => s.type === "createSet");
    expect(setSteps.length).toBe(1);
    expect(setSteps[0]!.params.setType).toBe("resource");
  });
});
