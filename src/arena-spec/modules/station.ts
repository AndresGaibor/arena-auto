import type { StationModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileStation(mod: StationModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Station",
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

  if (mod.group) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Group", value: mod.group },
    });
  }

  return steps;
}
