import type { MatchModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileMatch(mod: MatchModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "Match",
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

  for (let i = 0; i < mod.entities.length; i++) {
    const ent = mod.entities[i]!;
    const slot = i + 1;
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: `Entity${slot}`, value: ent.entity },
    });
    if (ent.attribute) {
      steps.push({
        type: "setProperty",
        moduleRef: caption,
        params: { caption, property: `Attribute${slot}`, value: ent.attribute },
      });
    }
  }

  return steps;
}
