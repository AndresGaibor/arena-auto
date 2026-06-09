import type { ExperimentConfig, ScenarioResult, ExperimentReport, SpecPatch, ComparisonRow, ScenarioRanking } from "./types.js";
import type { ArenaModelSpec } from "../arena-spec/schema.js";
import { validateSpec } from "../arena-spec/validator.js";
import { applyPatches, patchDescription } from "./patcher.js";
import { compare, rank, findBest } from "./comparator.js";
import { diagnose } from "../results/diagnosis.js";
import { generateReport as genReport } from "../results/report.js";

type BridgeCall = (method: string, params?: any, timeout?: number) => Promise<any>;

function extractSimanMetrics(
  simanResult: { results?: { status?: string; simulationTime?: number; modelName?: string } },
  bridgeResult: any,
) {
  return {
    replicationCount: Number(bridgeResult?.replications) || 1,
    replicationLength: 0,
    warmupPeriod: 0,
    timeUnits: "Minutes",
    runTime: Number(simanResult?.results?.simulationTime) || 0,
    entities: (bridgeResult?.entities || []).map((e: any) => ({
      name: String(e.name ?? ""),
      numberIn: Number(e.numberIn) || 0,
      numberOut: Number(e.numberOut) || 0,
      avgTimeInSystem: Number(e.avgTimeInSystem) || 0,
      halfWidthTimeInSystem: Number(e.halfWidthTimeInSystem) || 0,
      avgWorkInProcess: Number(e.avgWorkInProcess) || 0,
      halfWidthWorkInProcess: Number(e.halfWidthWorkInProcess) || 0,
    })),
    queues: (bridgeResult?.queues || []).map((q: any) => ({
      name: String(q.name ?? ""),
      avgLength: Number(q.avgLength) || 0,
      halfWidthLength: Number(q.halfWidthLength) || 0,
      avgWaitTime: Number(q.avgWaitTime) || 0,
      halfWidthWaitTime: Number(q.halfWidthWaitTime) || 0,
      maxLength: Number(q.maxLength) || 0,
      currentLength: Number(q.currentLength) || 0,
    })),
    resources: (bridgeResult?.resources || []).map((r: any) => ({
      name: String(r.name ?? ""),
      avgBusy: Number(r.avgBusy) || 0,
      halfWidthBusy: Number(r.halfWidthBusy) || 0,
      avgUtilization: Number(r.avgUtilization) || 0,
      avgIdle: Number(r.avgIdle) || 0,
      avgNumberSeized: Number(r.avgNumberSeized) || 0,
      halfWidthNumberSeized: Number(r.halfWidthNumberSeized) || 0,
      currentState: Number(r.currentState) || 0,
    })),
    variables: (bridgeResult?.variables || []).map((v: any) => ({
      name: String(v.name ?? ""),
      finalValue: Number(v.finalValue) || 0,
    })),
  };
}

async function buildAndRun(callBridge: BridgeCall, spec: ArenaModelSpec): Promise<ScenarioResult> {
  const validation = validateSpec(spec);
  if (!validation.valid) {
    return {
      name: spec.name,
      metrics: {
        replicationCount: 0,
        replicationLength: 0,
        warmupPeriod: 0,
        timeUnits: "Minutes",
        runTime: 0,
        entities: [],
        queues: [],
        resources: [],
        variables: [],
      },
      diagnosis: {
        bottlenecks: [],
        saturatedResources: [],
        growingQueues: [],
        entityStats: [],
        warnings: [`Spec validation failed: ${validation.errors.join("; ")}`],
        score: 0,
      },
      score: 0,
    };
  }

  try {
    await callBridge("openArena", { visible: false });
    await callBridge("createNewModel");

    const plan = await import("../arena-spec/compiler.js").then((m) => m.compileSpec(spec, undefined));

    const moduleCaptions = new Map<string, string>();

    for (const step of plan.steps) {
      switch (step.type) {
        case "createModule": {
          const created = await callBridge("createModule", step.params) as { caption?: string };
          if (step.moduleRef && created?.caption) moduleCaptions.set(step.moduleRef, created.caption);
          break;
        }
        case "setProperty": {
          const specCaption = step.params.caption as string;
          const realCaption = moduleCaptions.get(specCaption) || specCaption;
          const setResult = await callBridge("setModuleProperty", {
            ...step.params,
            caption: realCaption,
          }) as { captionAfter?: string };
          if (setResult?.captionAfter) moduleCaptions.set(specCaption, setResult.captionAfter);
          break;
        }
        case "addConnection": {
          const fromId = step.params.fromCaption as string;
          const toId = step.params.toCaption as string;
          await callBridge("addConnection", {
            fromCaption: moduleCaptions.get(fromId) || fromId,
            toCaption: moduleCaptions.get(toId) || toId,
          });
          break;
        }
        case "setReplicationLength":
          await callBridge("setReplicationLength", step.params);
          break;
        case "createEntity":
          await callBridge("createEntity", step.params);
          break;
        case "createResource":
          await callBridge("createResource", step.params);
          break;
      }
    }

    await callBridge("runModel", { batchMode: true, quietMode: true });

    const simanResult = await callBridge("getModelResults", {}) as { results?: { status?: string; simulationTime?: number; modelName?: string } };
    const bridgeResult = await callBridge("extractResults", {});

    await callBridge("closeModel");
    await callBridge("closeArena");

    const metrics = extractSimanMetrics(simanResult, bridgeResult);
    const diag = diagnose(metrics);
    const name = spec.name;

    return {
      name,
      metrics,
      diagnosis: diag,
      score: diag.score,
    };
  } catch (e) {
    try { await callBridge("closeModel"); } catch {}
    try { await callBridge("closeArena"); } catch {}
    return {
      name: spec.name,
      metrics: {
        replicationCount: 0,
        replicationLength: 0,
        warmupPeriod: 0,
        timeUnits: "Minutes",
        runTime: 0,
        entities: [],
        queues: [],
        resources: [],
        variables: [],
      },
      diagnosis: {
        bottlenecks: [],
        saturatedResources: [],
        growingQueues: [],
        entityStats: [],
        warnings: [(e as Error).message],
        score: 0,
      },
      score: 0,
    };
  }
}

export async function runExperiment(
  callBridge: BridgeCall,
  config: ExperimentConfig,
): Promise<ExperimentReport> {
  const results: ScenarioResult[] = [];

  for (const scenario of config.scenarios) {
    const spec = applyPatches(config.baseSpec, scenario.patches);
    spec.name = scenario.name;
    const result = await buildAndRun(callBridge, spec);
    result.description = scenario.description || patchDescription(scenario.patches);
    results.push(result);
  }

  const comparison = compare(results);
  const ranking = rank(results);
  const bestScenario = findBest(ranking);

  const markdown = generateExperimentMarkdown(results, comparison, ranking, bestScenario);

  return {
    experimentName: config.baseSpec.name,
    runAt: new Date().toISOString(),
    scenarios: results,
    comparison,
    ranking,
    bestScenario: bestScenario ?? { scenario: "none", score: 0, strengths: [], weaknesses: [] },
    markdown,
  };
}

function generateExperimentMarkdown(
  results: ScenarioResult[],
  comparison: ComparisonRow[],
  ranking: ScenarioRanking[],
  bestScenario: ScenarioRanking | null,
): string {
  const lines: string[] = [];
  lines.push("# Experiment Report");
  lines.push(`**Run at:** ${new Date().toISOString()}`);
  lines.push(`**Scenarios:** ${results.length}`);
  lines.push("");

  if (bestScenario) {
    lines.push("## Best Scenario");
    lines.push(`**${bestScenario.scenario}** (score: ${bestScenario.score}/100)`);
    if (bestScenario.strengths.length > 0) lines.push(`- Strengths: ${bestScenario.strengths.join(", ")}`);
    if (bestScenario.weaknesses.length > 0) lines.push(`- Weaknesses: ${bestScenario.weaknesses.join(", ")}`);
    lines.push("");
  }

  lines.push("## Ranking");
  lines.push("| Rank | Scenario | Score | Strengths | Weaknesses |");
  lines.push("|------|----------|-------|-----------|------------|");
  ranking.forEach((r, i) => {
    lines.push(`| ${i + 1} | ${r.scenario} | ${r.score}/100 | ${r.strengths.slice(0, 3).join(", ") || "—"} | ${r.weaknesses.slice(0, 3).join(", ") || "—"} |`);
  });
  lines.push("");

  lines.push("## Metric Comparison");
  const headers = ["Metric", ...results.map((r) => r.name), "Best", "Unit"];
  lines.push("| " + headers.join(" | ") + " |");
  lines.push("| " + headers.map(() => "---").join(" | ") + " |");
  for (const row of comparison) {
    const vals = results.map((r) => {
      const v = row.values[r.name];
      return typeof v === "number" ? String(v) : String(v ?? "—");
    });
    const isBest = (s: string) => s === row.best;
    const markedVals = results.map((r) => (isBest(r.name) ? `**${vals[results.indexOf(r)]}**` : vals[results.indexOf(r)]));
    lines.push(`| ${row.metric} | ${markedVals.join(" | ")} | **${row.best}** | ${row.unit ?? ""} |`);
  }
  lines.push("");

  for (const r of results) {
    lines.push(`## Scenario: ${r.name}`);
    if (r.description) lines.push(`*${r.description}*`);
    lines.push(`**Score:** ${r.score}/100`);
    lines.push(`**Resources:** ${r.metrics.resources.map((res) => `${res.name}=${(res.avgUtilization * 100).toFixed(1)}%`).join(", ")}`);
    lines.push(`**Queues:** ${r.metrics.queues.map((q) => `${q.name}=${q.avgLength.toFixed(1)}`).join(", ")}`);
    lines.push(`**Throughput:** ${r.metrics.entities.reduce((s, e) => s + e.numberOut, 0)}`);
    if (r.diagnosis.warnings.length > 0) {
      lines.push("**Warnings:**");
      for (const w of r.diagnosis.warnings) lines.push(`- ${w}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
