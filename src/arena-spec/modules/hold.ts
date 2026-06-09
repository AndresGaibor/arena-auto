import type { HoldModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compileHold(mod: HoldModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const actionLabels: Record<string, string> = {
    wait: "Wait for Signal",
    scan: "Scan for Condition",
    signal: "Signal",
  };
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedProcess",
        moduleName: "Hold",
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
      params: { caption, property: "Type", value: actionLabels[mod.action] ?? "Wait for Signal" },
    },
  ];

  if (mod.action === "wait" && mod.signal) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Signal", value: mod.signal },
    });
  }

  if (mod.action === "scan") {
    if (mod.queue) {
      steps.push({
        type: "setProperty",
        moduleRef: caption,
        params: { caption, property: "Queue Name", value: mod.queue },
      });
    }
    if (mod.scanCondition) {
      steps.push({
        type: "setProperty",
        moduleRef: caption,
        params: { caption, property: "Condition", value: mod.scanCondition },
      });
    }
    if (mod.limit !== undefined) {
      steps.push({
        type: "setProperty",
        moduleRef: caption,
        params: { caption, property: "Limit", value: String(mod.limit) },
      });
    }
  }

  if (mod.action === "signal") {
    if (mod.signal) {
      steps.push({
        type: "setProperty",
        moduleRef: caption,
        params: { caption, property: "Signal", value: mod.signal },
      });
    }
    if (mod.limit !== undefined) {
      steps.push({
        type: "setProperty",
        moduleRef: caption,
        params: { caption, property: "Limit", value: String(mod.limit) },
      });
    }
  }

  return steps;
}
