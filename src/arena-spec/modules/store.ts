import type { StoreModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileStore(mod: StoreModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "Store",
        x: position.x,
        y: position.y,
      },
      moduleRef: caption,
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Name", value: caption },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Queue Name", value: mod.store },
    },
  ];
}
