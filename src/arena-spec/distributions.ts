import type { Distribution } from "./schema.js";

export type DistributionMeta = {
  name: string;
  arenaName: string;
  paramCount: number;
  paramNames: string[];
  supportsExpression: boolean;
};

export const DISTRIBUTION_REGISTRY: Record<string, DistributionMeta> = {
  EXPO: { name: "Exponential", arenaName: "EXPO", paramCount: 1, paramNames: ["Mean"], supportsExpression: true },
  UNIF: { name: "Uniform", arenaName: "UNIF", paramCount: 2, paramNames: ["Min", "Max"], supportsExpression: true },
  NORM: { name: "Normal", arenaName: "NORM", paramCount: 2, paramNames: ["Mean", "StdDev"], supportsExpression: true },
  TRIA: { name: "Triangular", arenaName: "TRIA", paramCount: 3, paramNames: ["Min", "Mode", "Max"], supportsExpression: true },
  ERLA: { name: "Erlang", arenaName: "ERLA", paramCount: 2, paramNames: ["Mean", "k"], supportsExpression: true },
  WEIB: { name: "Weibull", arenaName: "WEIB", paramCount: 2, paramNames: ["Beta", "Alpha"], supportsExpression: true },
  GAMM: { name: "Gamma", arenaName: "GAMM", paramCount: 2, paramNames: ["Beta", "Alpha"], supportsExpression: true },
  BETA: { name: "Beta", arenaName: "BETA", paramCount: 2, paramNames: ["Alpha", "Beta"], supportsExpression: true },
  POIS: { name: "Poisson", arenaName: "POIS", paramCount: 1, paramNames: ["Mean"], supportsExpression: true },
  NEgexp: { name: "Negative Exponential", arenaName: "NEGEXP", paramCount: 1, paramNames: ["Mean"], supportsExpression: true },
  LOGN: { name: "Log Normal", arenaName: "LOGN", paramCount: 2, paramNames: ["LogMean", "LogStdDev"], supportsExpression: true },
  constant: { name: "Constant", arenaName: "", paramCount: 1, paramNames: ["Value"], supportsExpression: false },
};

export function getDistributionMeta(d: Distribution): DistributionMeta | undefined {
  return DISTRIBUTION_REGISTRY[d.type];
}

export function validateDistribution(d: Distribution): string | null {
  const meta = getDistributionMeta(d);
  if (!meta) return `Unknown distribution type: ${d.type}`;

  const params = d.params as number[];
  if (params.length !== meta.paramCount) {
    return `${meta.name} requires ${meta.paramCount} parameters, got ${params.length}`;
  }

  for (const p of params) {
    if (typeof p !== "number" || isNaN(p)) {
      return `${meta.name} parameters must be numbers`;
    }
  }

  switch (d.type) {
    case "EXPO":
    case "NEgexp":
      if (d.params[0] <= 0) return `${meta.name}(mean) requires mean > 0`;
      break;
    case "UNIF":
      if (d.params[0] >= d.params[1]) return "UNIF(min, max) requires min < max";
      break;
    case "NORM":
      if (d.params[1] <= 0) return "NORM(mean, stddev) requires stddev > 0";
      break;
    case "TRIA":
      if (d.params[0] >= d.params[1] || d.params[1] >= d.params[2]) return "TRIA(min, mode, max) requires min < mode < max";
      break;
    case "ERLA":
      if (d.params[1] < 1 || !Number.isInteger(d.params[1])) return "ERLA(mean, k) requires k >= 1 and integer";
      break;
    case "WEIB":
    case "GAMM":
    case "BETA":
      if (d.params[0] <= 0 || d.params[1] <= 0) return `${meta.name}(a, b) requires a > 0, b > 0`;
      break;
    case "POIS":
      if (d.params[0] <= 0) return "POIS(mean) requires mean > 0";
      break;
    case "LOGN":
      if (d.params[1] <= 0) return "LOGN(logMean, logStdDev) requires logStdDev > 0";
      break;
    case "constant":
      break;
  }

  return null;
}

export function distributionToArenaExpression(d: Distribution): string {
  const meta = getDistributionMeta(d);
  if (!meta) throw new Error(`Unknown distribution: ${d.type}`);

  if (d.type === "constant") return String(d.params[0]);
  return `${meta.arenaName}(${d.params.join(", ")})`;
}
