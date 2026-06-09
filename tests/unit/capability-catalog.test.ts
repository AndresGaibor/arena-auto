import { describe, it, expect } from "bun:test";
import {
  getKnownProperties,
  resolvePropertyName,
} from "../../src/arena-spec/capability-catalog.js";
import type { CapabilityCatalog } from "../../src/arena-spec/capability-catalog.js";

const testCatalog: CapabilityCatalog = {
  version: "1.0",
  generatedAt: "2026-01-01",
  panels: [
    {
      name: "Basic Process",
      modules: [
        {
          name: "Create",
          panelName: "Basic Process",
          properties: ["Name", "Entity Type", "Type", "Expression", "Units", "Entities per Arrival", "Max Arrivals"],
        },
        {
          name: "Process",
          panelName: "Basic Process",
          properties: ["Name", "Type", "Action", "Delay Type", "Expression", "Units", "Resource Name"],
        },
        {
          name: "Dispose",
          panelName: "Basic Process",
          properties: ["Name"],
        },
      ],
    },
  ],
};

describe("getKnownProperties", () => {
  it("returns known properties for Create", () => {
    const props = getKnownProperties("Create");
    expect(props).toContain("Name");
    expect(props).toContain("Entity Type");
    expect(props).toContain("Expression");
    expect(props).toContain("Units");
  });

  it("returns known properties for Process", () => {
    const props = getKnownProperties("Process");
    expect(props).toContain("Action");
    expect(props).toContain("Resource Name");
    expect(props).toContain("Delay Type");
  });

  it("returns defaults for unknown module types", () => {
    const props = getKnownProperties("UnknownModule");
    expect(props).toEqual(["Name"]);
  });
});

describe("resolvePropertyName", () => {
  it("returns exact match from catalog", () => {
    expect(resolvePropertyName("Create", "Entity Type", testCatalog)).toBe("Entity Type");
  });

  it("returns fuzzy match from catalog", () => {
    expect(resolvePropertyName("Create", "Entity_Type", testCatalog)).toBe("Entity Type");
  });

  it("falls back to input property name if no match", () => {
    expect(resolvePropertyName("Create", "NonExistentProp", testCatalog)).toBe("NonExistentProp");
  });

  it("returns input if no catalog provided", () => {
    expect(resolvePropertyName("Create", "Entity Type")).toBe("Entity Type");
  });
});
