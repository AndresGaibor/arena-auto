import type { RouteModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileRoute(mod: RouteModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "Route",
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
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Route Time", value: String(mod.routeTime) },
    },
  ];

  if (mod.units) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Units", value: mod.units },
    });
  }

  return steps;
}
