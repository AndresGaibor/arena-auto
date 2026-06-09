import type { Distribution } from "../schema.js";
import { distributionToArenaExpression, getDistributionMeta } from "../distributions.js";

export type CompileStep = {
  type: "createModule" | "setProperty" | "createEntity" | "createResource" | "addConnection" | "setReplicationLength" | "saveModel";
  moduleRef?: string;
  params: Record<string, unknown>;
};

export function distributionToExpression(d: Distribution): string {
  return distributionToArenaExpression(d);
}

export function getDistributionUnits(): "Minutes" | "Hours" | "Seconds" {
  return "Minutes";
}

export { compileHold } from "./hold.js";
export { compileSignal } from "./signal.js";
export { compileMatch } from "./match.js";
export { compileSearch } from "./search.js";
export { compileStore } from "./store.js";
export { compileUnstore } from "./unstore.js";
export { compileReadWrite } from "./readwrite.js";
export { compileStation } from "./station.js";
export { compileRoute } from "./route.js";
export { compileEnter } from "./enter.js";
export { compileLeave } from "./leave.js";
export { compilePickStation } from "./pickstation.js";
export { compileTransporterModule } from "./transporter.js";
export { compileConveyorModule } from "./conveyor.js";
export { compileAccess } from "./access.js";
export { compileRelease } from "./release.js";
