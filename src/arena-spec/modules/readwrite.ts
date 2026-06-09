import type { ReadWriteModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileReadWrite(mod: ReadWriteModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "ReadWrite",
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
      params: { caption, property: "Type", value: mod.mode === "read" ? "Read" : "Write" },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "File Name", value: mod.filename },
    },
  ];

  if (mod.format) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Format", value: mod.format },
    });
  }

  return steps;
}
