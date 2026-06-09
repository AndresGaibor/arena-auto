import type { DecideModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileDecide(mod: DecideModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const hasProbability = mod.branches.some((b) => b.type === "probability");
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Decide",
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

  if (mod.branches.length === 2 && hasProbability) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Type", value: "2-way by Chance" },
    });
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Percent True", value: String((mod.branches[0] as any).value * 100) },
    });
  } else {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Type", value: hasProbability ? "N-way by Chance" : "N-way by Condition" },
    });
    for (let i = 0; i < mod.branches.length; i++) {
      const b = mod.branches[i]!;
      if (b.type === "probability") {
        steps.push({
          type: "setProperty",
          moduleRef: caption,
          params: { caption, property: `Percent${i + 1}`, value: String(b.value * 100) },
        });
      } else {
        steps.push({
          type: "setProperty",
          moduleRef: caption,
          params: { caption, property: `Condition${i + 1}`, value: b.expression },
        });
      }
    }
  }

  return steps;
}
