import { describe, it, expect } from "bun:test";
import { listTemplates, loadTemplate, expandTemplate } from "../../src/templates/template-loader.js";

describe("listTemplates", () => {
  it("returns template catalog with entries", () => {
    const catalog = listTemplates();
    expect(catalog.templates.length).toBeGreaterThan(0);
  });

  it("each template has id, category, and params", () => {
    const catalog = listTemplates();
    for (const t of catalog.templates) {
      expect(t.id).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.params).toBeDefined();
    }
  });

  it("includes mm1 and mmc templates", () => {
    const catalog = listTemplates();
    const ids = catalog.templates.map((t) => t.id);
    expect(ids).toContain("mm1");
    expect(ids).toContain("mmc");
  });

  it("includes quality_inspection template", () => {
    const catalog = listTemplates();
    expect(catalog.templates.some((t) => t.id === "quality_inspection")).toBe(true);
  });
});

describe("expandTemplate", () => {
  it("replaces {{param}} with provided value", () => {
    const result = expandTemplate("EXPO({{mean}})", { mean: 5 });
    expect(result).toBe("EXPO(5)");
  });

  it("replaces multiple params", () => {
    const result = expandTemplate("EXPO({{a}}, {{b}})", { a: 1, b: "test" });
    expect(result).toBe("EXPO(1, test)");
  });

  it("leaves unknown params unchanged", () => {
    const result = expandTemplate("EXPO({{a}})", {});
    expect(result).toBe("EXPO({{a}})");
  });

  it("converts numbers to strings", () => {
    const result = expandTemplate("{{val}}", { val: 42 });
    expect(result).toBe("42");
  });
});

describe("loadTemplate", () => {
  it("loads mm1 template with defaults", () => {
    const spec = loadTemplate("mm1");
    expect(spec.name).toBe("MM1_Queue");
    expect(spec.flow.length).toBe(3);
    expect(spec.entities?.length).toBe(1);
    expect(spec.resources?.length).toBe(1);
    expect(spec.connections.length).toBe(2);
  });

  it("loads mm1 template with overrides", () => {
    const spec = loadTemplate("mm1", { arrivalMean: 10, serviceMean: 8, modelName: "Custom_MM1" });
    expect(spec.name).toBe("Custom_MM1");
    // Can't easily check params since they're in distribution objects
    expect(spec.flow[0]!.type).toBe("create");
  });

  it("loads mmc template", () => {
    const spec = loadTemplate("mmc", { numServers: 5 });
    expect(spec.name).toBe("MMC_Queue");
  });

  it("loads quality_inspection template", () => {
    const spec = loadTemplate("quality_inspection");
    expect(spec.flow.length).toBe(5);
    const decide = spec.flow.find((m) => m.type === "decide");
    expect(decide).toBeDefined();
  });

  it("loads serial_line template", () => {
    const spec = loadTemplate("serial_line");
    expect(spec.flow.length).toBe(5);
    expect(spec.resources?.length).toBe(3);
  });

  it("loads batching template", () => {
    const spec = loadTemplate("batching");
    expect(spec.flow.some((m) => m.type === "batch")).toBe(true);
    expect(spec.flow.some((m) => m.type === "separate")).toBe(true);
  });

  it("loads rework_loop template", () => {
    const spec = loadTemplate("rework_loop");
    const decide = spec.flow.find((m) => m.type === "decide");
    expect(decide).toBeDefined();
    // Check rework loop has 3 branches
    expect(spec.connections.length).toBe(5);
  });

  it("loads finite_capacity template", () => {
    const spec = loadTemplate("finite_capacity");
    const decide = spec.flow.find((m) => m.type === "decide");
    expect(decide).toBeDefined();
    expect(spec.flow.length).toBe(5);
  });

  it("throws for unknown template", () => {
    expect(() => loadTemplate("nonexistent_template")).toThrow("Template not found");
  });

  it("spec does not contain _params after loading", () => {
    const spec = loadTemplate("mm1");
    expect((spec as any)._params).toBeUndefined();
  });
});
