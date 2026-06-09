import type { LeaveModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileLeave(mod: LeaveModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Leave",
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
