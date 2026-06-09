import type { ScheduleDef } from "../schema.js";
import type { DataStep } from "./index.js";

export function compileSchedule(schedule: ScheduleDef): DataStep[] {
  return [
    {
      type: "createSchedule",
      params: {
        id: schedule.id,
        name: schedule.name || schedule.id,
        type: schedule.type,
        timeUnits: schedule.timeUnits,
        durations: schedule.durations,
      },
    },
  ];
}

export function compileSchedules(schedules?: ScheduleDef[]): DataStep[] {
  return (schedules || []).flatMap(compileSchedule);
}
