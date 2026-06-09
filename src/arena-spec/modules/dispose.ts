import type { DisposeModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileDispose(mod: DisposeModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "DiscreteProcessing",
        moduleName: "Dispose",
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
}
