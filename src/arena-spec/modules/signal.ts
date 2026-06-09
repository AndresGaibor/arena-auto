import type { SignalModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileSignal(mod: SignalModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "Signal",
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
      params: { caption, property: "Signal", value: mod.signal },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Limit", value: String(mod.limit) },
    },
  ];
}
