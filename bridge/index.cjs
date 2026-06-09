const winax = require("winax");
const ActiveXObject = winax.Object;

let arena = null;
let model = null;

function getArena() {
    if (!arena) {
        arena = new ActiveXObject("Arena.Application");
    }
    return arena;
}

const handlers = {
    // --- Arena lifecycle ---
    openArena({ visible }) {
        arena = new ActiveXObject("Arena.Application");
        arena.Visible = visible !== false;
        return { ok: true, message: "Arena opened" };
    },

    closeArena() {
        if (model) { try { model.End(); } catch {} model = null; }
        if (arena) { try { arena.Quit(); } catch {} arena = null; }
        return { ok: true, message: "Arena closed" };
    },

    // --- Model management ---
    openModel({ path }) {
        getArena();
        model = arena.Models.Open(path);
        return { ok: true, path, message: "Model opened" };
    },

    closeModel() {
        if (model) { try { model.End(); } catch {} model = null; }
        return { ok: true, message: "Model closed" };
    },

    createNewModel() {
        getArena();
        model = arena.Models.Add();
        return { ok: true, name: model.Name, message: "New model created" };
    },

    // --- Module creation ---
    createModule({ panelName, moduleName, x, y }) {
        if (!model) throw new Error("No model open");
        const panels = arena.Panels;
        let targetPanel = null;
        for (let i = 1; i <= panels.Count; i++) {
            const p = panels.Item(i);
            if (p.Name === panelName) { targetPanel = p; break; }
        }
        if (!targetPanel) throw new Error(`Panel "${panelName}" not found`);
        const defs = targetPanel.ModuleDefinitions;
        let targetDef = null;
        for (let i = 1; i <= defs.Count; i++) {
            const md = defs.Item(i);
            if (md.Name === moduleName) { targetDef = md; break; }
        }
        if (!targetDef) throw new Error(`Module "${moduleName}" not found in panel "${panelName}"`);
        const newMod = model.Modules.Create(targetPanel, targetDef, x || 100, y || 200);
        return { ok: true, caption: newMod.Caption, message: `Module "${moduleName}" created` };
    },

    // --- Module properties ---
    getModuleProperty({ caption, property }) {
        if (!model) throw new Error("No model open");
        const m = findModule(caption);
        if (!m) throw new Error(`Module with caption "${caption}" not found`);
        return { ok: true, caption, property, value: m.Data(property) };
    },

    setModuleProperty({ caption, property, value }) {
        if (!model) throw new Error("No model open");
        const m = findModule(caption);
        if (!m) throw new Error(`Module with caption "${caption}" not found`);
        m.Data(property, value);
        return { ok: true, caption, property, value, message: "Property set" };
    },

    listModuleProperties({ caption }) {
        if (!model) throw new Error("No model open");
        const m = findModule(caption);
        if (!m) throw new Error(`Module with caption "${caption}" not found");
        const props = {};
        // Try common property names based on module type
        const commonProps = ["Name", "Entity Type", "Type", "Value", "Units", "Expression",
                           "Delay Type", "Allocation", "Minutes", "Hours", "Seconds",
                           "Report Statistics", "Priority", "Queue Type"];
        for (const p of commonProps) {
            try {
                props[p] = m.Data(p);
            } catch {}
        }
        return { ok: true, caption, properties: props };
    },

    // --- Connections ---
    addConnection({ fromCaption, toCaption }) {
        if (!model) throw new Error("No model open");
        const fromMod = findModule(fromCaption);
        const toMod = findModule(toCaption);
        if (!fromMod) throw new Error(`Source module "${fromCaption}" not found`);
        if (!toMod) throw new Error(`Target module "${toCaption}" not found`);
        const conns = model.Connections;
        // Try different methods
        try { conns.Add(fromMod, toMod); return { ok: true, message: "Connected" }; } catch {}
        try { conns.Connect(fromMod, toMod); return { ok: true, message: "Connected" }; } catch {}
        try { conns.Create(fromMod, toMod); return { ok: true, message: "Connected" }; } catch {}
        throw new Error("Could not connect modules");
    },

    // --- Run ---
    runModel({ batchMode, quietMode, replicationLength } = {}) {
        if (!model) throw new Error("No model open");
        model.BatchMode = batchMode !== false;
        model.QuietMode = quietMode !== false;
        if (replicationLength !== undefined) {
            model.ReplicationLength = String(replicationLength);
        } else if (String(model.ReplicationLength) === "Infinite") {
            model.ReplicationLength = "1000";
        }
        model.Go();
        return { ok: true, message: "Simulation run completed" };
    },

    getModelResults() {
        if (!model) throw new Error("No model open");
        const results = {};
        try { results.simulationTime = model.SimulationTime; } catch {}
        try { results.status = model.Status; } catch {}
        try {
            const siman = model.SIMAN();
            results.tnow = siman.TNOW;
            results.runNumber = siman.RunNumber;
            results.numberOfReplications = siman.NumberOfReplications;
        } catch {}
        return { ok: true, results };
    },

    setReplicationLength({ length }) {
        if (!model) throw new Error("No model open");
        model.ReplicationLength = String(length);
        return { ok: true, length: String(model.ReplicationLength), message: "Replication length set" };
    },
        } catch {}
        return { ok: true, results };
    },

    setReplicationLength({ length }) {
        if (!model) throw new Error("No model open");
        model.ReplicationLength = String(length);
        return { ok: true, length: String(model.ReplicationLength), message: "Replication length set" };
    },

    // --- Existing methods ---
    getVariable({ name }) {
        if (!model) throw new Error("No model open");
        const siman = model.SIMAN;
        const idx = siman.SymbolNumber(name);
        if (idx === 0) throw new Error(`Variable "${name}" not found`);
        const value = siman.VariableArrayValue(idx);
        return { ok: true, name, value };
    },

    setVariable({ name, value }) {
        if (!model) throw new Error("No model open");
        const siman = model.SIMAN;
        const idx = siman.SymbolNumber(name);
        if (idx === 0) throw new Error(`Variable "${name}" not found`);
        siman.VariableArrayValue(idx) = value;
        return { ok: true, name, value, message: "Variable set" };
    },

    listVariables() {
        if (!model) throw new Error("No model open");
        const siman = model.SIMAN;
        const count = siman.VariableArrayCount;
        const names = [];
        for (let i = 1; i <= count; i++) {
            names.push(siman.VariableArrayName(i));
        }
        return { ok: true, variables: names, count };
    },

    listModules() {
        if (!model) throw new Error("No model open");
        const modules = model.Modules;
        const list = [];
        for (let i = 1; i <= modules.Count; i++) {
            const mod = modules.Item(i);
            list.push({
                caption: mod.Caption,
                type: mod.Type,
                id: mod.ID,
            });
        }
        return { ok: true, modules: list, count: list.length };
    },

    exportResults({ format }) {
        if (!model) throw new Error("No model open");
        const fmt = format || "txt";
        const report = model.Report;
        const path = require("path").join(process.cwd(), `arena_report.${fmt}`);
        report.Export(path);
        return { ok: true, path, message: `Report exported to ${path}` };
    },

    getQueueLength({ queueName }) {
        if (!model) throw new Error("No model open");
        const siman = model.SIMAN;
        const idx = siman.SymbolNumber(queueName);
        if (idx === 0) throw new Error(`Queue "${queueName}" not found`);
        return { ok: true, queueName, length: siman.QueueLength(idx) };
    },

    getResourceState({ resourceName }) {
        if (!model) throw new Error("No model open");
        const siman = model.SIMAN;
        const idx = siman.SymbolNumber(resourceName);
        if (idx === 0) throw new Error(`Resource "${resourceName}" not found`);
        return { ok: true, resourceName, state: siman.ResourceState(idx) };
    },

    getModelInfo() {
        if (!model) throw new Error("No model open");
        const info = {
            name: model.Name || "",
            simulationTime: model.SimulationTime || 0,
            status: model.Status || "",
            batchMode: model.BatchMode,
            quietMode: model.QuietMode,
            moduleCount: model.Modules ? model.Modules.Count : 0,
        };
        try { info.simanAvailable = !!model.SIMAN; } catch { info.simanAvailable = false; }
        return { ok: true, ...info };
    },

    saveModel({ path }) {
        if (!model) throw new Error("No model open");
        const savePath = path || "C:\\Users\\AndresGaibor\\Documents\\arena\\mcp_model.doe";
        model.SaveAs(savePath);
        return { ok: true, path: savePath, message: "Model saved" };
    },

    exploreCom() {
        if (!arena) throw new Error("Arena not open");
        const r = {};
        r.moduleCreationPossible = true;
        if (model) {
            try {
                r.moduleCount = model.Modules ? model.Modules.Count : 0;
                r.connectionCount = model.Connections ? model.Connections.Count : 0;
                r.panelCount = arena.Panels ? arena.Panels.Count : 0;
                const panels = [];
                for (let i = 1; i <= arena.Panels.Count; i++) {
                    const p = arena.Panels.Item(i);
                    const defs = [];
                    for (let j = 1; j <= p.ModuleDefinitions.Count; j++) {
                        defs.push(p.ModuleDefinitions.Item(j).Name);
                    }
                    panels.push({ name: p.Name, modules: defs });
                }
                r.panels = panels;
            } catch (e) { r.exploreError = e.message; }
        }
        return { ok: true, results: r };
    },

    ping() {
        return { ok: true, message: "pong", arenaOpen: arena !== null, modelOpen: model !== null };
    },
};

function findModule(caption) {
    const modules = model.Modules;
    for (let i = 1; i <= modules.Count; i++) {
        const m = modules.Item(i);
        if (m.Caption === caption) return m;
    }
    return null;
}

// I/O loop
let lineBuffer = "";
process.stdin.on("data", (chunk) => {
    lineBuffer += chunk.toString();
    const lines = lineBuffer.split("\n");
    lineBuffer = lines.pop();

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let request;
        try {
            request = JSON.parse(trimmed);
        } catch {
            respond({ id: null, error: "Invalid JSON" });
            continue;
        }

        const { id, method, params } = request;
        const handler = handlers[method];
        if (!handler) {
            respond({ id, error: `Unknown method: ${method}` });
            continue;
        }

        try {
            const result = handler(params);
            respond({ id, result });
        } catch (err) {
            respond({ id, error: err.message });
        }
    }
});

function respond(msg) {
    process.stdout.write(JSON.stringify(msg) + "\n");
}

process.stdin.on("end", () => {
    if (arena) { try { arena.Quit(); } catch {} }
    process.exit(0);
});
