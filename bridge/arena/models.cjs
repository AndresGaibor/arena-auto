const { getArena, getModel, setModel, clearModel } = require("./lifecycle.cjs");

function openModel({ path }) {
    getArena();
    const model = getArena().Models.Open(path);
    setModel(model);
    return { ok: true, path, message: "Model opened" };
}

function closeModel() {
    const model = getModel();
    if (model) {
        try { model.End(); } catch {}
        clearModel();
    }
    return { ok: true, message: "Model closed" };
}

function createNewModel() {
    getArena();
    const model = getArena().Models.Add();
    setModel(model);
    return { ok: true, name: model.Name, message: "New model created" };
}

function saveModel({ path }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const savePath = path || "C:\\Users\\AndresGaibor\\Documents\\arena\\mcp_model.doe";
    model.SaveAs(savePath);
    return { ok: true, path: savePath, message: "Model saved" };
}

function getModelInfo() {
    const model = getModel();
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
}

function exploreCom() {
    const arena = getArena();
    if (!arena) throw new Error("Arena not open");
    const r = { moduleCreationPossible: true };
    const model = getModel();
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
}

function generateCapabilityCatalog() {
    const arena = getArena();
    if (!arena) throw new Error("Arena not open");
    const model = getModel();
    if (!model) throw new Error("No model open; create or open a model first");

    const catalog = {
        version: "1.0",
        generatedAt: new Date().toISOString(),
        panels: [],
    };

    try { catalog.arenaVersion = String(arena.Version || ""); } catch {}

    const visitedNames = new Set();

    for (let i = 1; i <= arena.Panels.Count; i++) {
        const panel = arena.Panels.Item(i);
        const panelEntry = { name: panel.Name, modules: [] };

        for (let j = 1; j <= panel.ModuleDefinitions.Count; j++) {
            const modDef = panel.ModuleDefinitions.Item(j);
            const modName = modDef.Name;

            if (visitedNames.has(modName)) continue;
            visitedNames.add(modName);

            const modEntry = { name: modName, panelName: panel.Name, properties: [] };

            // Create one instance to discover properties
            try {
                const instance = model.Modules.Create(panel, modDef, 0, 0);
                if (instance) {
                    // Try common Arena property names
                    const probeProps = [
                        "Name", "Type", "Value", "Units", "Expression",
                        "Entity Type", "Delay Type", "Resource Name",
                        "Batch Size", "Attribute Name", "Record Name",
                        "Percent True", "Condition1", "Percent1",
                        "Assignment1", "Duplicate", "Action",
                        "Entities per Arrival", "Max Arrivals",
                        "Report Statistics", "Priority", "Queue Type",
                    ];
                    for (const prop of probeProps) {
                        try {
                            const val = instance.Data(prop);
                            if (val !== undefined && val !== null) {
                                modEntry.properties.push(prop);
                            }
                        } catch {}
                    }

                    // Also try to discover by reading all likely property names
                    // This is a best-effort discovery
                    try {
                        const names = [
                            "Name", "Type", "Expression", "Units", "Value",
                            "Delay Type", "Entity Type", "Resource Name",
                            "Action", "Percent True", "Percent False",
                            "Percent1", "Percent2", "Condition1", "Condition2",
                            "Assignment1", "Assignment2", "Assignment3",
                            "Batch Size", "Attribute Name", "Duplicate",
                            "Record Name", "Report Statistics",
                            "Entities per Arrival", "Max Arrivals",
                            "Priority", "Queue Type", "Allocation",
                            "Minutes", "Hours", "Seconds",
                        ];
                        for (const n of names) {
                            if (!modEntry.properties.includes(n)) {
                                try {
                                    const val = instance.Data(n);
                                    if (val !== undefined && val !== null) {
                                        modEntry.properties.push(n);
                                    }
                                } catch {}
                            }
                        }
                    } catch {}

                    try { instance.Dispose(); } catch {}
                }
            } catch {}

            if (modEntry.properties.length > 0) {
                panelEntry.modules.push(modEntry);
            }
        }

        if (panelEntry.modules.length > 0) {
            catalog.panels.push(panelEntry);
        }
    }

    return { ok: true, catalog };
}

module.exports = {
    openModel,
    closeModel,
    createNewModel,
    saveModel,
    getModelInfo,
    exploreCom,
};
