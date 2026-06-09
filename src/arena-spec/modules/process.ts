import type { ProcessModule } from "../schema.js";
import type { CompileStep } from "./index.js";
import { distributionToExpression, getDistributionUnits } from "./index.js";

export function compileProcess(mod: ProcessModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const expr = distributionToExpression(mod.delay.distribution);
  const units = mod.delay.units || getDistributionUnits();
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Process",
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
      params: { caption, property: "Type", value: "Standard" },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Delay Type", value: "Expression" },
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
  ];

  if (mod.resource) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Action", value: "Seize Delay Release" },
    });
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Resource Name", value: mod.resource },
    });
  }

  return steps;
}
