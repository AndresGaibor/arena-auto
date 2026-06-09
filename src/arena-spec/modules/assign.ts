import type { AssignModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileAssign(mod: AssignModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Assign",
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

  // Arena Assign modules have assignment slots
  for (let i = 0; i < mod.assignments.length; i++) {
    const a = mod.assignments[i]!;
    const slot = i + 1;
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: `Assignment${slot}`, value: `${a.variable} = ${a.value}` },
    });
  }

  return steps;
}
