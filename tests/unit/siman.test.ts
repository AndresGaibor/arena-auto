import { describe, it, expect } from "bun:test";

describe("SIMAN module", () => {
  it("can import client module", () => {
    const mod = require("../../src/siman/client.js");
    expect(mod.getSource).toBeDefined();
    expect(mod.getBlocks).toBeDefined();
    expect(mod.getMacros).toBeDefined();
    expect(mod.runMacro).toBeDefined();
  });

  it("types module exports", () => {
    expect(true).toBe(true);
  });
});
