import type { CreateModule } from "../schema.js";
import type { CompileStep } from "./index.js";
import { distributionToExpression, getDistributionUnits } from "./index.js";

export function compileCreate(mod: CreateModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const expr = distributionToExpression(mod.arrival.distribution);
  const units = mod.arrival.distribution.type === "constant" ? "Hours" : getDistributionUnits();

  return [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Create",
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
      params: { caption, property: "Entity Type", value: mod.entity },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Type", value: "Expression" },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Expression", value: expr },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Units", value: units },
    },
    ...(mod.arrival.entitiesPerArrival !== undefined
      ? [{
          type: "setProperty" as const,
          moduleRef: caption,
          params: { caption, property: "Entities per Arrival", value: String(mod.arrival.entitiesPerArrival) },
        }]
      : []),
    ...(mod.arrival.maxArrivals !== undefined
      ? [{
          type: "setProperty" as const,
          moduleRef: caption,
          params: { caption, property: "Max Arrivals", value: String(mod.arrival.maxArrivals) },
        }]
      : []),
  ];
}
