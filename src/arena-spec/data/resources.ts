import type { ResourceDef } from "../schema.js";
import type { DataStep } from "./index.js";
import { compileFailures } from "./failures.js";

export function compileResource(resource: ResourceDef): DataStep[] {
  const steps: DataStep[] = [
    {
      type: "createResource",
      params: {
        id: resource.id,
        name: resource.name || resource.id,
        capacity: resource.capacity,
        schedule: resource.schedule,
        costs: resource.costs,
      },
    },
  ];

  if (resource.failures && resource.failures.length > 0) {
    steps.push(...compileFailures(resource.id, resource.failures));
  }

  return steps;
}

export function compileResources(resources: ResourceDef[]): DataStep[] {
  return resources.flatMap(compileResource);
}
