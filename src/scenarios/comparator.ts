import type { ScenarioResult, ComparisonRow, ScenarioRanking } from "./types.js";

const COMPARISON_METRICS: { key: string; label: string; unit: string; higherBetter: boolean }[] = [
  { key: "throughput", label: "Throughput (entities out)", unit: "entities", higherBetter: true },
  { key: "avgTimeInSystem", label: "Avg Time in System", unit: "time", higherBetter: false },
  { key: "avgQueueLength", label: "Avg Queue Length", unit: "entities", higherBetter: false },
  { key: "avgWaitTime", label: "Avg Wait Time", unit: "time", higherBetter: false },
  { key: "avgUtilization", label: "Avg Resource Utilization", unit: "%", higherBetter: false },
  { key: "wip", label: "Work In Process (WIP)", unit: "entities", higherBetter: false },
  { key: "diagnosisScore", label: "Diagnosis Score", unit: "points", higherBetter: true },
];

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function extractMetric(result: ScenarioResult, key: string): number {
  const m = result.metrics;
  switch (key) {
    case "throughput":
      return m.entities.reduce((sum, e) => sum + e.numberOut, 0);
    case "avgTimeInSystem":
      return avg(m.entities.map((e) => e.avgTimeInSystem));
    case "avgQueueLength":
      return avg(m.queues.map((q) => q.avgLength));
    case "avgWaitTime":
      return avg(m.queues.map((q) => q.avgWaitTime));
    case "avgUtilization":
      return avg(m.resources.map((r) => r.avgUtilization)) * 100;
    case "wip":
      return m.entities.reduce((sum, e) => sum + (e.avgWorkInProcess), 0);
    case "diagnosisScore":
      return result.score;
    default:
      return 0;
  }
}

export function compare(results: ScenarioResult[]): ComparisonRow[] {
  return COMPARISON_METRICS.map(({ key, label, unit, higherBetter }) => {
    const values: Record<string, number> = {};
    for (const r of results) {
      values[r.name] = extractMetric(r, key);
    }

    let best = "";
    if (Object.keys(values).length > 0) {
      const sorted = Object.entries(values).sort(([, a], [, b]) =>
        higherBetter ? b - a : a - b,
      );
      best = sorted[0]![0];
    }

    const row: ComparisonRow = {
      metric: label,
      values: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === "number" ? Number(v.toFixed(3)) : v])),
      best,
    };
    if (unit) row.unit = unit;
    return row;
  });
}

export function rank(results: ScenarioResult[]): ScenarioRanking[] {
  if (results.length === 0) return [];
  const comparison = compare(results);

  const scenarioScores: Record<string, { score: number; strengths: string[]; weaknesses: string[] }> = {};
  for (const r of results) {
    scenarioScores[r.name] = { score: r.score, strengths: [], weaknesses: [] };
  }

  for (const row of comparison) {
    const entries = Object.entries(row.values) as [string, number][];
    if (entries.length < 2) continue;
    const sorted = [...entries].sort(([, a], [, b]) => b - a);
    const bestName = sorted[0]![0];
    const worstName = sorted[sorted.length - 1]![0];
    if (bestName && scenarioScores[bestName]) scenarioScores[bestName]!.strengths.push(row.metric);
    if (worstName && worstName !== bestName && scenarioScores[worstName]) scenarioScores[worstName]!.weaknesses.push(row.metric);
  }

  const rankings = Object.entries(scenarioScores).map(([scenario, data]) => ({
    scenario,
    score: data.score,
    strengths: data.strengths,
    weaknesses: data.weaknesses,
  }));

  rankings.sort((a, b) => b.score - a.score);
  return rankings;
}

export function findBest(rankings: ScenarioRanking[]): ScenarioRanking | null {
  return rankings.length > 0 ? rankings[0]! : null;
}
