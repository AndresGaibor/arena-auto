import { describe, it, expect } from "bun:test";
import {
  validateDistribution,
  distributionToArenaExpression,
  getDistributionMeta,
  DISTRIBUTION_REGISTRY,
} from "../../src/arena-spec/distributions.js";

describe("getDistributionMeta", () => {
  it("returns meta for EXPO", () => {
    const meta = getDistributionMeta({ type: "EXPO", params: [5] });
    expect(meta?.name).toBe("Exponential");
    expect(meta?.paramCount).toBe(1);
  });

  it("returns meta for TRIA", () => {
    const meta = getDistributionMeta({ type: "TRIA", params: [1, 3, 5] });
    expect(meta?.paramCount).toBe(3);
    expect(meta?.paramNames).toEqual(["Min", "Mode", "Max"]);
  });

  it("returns undefined for unknown type", () => {
    expect(getDistributionMeta({ type: "UNKNOWN" as any, params: [1] })).toBeUndefined();
  });
});

describe("validateDistribution", () => {
  it("accepts valid EXPO(5)", () => {
    expect(validateDistribution({ type: "EXPO", params: [5] })).toBeNull();
  });

  it("rejects EXPO(0)", () => {
    expect(validateDistribution({ type: "EXPO", params: [0] })).toContain("mean");
  });

  it("rejects wrong parameter count", () => {
    expect(validateDistribution({ type: "EXPO", params: [1, 2] } as any))
      .toContain("requires 1 parameters");
  });

  it("rejects NaN parameters", () => {
    expect(validateDistribution({ type: "EXPO", params: [NaN] })).toContain("numbers");
  });

  it("accepts valid TRIA(1,3,5)", () => {
    expect(validateDistribution({ type: "TRIA", params: [1, 3, 5] })).toBeNull();
  });

  it("accepts valid NORM(10,2)", () => {
    expect(validateDistribution({ type: "NORM", params: [10, 2] })).toBeNull();
  });

  it("accepts valid ERLA(10,3)", () => {
    expect(validateDistribution({ type: "ERLA", params: [10, 3] })).toBeNull();
  });

  it("rejects ERLA with non-integer k", () => {
    expect(validateDistribution({ type: "ERLA", params: [10, 1.5] })).toContain("k");
  });

  it("accepts constant", () => {
    expect(validateDistribution({ type: "constant", params: [42] })).toBeNull();
  });

  it("rejects unknown distribution type", () => {
    expect(validateDistribution({ type: "BOGUS" as any, params: [1] })).toContain("Unknown");
  });
});

describe("distributionToArenaExpression", () => {
  it("formats EXPO(5)", () => {
    expect(distributionToArenaExpression({ type: "EXPO", params: [5] })).toBe("EXPO(5)");
  });

  it("formats TRIA(1, 3, 5)", () => {
    expect(distributionToArenaExpression({ type: "TRIA", params: [1, 3, 5] })).toBe("TRIA(1, 3, 5)");
  });

  it("formats constant as bare number", () => {
    expect(distributionToArenaExpression({ type: "constant", params: [42] })).toBe("42");
  });

  it("formats NEGEXP", () => {
    expect(distributionToArenaExpression({ type: "NEgexp", params: [5] })).toBe("NEGEXP(5)");
  });
});
