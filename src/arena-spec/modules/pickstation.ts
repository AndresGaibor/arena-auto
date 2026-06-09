import type { PickStationModule } from "../schema.js";
import type { CompileStep } from "./index.js";

export function compilePickStation(mod: PickStationModule, position: { x: number; y: number }): CompileStep[] {
  const caption = mod.id;
  const ruleLabels: Record<string, string> = {
    random: "Random",
    smallestQueue: "Smallest Queue",
    largestQueue: "Largest Queue",
    specific: "Specific Station",
  };
  const steps: CompileStep[] = [
    {
      type: "createModule",
      params: {
        panelName: "AdvancedTransfer",
        moduleName: "PickStation",
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
      params: { caption, property: "Station Names", value: mod.stations.join(",") },
    },
    {
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Rule", value: ruleLabels[mod.rule] ?? "Random" },
    },
  ];

  if (mod.rule === "specific" && mod.specificStation) {
    steps.push({
      type: "setProperty",
      moduleRef: caption,
      params: { caption, property: "Specific Station", value: mod.specificStation },
    });
  }

  return steps;
}
