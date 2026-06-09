import type { ArenaModelSpec, FlowModule } from "./schema.js";

export type LayoutPosition = {
  id: string;
  x: number;
  y: number;
};

const X_STEP = 250;
const Y_START = 200;
const Y_BRANCH_OFFSET = 80;

export function calculateLayout(spec: ArenaModelSpec): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const connections = spec.connections;
  const moduleMap = new Map(spec.flow.map((m) => [m.id, m]));

  // Find entry points (modules with no incoming connections)
  const hasIncoming = new Set(connections.map(([, to]) => to));
  const entryPoints = spec.flow.filter((m) => !hasIncoming.has(m.id));

  let currentX = 100;
  const placed = new Set<string>();
  const yOffsets = new Map<string, number>();
  const queue: Array<{ id: string; x: number; parentY: number }> = [];

  // Place entry points
  for (const entry of entryPoints) {
    queue.push({ id: entry.id, x: currentX, parentY: Y_START });
    currentX += X_STEP;
  }

  while (queue.length > 0) {
    const item = queue.shift()!;
    if (placed.has(item.id)) continue;
    placed.add(item.id);

    const mod = moduleMap.get(item.id);
    if (!mod) continue;

    // Determine y position
    let y = item.parentY;
    if (mod.type === "decide") {
      // Decide branches: offset each branch
      const outgoing = spec.connections.filter(([from]) => from === item.id);
      outgoing.forEach(([, to], i) => {
        if (!placed.has(to)) {
          queue.push({ id: to, x: item.x + X_STEP, parentY: y + (i - (outgoing.length - 1) / 2) * Y_BRANCH_OFFSET });
        }
      });
      yOffsets.set(item.id, y);
    } else {
      // Single output: find next module
      const outgoing = spec.connections.filter(([from]) => from === item.id);
      for (const [, to] of outgoing) {
        if (!placed.has(to)) {
          queue.push({ id: to, x: item.x + X_STEP, parentY: y });
        }
      }
    }

    positions.push({ id: item.id, x: item.x, y });
  }

  // Place any unplaced modules (disconnected) at the end
  for (const mod of spec.flow) {
    if (!placed.has(mod.id)) {
      positions.push({ id: mod.id, x: currentX, y: Y_START });
      currentX += X_STEP;
    }
  }

  return positions;
}
