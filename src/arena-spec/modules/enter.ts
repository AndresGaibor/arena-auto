import type { EnterModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileEnter(mod: EnterModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Enter",
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
      params: { caption, property: "Station Name", value: mod.station },
    },
  ];
}
