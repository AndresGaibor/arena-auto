import type { TransporterModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileTransporterModule(mod: TransporterModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Transporter",
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
      params: { caption, property: "Transporter Name", value: mod.transporter },
    },
  ];

  if (mod.capacity !== undefined) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Capacity", value: String(mod.capacity) },
    });
  }

  if (mod.speed !== undefined) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Speed", value: String(mod.speed) },
    });
  }

  if (mod.distance) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Distance Set", value: mod.distance },
    });
  }

  if (mod.station) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Station Name", value: mod.station },
    });
  }

  return steps;
}
