import type { ReleaseModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileRelease(mod: ReleaseModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Release",
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
      params: { caption, property: "Conveyor Name", value: mod.conveyor },
    },
  ];
}
