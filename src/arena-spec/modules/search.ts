import type { SearchModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileSearch(mod: SearchModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "Search",
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
      params: { caption, property: "Queue Name", value: mod.queue },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Condition", value: mod.condition },
    },
  ];
}
