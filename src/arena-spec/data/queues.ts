import type { QueueDef } from "../schema.js";
import type { DataStep } from "./index.js";

export function compileQueue(queue: QueueDef): DataStep[] {
  return [
    {
      type: "createQueue",
      params: {
        id: queue.id,
        name: queue.name || queue.id,
        discipline: queue.discipline ?? "FIFO",
        attributeName: queue.attributeName,
      },
    },
  ];
}

export function compileQueues(queues?: QueueDef[]): DataStep[] {
  return (queues || []).flatMap(compileQueue);
}
