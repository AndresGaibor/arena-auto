import type { SimulationSummary, Diagnosis, Report } from "./types.js";

export function generateReport(summary: SimulationSummary, diagnosis: Diagnosis): Report {
  const lines: string[] = [];

  lines.push(`# Simulation Report: ${summary.modelName}`);
  lines.push("");
  lines.push(`**Run at:** ${summary.runAt}`);
  lines.push(`**Status:** ${summary.status}`);
  lines.push(`**Simulation time:** ${summary.simulationTime}`);
  lines.push(`**Replications:** ${summary.metrics.replicationCount}`);
  lines.push(`**Replication length:** ${summary.metrics.replicationLength} ${summary.metrics.timeUnits}`);
  if (summary.metrics.warmupPeriod > 0) {
    lines.push(`**Warmup period:** ${summary.metrics.warmupPeriod} ${summary.metrics.timeUnits}`);
  }
  lines.push(`**Diagnosis score:** ${diagnosis.score}/100`);
  lines.push("");

  if (diagnosis.warnings.length > 0) {
    lines.push("## Warnings");
    for (const w of diagnosis.warnings) {
      lines.push(`- ⚠ ${w}`);
    }
    lines.push("");
  }

  if (diagnosis.saturatedResources.length > 0) {
    lines.push("## Saturated Resources");
    lines.push("| Resource | Utilization | Suggestion |");
    lines.push("|----------|------------|------------|");
    for (const r of diagnosis.saturatedResources) {
      lines.push(`| ${r.resource} | ${(r.utilization * 100).toFixed(1)}% | ${r.suggestion} |`);
    }
    lines.push("");
  }

  if (diagnosis.bottlenecks.length > 0) {
    lines.push("## Potential Bottlenecks");
    lines.push("| Resource | Utilization | Suggestion |");
    lines.push("|----------|------------|------------|");
    for (const b of diagnosis.bottlenecks) {
      lines.push(`| ${b.resource} | ${(b.utilization * 100).toFixed(1)}% | ${b.suggestion} |`);
    }
    lines.push("");
  }

  if (diagnosis.growingQueues.length > 0) {
    lines.push("## Congested Queues");
    lines.push("| Queue | Avg Length | Max Length | Suggestion |");
    lines.push("|-------|-----------|-----------|------------|");
    for (const q of diagnosis.growingQueues) {
      lines.push(`| ${q.queue} | ${q.avgLength.toFixed(1)} | ${q.maxLength} | ${q.suggestion} |`);
    }
    lines.push("");
  }

  if (summary.metrics.resources.length > 0) {
    lines.push("## Resource Utilization");
    lines.push("| Resource | Avg Busy | Avg Utilization | Avg Idle |");
    lines.push("|----------|---------|----------------|---------|");
    for (const r of summary.metrics.resources) {
      lines.push(`| ${r.name} | ${(r.avgBusy * 100).toFixed(1)}% | ${(r.avgUtilization * 100).toFixed(1)}% | ${(r.avgIdle * 100).toFixed(1)}% |`);
    }
    lines.push("");
  }

  if (summary.metrics.queues.length > 0) {
    lines.push("## Queue Statistics");
    lines.push("| Queue | Avg Length | Max Length | Avg Wait |");
    lines.push("|-------|-----------|-----------|---------|");
    for (const q of summary.metrics.queues) {
      lines.push(`| ${q.name} | ${q.avgLength.toFixed(2)} | ${q.maxLength} | ${q.avgWaitTime.toFixed(2)} |`);
    }
    lines.push("");
  }

  if (summary.metrics.entities.length > 0) {
    lines.push("## Entity Statistics");
    lines.push("| Entity | Number In | Number Out | Avg Time In System | Avg WIP |");
    lines.push("|--------|----------|-----------|-------------------|--------|");
    for (const e of summary.metrics.entities) {
      lines.push(`| ${e.name} | ${e.numberIn} | ${e.numberOut} | ${e.avgTimeInSystem.toFixed(2)} | ${e.avgWorkInProcess.toFixed(2)} |`);
    }
    lines.push("");
  }

  if (summary.metrics.variables.length > 0) {
    lines.push("## Final Variables");
    lines.push("| Variable | Final Value |");
    lines.push("|----------|------------|");
    for (const v of summary.metrics.variables) {
      lines.push(`| ${v.name} | ${v.finalValue} |`);
    }
    lines.push("");
  }

  const markdown = lines.join("\n");

  return {
    summary,
    diagnosis,
    markdown,
  };
}
