import type { EntityDef } from "../schema.js";
import type { DataStep } from "./index.js";

export function compileEntity(entity: EntityDef): DataStep[] {
  // In Arena, entity types are defined via Data modules
  // We need to create an entity in the model's data elements
  return [
    {
      type: "createEntity",
      params: {
        id: entity.id,
        name: entity.name || entity.id,
        picture: entity.picture,
        initialCost: entity.initialCost,
        addCost: entity.addCost,
      },
    },
  ];
}

export function compileEntities(entities: EntityDef[]): DataStep[] {
  return entities.flatMap(compileEntity);
}
