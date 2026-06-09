import type { ResourceFailure } from "../schema.js";
import type { DataStep } from "./index.js";

export function compileFailure(failure: ResourceFailure, parentId: string): DataStep[] {
  return [
    {
      type: "createFailure",
      params: {
        id: `${parentId}_failure`,
        name: `${parentId}_Failure`,
        type: failure.type,
        count: failure.count,
        length: failure.length,
        units: failure.units,
        downtimeUnits: failure.downtimeUnits,
        uptimeUnits: failure.uptimeUnits,
      },
    },
  ];
}

export function compileFailures(resourceId: string, failures?: ResourceFailure[]): DataStep[] {
  return (failures || []).flatMap((f) => compileFailure(f, resourceId));
}
