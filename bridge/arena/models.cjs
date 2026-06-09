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

module.exports = {
    openModel,
    closeModel,
    createNewModel,
    saveModel,
    getModelInfo,
    exploreCom,
};
