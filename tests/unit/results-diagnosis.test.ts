import { describe, it, expect } from "bun:test";
import { diagnose } from "../../src/results/diagnosis.js";
import { generateReport } from "../../src/results/report.js";
import type { SimulationMetrics, SimulationSummary } from "../../src/results/types.js";

const mockMetrics: SimulationMetrics = {
  replicationCount: 5,
  replicationLength: 480,
  warmupPeriod: 0,
  timeUnits: "Minutes",
  runTime: 480,
  entities: [
    { name: "Part", numberIn: 100, numberOut: 95, avgTimeInSystem: 45.2, halfWidthTimeInSystem: 3.1, avgWorkInProcess: 9.4, halfWidthWorkInProcess: 0.8 },
    { name: "Widget", numberIn: 50, numberOut: 48, avgTimeInSystem: 120.5, halfWidthTimeInSystem: 10.2, avgWorkInProcess: 12.5, halfWidthWorkInProcess: 1.5 },
  ],
  queues: [
    { name: "Server1.Queue", avgLength: 15.3, halfWidthLength: 2.1, avgWaitTime: 5.2, halfWidthWaitTime: 0.8, maxLength: 45, currentLength: 3 },
    { name: "Server2.Queue", avgLength: 2.1, halfWidthLength: 0.5, avgWaitTime: 1.3, halfWidthWaitTime: 0.2, maxLength: 8, currentLength: 1 },
    { name: "Inspection.Queue", avgLength: 25.7, halfWidthLength: 4.2, avgWaitTime: 12.1, halfWidthWaitTime: 2.0, maxLength: 60, currentLength: 10 },
  ],
  resources: [
    { name: "Server1", avgBusy: 0.92, halfWidthBusy: 0.03, avgUtilization: 0.92, avgIdle: 0.08, avgNumberSeized: 0.92, halfWidthNumberSeized: 0.03, currentState: 1 },
    { name: "Server2", avgBusy: 0.45, halfWidthBusy: 0.05, avgUtilization: 0.45, avgIdle: 0.55, avgNumberSeized: 0.45, halfWidthNumberSeized: 0.05, currentState: 1 },
    { name: "Inspector", avgBusy: 0.97, halfWidthBusy: 0.02, avgUtilization: 0.97, avgIdle: 0.03, avgNumberSeized: 0.97, halfWidthNumberSeized: 0.02, currentState: 1 },
  ],
  variables: [
    { name: "TotalParts", finalValue: 100 },
    { name: "RejectCount", finalValue: 5 },
  ],
};

describe("diagnose", () => {
  it("detects resource bottlenecks", () => {
    const d = diagnose(mockMetrics);
    expect(d.bottlenecks.length).toBeGreaterThan(0);
    const server1 = d.bottlenecks.find((r) => r.resource === "Server1");
    expect(server1).toBeDefined();
    expect(server1!.utilization).toBeCloseTo(0.92);
  });

  it("detects saturated resources (>=95%)", () => {
    const d = diagnose(mockMetrics);
    const inspector = d.saturatedResources.find((r) => r.resource === "Inspector");
    expect(inspector).toBeDefined();
    expect(inspector!.utilization).toBeCloseTo(0.97);
  });

  it("detects congested queues", () => {
    const d = diagnose(mockMetrics);
    expect(d.growingQueues.length).toBeGreaterThan(0);
    const inspectionQ = d.growingQueues.find((q) => q.queue === "Inspection.Queue");
    expect(inspectionQ).toBeDefined();
  });

  it("reports entity stats", () => {
    const d = diagnose(mockMetrics);
    const widget = d.entityStats.find((e) => e.entity === "Widget");
    expect(widget).toBeDefined();
    expect(widget!.avgTime).toBeCloseTo(120.5);
    expect(widget!.suggestion).toBeDefined();
  });

  it("computes a score", () => {
    const d = diagnose(mockMetrics);
    expect(d.score).toBeGreaterThanOrEqual(0);
    expect(d.score).toBeLessThanOrEqual(100);
  });

  it("handles empty metrics", () => {
    const empty: SimulationMetrics = {
      replicationCount: 0,
      replicationLength: 0,
      warmupPeriod: 0,
      timeUnits: "Minutes",
      runTime: 0,
      entities: [],
      queues: [],
      resources: [],
      variables: [],
    };
    const d = diagnose(empty);
    expect(d.score).toBe(100);
    expect(d.warnings.length).toBe(0);
  });
});

describe("generateReport", () => {
  const summary: SimulationSummary = {
    modelName: "Test Model",
    runAt: "2026-01-01T00:00:00.000Z",
    status: "completed",
    simulationTime: 480,
    metrics: mockMetrics,
  };

  it("generates markdown report", () => {
    const d = diagnose(mockMetrics);
    const report = generateReport(summary, d);
    expect(report.markdown).toContain("Simulation Report: Test Model");
    expect(report.markdown).toContain("Server1");
    expect(report.markdown).toContain("Inspector");
    expect(report.markdown).toContain("Inspection.Queue");
    expect(report.markdown).toContain("Widget");
  });

  it("includes diagnosis score", () => {
    const d = diagnose(mockMetrics);
    const report = generateReport(summary, d);
    expect(report.markdown).toContain("Diagnosis score");
  });

  it("includes resource utilization table", () => {
    const d = diagnose(mockMetrics);
    const report = generateReport(summary, d);
    expect(report.markdown).toContain("Resource Utilization");
    expect(report.markdown).toContain("| Resource | Avg Busy | Avg Utilization | Avg Idle |");
  });

  it("returns structured report", () => {
    const d = diagnose(mockMetrics);
    const report = generateReport(summary, d);
    expect(report.summary.modelName).toBe("Test Model");
    expect(report.diagnosis.score).toBeDefined();
    expect(typeof report.markdown).toBe("string");
    expect(report.markdown.length).toBeGreaterThan(100);
  });
});
