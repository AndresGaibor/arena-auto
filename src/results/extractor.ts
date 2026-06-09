import type { SimulationMetrics, EntityMetrics, QueueMetrics, ResourceMetrics, VariableMetrics } from "./types.js";

type BridgeCall = (method: string, params?: any, timeout?: number) => Promise<any>;

function partsGet(parts: string[], i: number): string {
  return parts[i] ?? "";
}

function partsNum(parts: string[], i: number): number {
  return parseFloat(parts[i] ?? "") || 0;
}

function parseCsvReport(csv: string): {
  entities: EntityMetrics[];
  queues: QueueMetrics[];
  resources: ResourceMetrics[];
} {
  const entities: EntityMetrics[] = [];
  const queues: QueueMetrics[] = [];
  const resources: ResourceMetrics[] = [];

  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  let currentSection = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("entity")) { currentSection = "entity"; continue; }
    if (lower.includes("queue")) { currentSection = "queue"; continue; }
    if (lower.includes("resource")) { currentSection = "resource"; continue; }
    if (lower.includes("variable")) { currentSection = "variable"; continue; }
    if (lower.includes("tally")) { currentSection = "tally"; continue; }
    if (lower.includes("dstat")) { currentSection = "dstat"; continue; }

    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;

    if (currentSection === "entity" && parts.length >= 5) {
      entities.push({
        name: partsGet(parts, 0) || partsGet(parts, 1),
        numberIn: partsNum(parts, 2),
        numberOut: partsNum(parts, 3),
        avgTimeInSystem: partsNum(parts, 4),
        halfWidthTimeInSystem: partsNum(parts, 5),
        avgWorkInProcess: partsNum(parts, 6),
        halfWidthWorkInProcess: partsNum(parts, 7),
      });
    } else if (currentSection === "queue" && parts.length >= 4) {
      queues.push({
        name: partsGet(parts, 0) || partsGet(parts, 1),
        avgLength: partsNum(parts, 2),
        halfWidthLength: partsNum(parts, 3),
        avgWaitTime: partsNum(parts, 4),
        halfWidthWaitTime: partsNum(parts, 5),
        maxLength: partsNum(parts, 6),
        currentLength: partsNum(parts, 7),
      });
    } else if (currentSection === "resource" && parts.length >= 3) {
      const busy = partsNum(parts, 2);
      resources.push({
        name: partsGet(parts, 0) || partsGet(parts, 1),
        avgBusy: busy,
        halfWidthBusy: partsNum(parts, 3),
        avgUtilization: partsNum(parts, 4) || busy,
        avgIdle: partsNum(parts, 5),
        avgNumberSeized: partsNum(parts, 6),
        halfWidthNumberSeized: partsNum(parts, 7),
        currentState: 0,
      });
    }
  }

  return { entities, queues, resources };
}

export async function extractResults(
  callBridge: BridgeCall,
  specMetrics?: { timeUnits?: string; replicationLength?: number; replications?: number; warmupPeriod?: number },
): Promise<SimulationMetrics> {
  let timeUnits = specMetrics?.timeUnits ?? "Minutes";
  let replicationLength = specMetrics?.replicationLength ?? 0;
  let replications = specMetrics?.replications ?? 1;
  let warmupPeriod = specMetrics?.warmupPeriod ?? 0;

  // Try direct SIMAN extraction first
  let bridgeResult: any = null;
  try {
    bridgeResult = await callBridge("extractResults", {});
  } catch {
    // Fall back to report parsing
  }

  let entities: EntityMetrics[] = [];
  let queues: QueueMetrics[] = [];
  let resources: ResourceMetrics[] = [];
  let variables: VariableMetrics[] = [];
  let runTime = 0;

  if (bridgeResult?.ok) {
    entities = (bridgeResult.entities || []).map((e: any) => ({
      name: String(e.name || ""),
      numberIn: Number(e.numberIn) || 0,
      numberOut: Number(e.numberOut) || 0,
      avgTimeInSystem: Number(e.avgTimeInSystem) || 0,
      halfWidthTimeInSystem: Number(e.halfWidthTimeInSystem) || 0,
      avgWorkInProcess: Number(e.avgWorkInProcess) || 0,
      halfWidthWorkInProcess: Number(e.halfWidthWorkInProcess) || 0,
    }));

    queues = (bridgeResult.queues || []).map((q: any) => ({
      name: String(q.name || ""),
      avgLength: Number(q.avgLength) || 0,
      halfWidthLength: Number(q.halfWidthLength) || 0,
      avgWaitTime: Number(q.avgWaitTime) || 0,
      halfWidthWaitTime: Number(q.halfWidthWaitTime) || 0,
      maxLength: Number(q.maxLength) || 0,
      currentLength: Number(q.currentLength) || 0,
    }));

    resources = (bridgeResult.resources || []).map((r: any) => ({
      name: String(r.name || ""),
      avgBusy: Number(r.avgBusy) || 0,
      halfWidthBusy: Number(r.halfWidthBusy) || 0,
      avgUtilization: Number(r.avgUtilization) || 0,
      avgIdle: Number(r.avgIdle) || 0,
      avgNumberSeized: Number(r.avgNumberSeized) || 0,
      halfWidthNumberSeized: Number(r.halfWidthNumberSeized) || 0,
      currentState: Number(r.currentState) || 0,
    }));

    variables = (bridgeResult.variables || []).map((v: any) => ({
      name: String(v.name || ""),
      finalValue: Number(v.finalValue) || 0,
    }));

    runTime = Number(bridgeResult.simulationTime) || 0;
    if (bridgeResult.replications) replications = Number(bridgeResult.replications);
  }

  // If SIMAN extraction gave limited data, try report parsing
  if (entities.length === 0 && queues.length === 0) {
    try {
      const reportResult = await callBridge("extractResultsViaReport", { format: "csv" });
      if (reportResult?.ok && reportResult.content) {
        const parsed = parseCsvReport(reportResult.content);
        if (parsed.entities.length > 0) entities = parsed.entities;
        if (parsed.queues.length > 0) queues = parsed.queues;
        if (parsed.resources.length > 0) resources = parsed.resources;
      }
    } catch {}
  }

  return {
    replicationCount: replications,
    replicationLength,
    warmupPeriod,
    timeUnits,
    runTime,
    entities,
    queues,
    resources,
    variables,
  };
}
