import type { Distribution, FlowModule } from "../schema.js";

export type CompileStep = {
  type: "createModule" | "setProperty" | "createEntity" | "createResource" | "addConnection" | "setReplicationLength" | "saveModel";
  moduleRef?: string;
  params: Record<string, unknown>;
};

export function distributionToExpression(d: Distribution): string {
  switch (d.type) {
    case "EXPO": return `EXPO(${d.params[0]})`;
    case "UNIF": return `UNIF(${d.params[0]}, ${d.params[1]})`;
    case "NORM": return `NORM(${d.params[0]}, ${d.params[1]})`;
    case "TRIA": return `TRIA(${d.params[0]}, ${d.params[1]}, ${d.params[2]})`;
    case "ERLA": return `ERLA(${d.params[0]}, ${d.params[1]})`;
    case "WEIB": return `WEIB(${d.params[0]}, ${d.params[1]})`;
    case "GAMM": return `GAMM(${d.params[0]}, ${d.params[1]})`;
    case "BETA": return `BETA(${d.params[0]}, ${d.params[1]})`;
    case "POIS": return `POIS(${d.params[0]})`;
    case "NEgexp": return `NEGEXP(${d.params[0]})`;
    case "LOGN": return `LOGN(${d.params[0]}, ${d.params[1]})`;
    case "constant": return String(d.params[0]);
  }
}

export function getDistributionUnits(): "Minutes" | "Hours" | "Seconds" {
  return "Minutes";
}
