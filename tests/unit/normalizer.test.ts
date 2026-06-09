import { describe, it, expect } from "bun:test";
import { normalizeSpec, toSafeId, hasUnsafeIds } from "../../src/arena-spec/normalizer.js";
import type { ArenaModelSpec } from "../../src/arena-spec/schema.js";

describe("toSafeId", () => {
  it("replaces spaces with underscores", () => {
    expect(toSafeId("my module")).toBe("my_module");
  });

  it("replaces special chars", () => {
    expect(toSafeId("hello-world")).toBe("hello_world");
  });

  it("prefixes leading digit", () => {
    expect(toSafeId("1module")).toBe("_1module");
  });

  it("handles empty string", () => {
    expect(toSafeId("")).toBe("_unnamed");
  });
});

describe("normalizeSpec", () => {
  const spec: ArenaModelSpec = {
    name: "  My Model  ",
    flow: [
      { id: "create 1", type: "create", entity: "customer", arrival: { distribution: { type: "EXPO", params: [5] } } },
      { id: "process-1", type: "process", resource: "server", delay: { distribution: { type: "EXPO", params: [4] } } },
      { id: "exit", type: "dispose" },
    ],
    connections: [["create 1", "process-1"], ["process-1", "exit"]],
    entities: [{ id: "customer", name: "Customer" }],
    resources: [{ id: "server", name: "Server", capacity: 1 }],
  };

  it("trims name", () => {
    const n = normalizeSpec(spec);
    expect(n.name).toBe("My Model");
  });

  it("sanitizes IDs", () => {
    const n = normalizeSpec(spec);
    const createMod = n.flow.find((m) => m.id === "create_1");
    expect(createMod).toBeDefined();
    expect(createMod?.type).toBe("create");
  });

  it("resolves connections with sanitized IDs", () => {
    const n = normalizeSpec(spec);
    expect(n.connections.some(([f, t]) => f === "create_1" && t === "process_1")).toBe(true);
  });

  it("ensures entity names", () => {
    const n = normalizeSpec(spec);
    expect(n.entities?.[0]?.name).toBe("Customer");
  });

  it("assigns default name for unnamed models", () => {
    const n = normalizeSpec({ name: "", flow: [], connections: [] } as any);
    expect(n.name).toBeTruthy();
  });
});

describe("hasUnsafeIds", () => {
  it("detects unsafe module IDs", () => {
    expect(hasUnsafeIds({
      name: "test",
      flow: [{ id: "bad id", type: "create", entity: "e", arrival: { distribution: { type: "EXPO", params: [5] } } }],
      connections: [],
    })).toBe(true);
  });

  it("accepts safe IDs", () => {
    expect(hasUnsafeIds({
      name: "test",
      flow: [{ id: "safe_id", type: "create", entity: "e", arrival: { distribution: { type: "EXPO", params: [5] } } }],
      connections: [],
    })).toBe(false);
  });
});
