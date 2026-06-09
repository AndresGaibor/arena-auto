import { describe, it, expect } from "bun:test";
import { compileRecord } from "../../src/arena-spec/modules/record.js";
import { compileBatch } from "../../src/arena-spec/modules/batch.js";
import { compileSeparate } from "../../src/arena-spec/modules/separate.js";
import { compileHold } from "../../src/arena-spec/modules/hold.js";
import { compileSignal } from "../../src/arena-spec/modules/signal.js";
import { compileMatch } from "../../src/arena-spec/modules/match.js";
import { compileSearch } from "../../src/arena-spec/modules/search.js";
import { compileStore } from "../../src/arena-spec/modules/store.js";
import { compileUnstore } from "../../src/arena-spec/modules/unstore.js";
import { compileReadWrite } from "../../src/arena-spec/modules/readwrite.js";
import type { RecordModule, BatchModule, SeparateModule, HoldModule, SignalModule, MatchModule, SearchModule, StoreModule, UnstoreModule, ReadWriteModule } from "../../src/arena-spec/schema.js";

const POS = { x: 100, y: 200 };

describe("compileRecord", () => {
  it("generates createModule and setProperty steps", () => {
    const mod: RecordModule = { id: "RecordTime", type: "record", expression: "TNOW - ArrivalTime", name: "System Time" };
    const steps = compileRecord(mod, POS);
    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "RecordTime" });
    const nameStep = steps.find((s) => s.params.property === "Name");
    expect(nameStep?.params.value).toBe("RecordTime");
    const exprStep = steps.find((s) => s.params.property === "Expression");
    expect(exprStep?.params.value).toBe("TNOW - ArrivalTime");
  });

  it("sets Record Name when provided", () => {
    const mod: RecordModule = { id: "r1", type: "record", expression: "X", name: "MyRecord" };
    const steps = compileRecord(mod, POS);
    expect(steps.some((s) => s.params.property === "Record Name")).toBe(true);
  });

  it("omits Record Name when not provided", () => {
    const mod: RecordModule = { id: "r1", type: "record", expression: "X" };
    const steps = compileRecord(mod, POS);
    expect(steps.some((s) => s.params.property === "Record Name")).toBe(false);
  });
});

describe("compileBatch", () => {
  it("generates createModule and batch properties", () => {
    const mod: BatchModule = { id: "Batch1", type: "batch", batchSize: 5 };
    const steps = compileBatch(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Batch1" });
    const sizeStep = steps.find((s) => s.params.property === "Batch Size");
    expect(sizeStep?.params.value).toBe("5");
  });

  it("sets rule to Any Entity by default", () => {
    const mod: BatchModule = { id: "b1", type: "batch", batchSize: 5 };
    const steps = compileBatch(mod, POS);
    const typeStep = steps.find((s) => s.params.property === "Type");
    expect(typeStep?.params.value).toBe("Any Entity");
  });

  it("supports By Attribute rule with attribute name", () => {
    const mod: BatchModule = { id: "b1", type: "batch", batchSize: 5, rule: "By Attribute", attributeName: "BatchAttr" };
    const steps = compileBatch(mod, POS);
    expect(steps.some((s) => s.params.property === "Type" && s.params.value === "By Attribute")).toBe(true);
    expect(steps.some((s) => s.params.property === "Attribute Name" && s.params.value === "BatchAttr")).toBe(true);
  });
});

describe("compileSeparate", () => {
  it("generates createModule for Separate", () => {
    const mod: SeparateModule = { id: "Sep1", type: "separate" };
    const steps = compileSeparate(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Sep1" });
  });

  it("sets duplicate count when provided", () => {
    const mod: SeparateModule = { id: "s1", type: "separate", duplicates: 3 };
    const steps = compileSeparate(mod, POS);
    expect(steps.some((s) => s.params.property === "Duplicate" && s.params.value === "3")).toBe(true);
  });

  it("omits duplicate when not provided", () => {
    const mod: SeparateModule = { id: "s1", type: "separate" };
    const steps = compileSeparate(mod, POS);
    expect(steps.some((s) => s.params.property === "Duplicate")).toBe(false);
  });
});

describe("compileHold", () => {
  it("generates createModule and sets Type for wait action", () => {
    const mod: HoldModule = { id: "Hold1", type: "hold", action: "wait", signal: "Sig1" };
    const steps = compileHold(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Hold1" });
    const typeStep = steps.find((s) => s.params.property === "Type");
    expect(typeStep?.params.value).toBe("Wait for Signal");
    expect(steps.some((s) => s.params.property === "Signal" && s.params.value === "Sig1")).toBe(true);
  });

  it("sets scan properties for scan action", () => {
    const mod: HoldModule = { id: "Hold2", type: "hold", action: "scan", queue: "Q1", scanCondition: "Attr1 > 0", limit: 5 };
    const steps = compileHold(mod, POS);
    const typeStep = steps.find((s) => s.params.property === "Type");
    expect(typeStep?.params.value).toBe("Scan for Condition");
    expect(steps.some((s) => s.params.property === "Queue Name" && s.params.value === "Q1")).toBe(true);
    expect(steps.some((s) => s.params.property === "Condition" && s.params.value === "Attr1 > 0")).toBe(true);
    expect(steps.some((s) => s.params.property === "Limit" && s.params.value === "5")).toBe(true);
  });

  it("sets signal properties for signal action", () => {
    const mod: HoldModule = { id: "Hold3", type: "hold", action: "signal", signal: "Sig2", limit: 3 };
    const steps = compileHold(mod, POS);
    const typeStep = steps.find((s) => s.params.property === "Type");
    expect(typeStep?.params.value).toBe("Signal");
    expect(steps.some((s) => s.params.property === "Signal" && s.params.value === "Sig2")).toBe(true);
    expect(steps.some((s) => s.params.property === "Limit" && s.params.value === "3")).toBe(true);
  });
});

describe("compileSignal", () => {
  it("generates createModule and sets signal properties", () => {
    const mod: SignalModule = { id: "Sig1", type: "signal", signal: "GoSignal", limit: 5 };
    const steps = compileSignal(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Sig1" });
    expect(steps.some((s) => s.params.property === "Signal" && s.params.value === "GoSignal")).toBe(true);
    expect(steps.some((s) => s.params.property === "Limit" && s.params.value === "5")).toBe(true);
  });
});

describe("compileMatch", () => {
  it("generates createModule and sets entity slots", () => {
    const mod: MatchModule = { id: "Match1", type: "match", entities: [{ entity: "PartA" }, { entity: "PartB" }] };
    const steps = compileMatch(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Match1" });
    expect(steps.some((s) => s.params.property === "Entity1" && s.params.value === "PartA")).toBe(true);
    expect(steps.some((s) => s.params.property === "Entity2" && s.params.value === "PartB")).toBe(true);
  });

  it("sets attribute for matched entities when specified", () => {
    const mod: MatchModule = { id: "Match2", type: "match", entities: [{ entity: "PartA", attribute: "BatchID" }, { entity: "PartB" }] };
    const steps = compileMatch(mod, POS);
    expect(steps.some((s) => s.params.property === "Attribute1" && s.params.value === "BatchID")).toBe(true);
    expect(steps.some((s) => s.params.property === "Attribute2")).toBe(false);
  });
});

describe("compileSearch", () => {
  it("generates createModule and sets queue/condition", () => {
    const mod: SearchModule = { id: "Search1", type: "search", queue: "Q1", condition: "Attr1 > 0" };
    const steps = compileSearch(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Search1" });
    expect(steps.some((s) => s.params.property === "Queue Name" && s.params.value === "Q1")).toBe(true);
    expect(steps.some((s) => s.params.property === "Condition" && s.params.value === "Attr1 > 0")).toBe(true);
  });
});

describe("compileStore", () => {
  it("generates createModule and sets store name", () => {
    const mod: StoreModule = { id: "Store1", type: "store", store: "Queue1" };
    const steps = compileStore(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Store1" });
    expect(steps.some((s) => s.params.property === "Queue Name" && s.params.value === "Queue1")).toBe(true);
  });
});

describe("compileUnstore", () => {
  it("generates createModule and sets store/mode", () => {
    const mod: UnstoreModule = { id: "Unstore1", type: "unstore", store: "Queue1", mode: "first" };
    const steps = compileUnstore(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "Unstore1" });
    expect(steps.some((s) => s.params.property === "Queue Name" && s.params.value === "Queue1")).toBe(true);
    expect(steps.some((s) => s.params.property === "Mode" && s.params.value === "First")).toBe(true);
  });

  it("sets mode to Last for last mode", () => {
    const mod: UnstoreModule = { id: "u1", type: "unstore", store: "Q1", mode: "last" };
    const steps = compileUnstore(mod, POS);
    expect(steps.some((s) => s.params.property === "Mode" && s.params.value === "Last")).toBe(true);
  });

  it("sets mode to All for all mode", () => {
    const mod: UnstoreModule = { id: "u2", type: "unstore", store: "Q1", mode: "all" };
    const steps = compileUnstore(mod, POS);
    expect(steps.some((s) => s.params.property === "Mode" && s.params.value === "All")).toBe(true);
  });
});

describe("compileReadWrite", () => {
  it("generates createModule and sets read properties", () => {
    const mod: ReadWriteModule = { id: "RW1", type: "readwrite", mode: "read", filename: "input.txt" };
    const steps = compileReadWrite(mod, POS);
    expect(steps[0]).toMatchObject({ type: "createModule", moduleRef: "RW1" });
    expect(steps.some((s) => s.params.property === "Type" && s.params.value === "Read")).toBe(true);
    expect(steps.some((s) => s.params.property === "File Name" && s.params.value === "input.txt")).toBe(true);
  });

  it("sets write mode correctly", () => {
    const mod: ReadWriteModule = { id: "RW2", type: "readwrite", mode: "write", filename: "out.txt" };
    const steps = compileReadWrite(mod, POS);
    expect(steps.some((s) => s.params.property === "Type" && s.params.value === "Write")).toBe(true);
  });

  it("sets format when specified", () => {
    const mod: ReadWriteModule = { id: "RW3", type: "readwrite", mode: "read", filename: "data.csv", format: "CSV" };
    const steps = compileReadWrite(mod, POS);
    expect(steps.some((s) => s.params.property === "Format" && s.params.value === "CSV")).toBe(true);
  });

  it("omits format when not specified", () => {
    const mod: ReadWriteModule = { id: "RW4", type: "readwrite", mode: "read", filename: "data.txt" };
    const steps = compileReadWrite(mod, POS);
    expect(steps.some((s) => s.params.property === "Format")).toBe(false);
  });
});
