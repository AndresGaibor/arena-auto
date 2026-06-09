import { describe, it, expect } from "bun:test";
import { applyPatches, cloneSpec, patchDescription } from "../../src/scenarios/patcher.js";
import { compare, rank, findBest } from "../../src/scenarios/comparator.js";
import type { ArenaModelSpec } from "../../src/arena-spec/schema.js";
import type { ScenarioResult, ScenarioRanking } from "../../src/scenarios/types.js";
import type { SimulationMetrics } from "../../src/results/types.js";

const baseSpec: ArenaModelSpec = {
  name: "TestModel",
  timeUnits: "Minutes",
  replications: 5,
  replicationLength: 480,
  entities: [{ id: "part", name: "Part" }],
  resources: [{ id: "machine", name: "Machine", capacity: 1 }],
  flow: [
    { id: "Arrival", type: "create", entity: "part", arrival: { distribution: { type: "EXPO", params: [5] } } },
    { id: "Process1", type: "process", resource: "machine", delay: { distribution: { type: "EXPO", params: [4] } } },
    { id: "Exit", type: "dispose" },
  ],
  connections: [
    ["Arrival", "Process1"],
    ["Process1", "Exit"],
  ],
};

describe("patcher", () => {
  it("clones a spec", () => {
    const cloned = cloneSpec(baseSpec);
    expect(cloned).toEqual(baseSpec);
    expect(cloned).not.toBe(baseSpec);
    cloned.name = "Changed";
    expect(baseSpec.name).toBe("TestModel");
  });

  it("applies resource capacity patch", () => {
    const patched = applyPatches(baseSpec, [{ path: "resources[0].capacity", value: 3 }]);
    expect(patched.resources?.[0]?.capacity).toBe(3);
    expect(baseSpec.resources?.[0]?.capacity).toBe(1);
  });

  it("applies multiple patches", () => {
    const patched = applyPatches(baseSpec, [
      { path: "name", value: "MultiMachine" },
      { path: "resources[0].capacity", value: 2 },
      { path: "replications", value: 10 },
    ]);
    expect(patched.name).toBe("MultiMachine");
    expect(patched.resources?.[0]?.capacity).toBe(2);
    expect(patched.replications).toBe(10);
  });

  it("generates patch description", () => {
    const desc = patchDescription([{ path: "resources[0].capacity", value: 2 }]);
    expect(desc).toContain("resources[0].capacity");
    expect(desc).toContain("2");
  });

  it("applies patches to replica spec name", () => {
    const cloned = cloneSpec(baseSpec);
    cloned.name = "Scenario_A";
    expect(cloned.name).toBe("Scenario_A");
    expect(baseSpec.name).toBe("TestModel");
  });
});

function makeResult(name: string, overrides: Partial<SimulationMetrics>): ScenarioResult {
  return {
    name,
    metrics: {
      replicationCount: 5,
      replicationLength: 480,
      warmupPeriod: 0,
      timeUnits: "Minutes",
      runTime: 480,
      entities: [],
      queues: [],
      resources: [],
      variables: [],
      ...overrides,
    },
    diagnosis: {
      bottlenecks: [],
      saturatedResources: [],
      growingQueues: [],
      entityStats: [],
      warnings: [],
      score: 100,
    },
    score: 100,
  };
}

describe("comparator", () => {
  const resultA = makeResult("1_Server", {
    entities: [{ name: "Part", numberIn: 100, numberOut: 95, avgTimeInSystem: 45, halfWidthTimeInSystem: 5, avgWorkInProcess: 9, halfWidthWorkInProcess: 1 }],
    queues: [{ name: "Queue1", avgLength: 15, halfWidthLength: 3, avgWaitTime: 5, halfWidthWaitTime: 1, maxLength: 40, currentLength: 2 }],
    resources: [{ name: "Server1", avgBusy: 0.95, halfWidthBusy: 0.02, avgUtilization: 0.95, avgIdle: 0.05, avgNumberSeized: 0.95, halfWidthNumberSeized: 0.02, currentState: 1 }],
  });
  resultA.score = 60;
  resultA.diagnosis.score = 60;

  const resultB = makeResult("2_Servers", {
    entities: [{ name: "Part", numberIn: 100, numberOut: 98, avgTimeInSystem: 25, halfWidthTimeInSystem: 3, avgWorkInProcess: 5, halfWidthWorkInProcess: 0.5 }],
    queues: [{ name: "Queue1", avgLength: 3, halfWidthLength: 1, avgWaitTime: 1, halfWidthWaitTime: 0.3, maxLength: 10, currentLength: 0 }],
    resources: [
      { name: "Server1", avgBusy: 0.48, halfWidthBusy: 0.03, avgUtilization: 0.48, avgIdle: 0.52, avgNumberSeized: 0.48, halfWidthNumberSeized: 0.03, currentState: 1 },
      { name: "Server2", avgBusy: 0.47, halfWidthBusy: 0.03, avgUtilization: 0.47, avgIdle: 0.53, avgNumberSeized: 0.47, halfWidthNumberSeized: 0.03, currentState: 1 },
    ],
  });
  resultB.score = 90;
  resultB.diagnosis.score = 90;

  it("compares two scenarios", () => {
    const comparison = compare([resultA, resultB]);
    expect(comparison.length).toBeGreaterThan(0);
    const throughputRow = comparison.find((r) => r.metric === "Throughput (entities out)");
    expect(throughputRow).toBeDefined();
    expect(throughputRow!.best).toBe("2_Servers");
  });

  it("ranks scenarios by score", () => {
    const ranking = rank([resultA, resultB]);
    expect(ranking.length).toBe(2);
    expect(ranking[0]!.scenario).toBe("2_Servers");
    expect(ranking[0]!.score).toBe(90);
    expect(ranking[1]!.scenario).toBe("1_Server");
  });

  it("finds best scenario", () => {
    const ranking = rank([resultA, resultB]);
    const best = findBest(ranking);
    expect(best).not.toBeNull();
    expect(best!.scenario).toBe("2_Servers");
  });

  it("handles single scenario", () => {
    const comparison = compare([resultA]);
    expect(comparison.length).toBeGreaterThan(0);
    expect(comparison[0]!.best).toBe("1_Server");
  });

  it("handles empty results", () => {
    const ranking = rank([]);
    expect(ranking.length).toBe(0);
    const best = findBest(ranking);
    expect(best).toBeNull();
  });
});
