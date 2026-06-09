import type { UnstoreModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileUnstore(mod: UnstoreModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const modeLabels: Record<string, string> = {
    first: "First",
    last: "Last",
    all: "All",
  };
  return [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "Unstore",
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
      params: { caption, property: "Queue Name", value: mod.store },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Mode", value: modeLabels[mod.mode] ?? "First" },
    },
  ];
}
