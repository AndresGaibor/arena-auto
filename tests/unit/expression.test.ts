import { describe, it, expect } from "bun:test";
import { parseExpression, isNumeric, isVariableRef, extractVariables } from "../../src/arena-spec/expression.js";

describe("parseExpression", () => {
  it("parses number", () => {
    const r = parseExpression("42");
    expect(r.parsed).toBe("number");
    expect(r.value).toBe(42);
  });

  it("parses decimal", () => {
    const r = parseExpression("3.14");
    expect(r.parsed).toBe("number");
    expect(r.value).toBe(3.14);
  });

  it("parses variable name", () => {
    const r = parseExpression("myVar");
    expect(r.parsed).toBe("variable");
    expect(r.variableName).toBe("myVar");
  });

  it("parses distribution EXPO(5)", () => {
    const r = parseExpression("EXPO(5)");
    expect(r.parsed).toBe("distribution");
    expect(r.distribution?.type).toBe("EXPO");
    expect(r.distribution?.params).toEqual([5]);
  });

  it("parses distribution TRIA(1, 3, 5)", () => {
    const r = parseExpression("TRIA(1, 3, 5)");
    expect(r.parsed).toBe("distribution");
    expect(r.distribution?.type).toBe("TRIA");
    expect(r.distribution?.params).toEqual([1, 3, 5]);
  });

  it("falls back to expression for complex expressions", () => {
    const r = parseExpression("A + B * 2");
    expect(r.parsed).toBe("expression");
  });
});

describe("isNumeric", () => {
  it("detects integers", () => expect(isNumeric("42")).toBe(true));
  it("detects decimals", () => expect(isNumeric("3.14")).toBe(true));
  it("detects negatives", () => expect(isNumeric("-5")).toBe(true));
  it("rejects words", () => expect(isNumeric("abc")).toBe(false));
  it("rejects empty", () => expect(isNumeric("")).toBe(false));
});

describe("isVariableRef", () => {
  it("accepts simple names", () => expect(isVariableRef("myVar")).toBe(true));
  it("accepts underscore names", () => expect(isVariableRef("_private")).toBe(true));
  it("rejects numbers", () => expect(isVariableRef("42")).toBe(false));
  it("rejects empty", () => expect(isVariableRef("")).toBe(false));
});

describe("extractVariables", () => {
  it("extracts from simple expression", () => {
    const vars = extractVariables("A + B * C");
    expect(vars).toContain("A");
    expect(vars).toContain("B");
    expect(vars).toContain("C");
  });

  it("deduplicates", () => {
    const vars = extractVariables("A + A + B");
    expect(vars.length).toBe(2);
  });
});
