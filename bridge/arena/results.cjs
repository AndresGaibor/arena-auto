const path = require("path");
const { getModel } = require("./lifecycle.cjs");

function getModelResults() {
    const model = getModel();
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
}

function exportResults({ format }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const fmt = format || "txt";
    const report = model.Report;
    const filePath = path.join(process.cwd(), `arena_report.${fmt}`);
    report.Export(filePath);
    return { ok: true, path: filePath, message: `Report exported to ${filePath}` };
}

function getVariable({ name }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const siman = model.SIMAN;
    const idx = siman.SymbolNumber(name);
    if (idx === 0) throw new Error(`Variable "${name}" not found`);
    const value = siman.VariableArrayValue(idx);
    return { ok: true, name, value };
}

function setVariable({ name, value }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const siman = model.SIMAN;
    const idx = siman.SymbolNumber(name);
    if (idx === 0) throw new Error(`Variable "${name}" not found`);
    siman.VariableArrayValue(idx) = value;
    return { ok: true, name, value, message: "Variable set" };
}

function listVariables() {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const siman = model.SIMAN;
    const count = siman.VariableArrayCount;
    const names = [];
    for (let i = 1; i <= count; i++) {
        names.push(siman.VariableArrayName(i));
    }
    return { ok: true, variables: names, count };
}

function getQueueLength({ queueName }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const siman = model.SIMAN;
    const idx = siman.SymbolNumber(queueName);
    if (idx === 0) throw new Error(`Queue "${queueName}" not found`);
    return { ok: true, queueName, length: siman.QueueLength(idx) };
}

function getResourceState({ resourceName }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const siman = model.SIMAN;
    const idx = siman.SymbolNumber(resourceName);
    if (idx === 0) throw new Error(`Resource "${resourceName}" not found`);
    return { ok: true, resourceName, state: siman.ResourceState(idx) };
}

module.exports = {
    getModelResults,
    exportResults,
    getVariable,
    setVariable,
    listVariables,
    getQueueLength,
    getResourceState,
};
