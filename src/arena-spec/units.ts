import type { TimeUnit } from "./schema.js";

export const TIME_UNITS: TimeUnit[] = ["Hours", "Minutes", "Seconds"];

export const TIME_UNIT_MAP: Record<TimeUnit, string> = {
  Hours: "Hours",
  Minutes: "Minutes",
  Seconds: "Seconds",
};

export const TIME_UNIT_ALIASES: Record<string, TimeUnit> = {
  h: "Hours",
  hr: "Hours",
  hrs: "Hours",
  hour: "Hours",
  hours: "Hours",
  m: "Minutes",
  min: "Minutes",
  mins: "Minutes",
  minute: "Minutes",
  minutes: "Minutes",
  s: "Seconds",
  sec: "Seconds",
  secs: "Seconds",
  second: "Seconds",
  seconds: "Seconds",
};

export function normalizeTimeUnit(unit: string): TimeUnit | undefined {
  const lower = unit.toLowerCase();
  return TIME_UNIT_ALIASES[lower];
}

export function isValidTimeUnit(unit: string): unit is TimeUnit {
  return TIME_UNITS.includes(unit as TimeUnit);
}

export function convertTime(value: number, from: TimeUnit, to: TimeUnit): number {
  const inSeconds = toSeconds(value, from);
  return fromSeconds(inSeconds, to);
}

function toSeconds(value: number, unit: TimeUnit): number {
  switch (unit) {
    case "Hours": return value * 3600;
    case "Minutes": return value * 60;
    case "Seconds": return value;
  }
}

function fromSeconds(seconds: number, unit: TimeUnit): number {
  switch (unit) {
    case "Hours": return seconds / 3600;
    case "Minutes": return seconds / 60;
    case "Seconds": return seconds;
  }
}

export const TIME_UNIT_TO_MS: Record<TimeUnit, number> = {
  Hours: 3600000,
  Minutes: 60000,
  Seconds: 1000,
};
