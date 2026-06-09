import { describe, it, expect } from "bun:test";
import {
  isValidTimeUnit,
  normalizeTimeUnit,
  convertTime,
  TIME_UNITS,
  TIME_UNIT_TO_MS,
} from "../../src/arena-spec/units.js";

describe("isValidTimeUnit", () => {
  it("accepts Hours, Minutes, Seconds", () => {
    expect(isValidTimeUnit("Hours")).toBe(true);
    expect(isValidTimeUnit("Minutes")).toBe(true);
    expect(isValidTimeUnit("Seconds")).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isValidTimeUnit("hours")).toBe(false);
    expect(isValidTimeUnit("min")).toBe(false);
    expect(isValidTimeUnit("")).toBe(false);
    expect(isValidTimeUnit("Days")).toBe(false);
  });
});

describe("normalizeTimeUnit", () => {
  it("normalizes aliases", () => {
    expect(normalizeTimeUnit("h")).toBe("Hours");
    expect(normalizeTimeUnit("hr")).toBe("Hours");
    expect(normalizeTimeUnit("hour")).toBe("Hours");
    expect(normalizeTimeUnit("m")).toBe("Minutes");
    expect(normalizeTimeUnit("min")).toBe("Minutes");
    expect(normalizeTimeUnit("s")).toBe("Seconds");
    expect(normalizeTimeUnit("sec")).toBe("Seconds");
  });

  it("returns undefined for unknown", () => {
    expect(normalizeTimeUnit("days")).toBeUndefined();
  });
});

describe("convertTime", () => {
  it("converts Hours to Minutes", () => {
    expect(convertTime(1, "Hours", "Minutes")).toBe(60);
  });

  it("converts Minutes to Seconds", () => {
    expect(convertTime(1, "Minutes", "Seconds")).toBe(60);
  });

  it("converts Seconds to Hours", () => {
    expect(convertTime(3600, "Seconds", "Hours")).toBe(1);
  });

  it("converts Hours to Seconds", () => {
    expect(convertTime(1, "Hours", "Seconds")).toBe(3600);
  });

  it("same unit returns same value", () => {
    expect(convertTime(30, "Minutes", "Minutes")).toBe(30);
  });
});

describe("TIME_UNIT_TO_MS", () => {
  it("Hours to ms", () => expect(TIME_UNIT_TO_MS.Hours).toBe(3600000));
  it("Minutes to ms", () => expect(TIME_UNIT_TO_MS.Minutes).toBe(60000));
  it("Seconds to ms", () => expect(TIME_UNIT_TO_MS.Seconds).toBe(1000));
});
