import type { BatchModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileBatch(mod: BatchModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Batch",
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
      params: { caption, property: "Batch Size", value: String(mod.batchSize) },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Type", value: mod.rule === "By Attribute" ? "By Attribute" : "Any Entity" },
    },
  ];

  if (mod.rule === "By Attribute" && mod.attributeName) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Attribute Name", value: mod.attributeName },
    });
  }

  return steps;
}
