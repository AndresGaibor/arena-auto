export type DataStep = {
  type: "createEntity" | "createResource" | "createQueue" | "createSchedule" | "createSet" | "createFailure";
  params: Record<string, unknown>;
};

export { compileQueue, compileQueues } from "./queues.js";
export { compileSchedule, compileSchedules } from "./schedules.js";
export { compileSet, compileSets } from "./sets.js";
export { compileFailure, compileFailures } from "./failures.js";
