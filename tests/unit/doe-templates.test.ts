import { describe, it, expect } from "bun:test";
import { listDoeTemplates } from "../../src/templates/doe-templates.js";

describe("listDoeTemplates", () => {
  it("returns template list (may be empty)", () => {
    const result = listDoeTemplates();
    expect(result.templates).toBeDefined();
    expect(Array.isArray(result.templates)).toBe(true);
  });
});
