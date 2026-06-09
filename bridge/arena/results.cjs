const path = require("path");
const fs = require("fs");
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
    if (typeof siman.SymbolNumber !== "function") {
        // Handle different SIMAN interface
        const idx = siman.SymbolNumber(name);
        if (idx === 0) throw new Error(`Variable "${name}" not found`);
        siman.VariableArrayValue(idx) = value;
    } else {
        const idx = siman.SymbolNumber(name);
        if (idx === 0) throw new Error(`Variable "${name}" not found`);
        siman.VariableArrayValue(idx) = value;
    }
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

function extractResults() {
    const model = getModel();
    if (!model) throw new Error("No model open");

    const result = {
        simulationTime: 0,
        status: "",
        replications: 1,
        entities: [],
        queues: [],
        resources: [],
        variables: [],
    };

    try { result.simulationTime = model.SimulationTime; } catch {}
    try { result.status = model.Status; } catch {}

    const siman = model.SIMAN;
    if (!siman) return { ok: true, ...result };

    try {
        result.tnow = siman.TNOW;
        result.runNumber = siman.RunNumber;
        try { result.replications = siman.NumberOfReplications; } catch {}
    } catch {}

    // --- Extract variables ---
    try {
        const count = siman.VariableArrayCount;
        for (let i = 1; i <= count; i++) {
            try {
                const name = siman.VariableArrayName(i);
                const value = siman.VariableArrayValue(i);
                result.variables.push({ name, finalValue: value });
            } catch {}
        }
    } catch {}

    // --- Extract queue statistics ---
    try {
        const qCount = siman.QueueCount || 0;
        if (qCount > 0) {
            for (let i = 1; i <= qCount; i++) {
                try {
                    const name = siman.QueueName(i);
                    const length = siman.QueueLength(i);
                    // Arena post-run: use DSTAT for avg/wait if available
                    let avgLength = 0;
                    let avgWait = 0;
                    try { avgLength = siman.QueueAvgLength(i); } catch {}
                    try { avgWait = siman.QueueAvgWaitTime(i); } catch {}
                    result.queues.push({
                        name,
                        avgLength,
                        maxLength: length,
                        avgWaitTime: avgWait,
                        currentLength: length,
                    });
                } catch {}
            }
        }
    } catch {}

    // --- Extract resource statistics ---
    try {
        const rCount = siman.ResourceCount || 0;
        if (rCount > 0) {
            for (let i = 1; i <= rCount; i++) {
                try {
                    const name = siman.ResourceName(i);
                    const state = siman.ResourceState(i);
                    let utilization = 0;
                    let avgBusy = 0;
                    let avgIdle = 0;
                    try { avgBusy = siman.ResourceAvgBusy(i); } catch {}
                    try { avgIdle = siman.ResourceAvgIdle(i); } catch {}
                    try { utilization = avgBusy / (avgBusy + avgIdle || 1); } catch {}
                    result.resources.push({
                        name,
                        avgBusy,
                        avgUtilization: utilization,
                        avgIdle,
                        currentState: state,
                        avgNumberSeized: 0,
                        halfWidthNumberSeized: 0,
                    });
                } catch {}
            }
        }
    } catch {}

    // --- Extract entity statistics via DSTAT ---
    try {
        const dstatCount = siman.DSTATCount || 0;
        if (dstatCount > 0) {
            for (let i = 1; i <= dstatCount; i++) {
                try {
                    const name = siman.DSTATName(i);
                    const value = siman.DSTATValue(i);
                    // Map DSTAT entries to entity/queue/resource stats
                    // DSTAT contains output statistics after simulation
                } catch {}
            }
        }
    } catch {}

    return { ok: true, ...result };
}

function extractResultsViaReport({ format }) {
    const model = getModel();
    if (!model) throw new Error("No model open");

    const fmt = format || "csv";
    const filePath = path.join(process.cwd(), `arena_report_export.${fmt}`);

    try {
        const report = model.Report;
        report.Export(filePath);
        const content = fs.readFileSync(filePath, "utf-8");
        try { fs.unlinkSync(filePath); } catch {}
        return { ok: true, content, format: fmt };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

module.exports = {
    getModelResults,
    exportResults,
    getVariable,
    setVariable,
    listVariables,
    getQueueLength,
    getResourceState,
    extractResults,
    extractResultsViaReport,
};
