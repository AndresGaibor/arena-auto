import type { SetDef } from "../schema.js";
import type { DataStep } from "./index.js";

export function compileSet(set: SetDef): DataStep[] {
  return [
    {
      type: "createSet",
      params: {
        id: set.id,
        name: set.name || set.id,
        setType: set.type,
        members: set.members,
      },
    },
  ];
}

export function compileSets(sets?: SetDef[]): DataStep[] {
  return (sets || []).flatMap(compileSet);
}
