import type { ArenaModelSpec } from "../arena-spec/schema.js";
import type { SimulationMetrics, Diagnosis } from "../results/types.js";

export type SpecPatch = {
  path: string;
  value: unknown;
};

export type ScenarioDef = {
  name: string;
  description?: string;
  patches: SpecPatch[];
};

export type ScenarioResult = {
  name: string;
  description?: string;
  metrics: SimulationMetrics;
  diagnosis: Diagnosis;
  score: number;
};

export type ExperimentConfig = {
  baseSpec: ArenaModelSpec;
  scenarios: ScenarioDef[];
  metrics?: string[];
};

export type ComparisonRow = {
  metric: string;
  values: Record<string, number | string>;
  best: string;
  unit?: string;
};

export type ScenarioRanking = {
  scenario: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
};

export type ExperimentReport = {
  experimentName: string;
  runAt: string;
  scenarios: ScenarioResult[];
  comparison: ComparisonRow[];
  ranking: ScenarioRanking[];
  bestScenario: ScenarioRanking;
  markdown: string;
};
