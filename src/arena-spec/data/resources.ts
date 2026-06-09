import type { ResourceDef } from "../schema.js";
import type { DataStep } from "./index.js";

export function compileResource(resource: ResourceDef): DataStep[] {
  return [
    {
      type: "createResource",
      params: {
        id: resource.id,
        name: resource.name || resource.id,
        capacity: resource.capacity,
        schedule: resource.schedule,
      },
    },
  ];
}

export function compileResources(resources: ResourceDef[]): DataStep[] {
  return resources.flatMap(compileResource);
}
