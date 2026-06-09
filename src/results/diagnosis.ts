import type { SimulationMetrics, Diagnosis } from "./types.js";

const RESOURCE_HIGH_UTILIZATION = 0.85;
const RESOURCE_SATURATED = 0.95;
const QUEUE_HIGH_WAIT_WARN = 10;

export function diagnose(metrics: SimulationMetrics): Diagnosis {
  const bottlenecks: Diagnosis["bottlenecks"] = [];
  const saturatedResources: Diagnosis["saturatedResources"] = [];
  const growingQueues: Diagnosis["growingQueues"] = [];
  const entityStats: Diagnosis["entityStats"] = [];
  const warnings: string[] = [];

  for (const r of metrics.resources) {
    const util = r.avgUtilization;
    if (util >= RESOURCE_SATURATED) {
      saturatedResources.push({
        resource: String(r.name),
        utilization: util,
        suggestion: `Resource "${r.name}" is near saturation (${(util * 100).toFixed(1)}%). Consider increasing capacity or adding parallel resources.`,
      });
      warnings.push(`Resource "${r.name}" is near saturation at ${(util * 100).toFixed(1)}%`);
    } else if (util >= RESOURCE_HIGH_UTILIZATION) {
      bottlenecks.push({
        resource: String(r.name),
        utilization: util,
        suggestion: `Resource "${r.name}" has high utilization (${(util * 100).toFixed(1)}%). Monitor queue growth.`,
      });
    }
  }

  for (const q of metrics.queues) {
    const waitRatio = q.avgWaitTime > 0.001 ? q.maxLength / q.avgLength : 0;
    if (q.avgLength > QUEUE_HIGH_WAIT_WARN || waitRatio > 5) {
      growingQueues.push({
        queue: q.name,
        avgLength: q.avgLength,
        maxLength: q.maxLength,
        suggestion: `Queue "${q.name}" shows congestion (avg=${q.avgLength.toFixed(1)}, max=${q.maxLength}). Consider adjusting upstream capacity.`,
      });
      warnings.push(`Queue "${q.name}" is congested: avg length ${q.avgLength.toFixed(1)}, max ${q.maxLength}`);
    }
  }

  for (const e of metrics.entities) {
    entityStats.push({
      entity: e.name,
      totalInSystem: e.numberIn - e.numberOut,
      avgTime: e.avgTimeInSystem,
      suggestion: e.avgTimeInSystem > 100
        ? `Entity "${e.name}" has high avg time in system (${e.avgTimeInSystem.toFixed(1)}). Check for bottlenecks.`
        : undefined,
    });
    if (e.numberIn - e.numberOut > 100) {
      warnings.push(`Entity "${e.name}" has ${e.numberIn - e.numberOut} units still in system (WIP=${e.avgWorkInProcess.toFixed(1)})`);
    }
  }

  const totalProblems = bottlenecks.length + saturatedResources.length + growingQueues.length;
  const score = Math.max(0, 100 - totalProblems * 20);

  return {
    bottlenecks,
    saturatedResources,
    growingQueues,
    entityStats,
    warnings,
    score,
  };
}
