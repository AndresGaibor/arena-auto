import type { RecordModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileRecord(mod: RecordModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Record",
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
      params: { caption, property: "Type", value: "Expression" },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Expression", value: mod.expression },
    },
  ];

  if (mod.name) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Record Name", value: mod.name },
    });
  }

  return steps;
}
