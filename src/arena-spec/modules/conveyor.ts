import type { ConveyorModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileConveyorModule(mod: ConveyorModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const typeLabels: Record<string, string> = {
    fixed: "Fixed",
    accumulating: "Accumulating",
  };
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Conveyor",
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

  if (mod.capacity !== undefined) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Capacity", value: String(mod.capacity) },
    });
  }

  if (mod.length !== undefined) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Length", value: String(mod.length) },
    });
  }

  if (mod.speed !== undefined) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Speed", value: String(mod.speed) },
    });
  }

  if (mod.conveyorType) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Type", value: typeLabels[mod.conveyorType] ?? "Fixed" },
    });
  }

  return steps;
}
