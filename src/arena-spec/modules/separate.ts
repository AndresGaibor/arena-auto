import type { SeparateModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileSeparate(mod: SeparateModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Separate",
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
  ];

  if (mod.duplicates !== undefined) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Duplicate", value: String(mod.duplicates) },
    });
  }

  return steps;
}
