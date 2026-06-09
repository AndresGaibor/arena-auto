const { getArena, clearModel, clearArena } = require("./arena/lifecycle.cjs");
const lifecycle = require("./arena/lifecycle.cjs");
const models = require("./arena/models.cjs");
const modules = require("./arena/modules.cjs");
const simulation = require("./arena/simulation.cjs");
const results = require("./arena/results.cjs");
const data = require("./arena/data.cjs");
const siman = require("./arena/siman.cjs");

const handlers = {
    // --- Arena lifecycle ---
    openArena({ visible }) {
        const arena = new lifecycle.ActiveXObject("Arena.Application");
        arena.Visible = visible !== false;
        lifecycle.setArena(arena);
        return { ok: true, message: "Arena opened" };
    },

    closeArena() {
        if (lifecycle.peekModel()) {
            try { lifecycle.peekModel().End(); } catch {}
            lifecycle.clearModel();
        }
        const arena = lifecycle.peekArena();
        if (arena) {
            try { arena.Quit(); } catch {}
            lifecycle.clearArena();
        }
        return { ok: true, message: "Arena closed" };
    },

    // --- Model management ---
    openModel: models.openModel,
    closeModel: models.closeModel,
    createNewModel: models.createNewModel,
    saveModel: models.saveModel,
    getModelInfo: models.getModelInfo,
    exploreCom: models.exploreCom,
    generateCapabilityCatalog: models.generateCapabilityCatalog,

    // --- Module operations ---
    createModule: modules.createModule,
    getModuleProperty: modules.getModuleProperty,
    setModuleProperty: modules.setModuleProperty,
    listModuleProperties: modules.listModuleProperties,
    addConnection: modules.addConnection,
    listModules: modules.listModules,

    // --- Simulation ---
    runModel: simulation.runModel,
    setReplicationLength: simulation.setReplicationLength,

    // --- Data ---
    createResource: data.createResource,
    createEntity: data.createEntity,
    createQueue: data.createQueue,
    createSchedule: data.createSchedule,
    createSet: data.createSet,
    createFailure: data.createFailure,

    // --- Results ---
    getModelResults: results.getModelResults,
    exportResults: results.exportResults,
    getVariable: results.getVariable,
    setVariable: results.setVariable,
    listVariables: results.listVariables,
    getQueueLength: results.getQueueLength,
    getResourceState: results.getResourceState,
    extractResults: results.extractResults,
    extractResultsViaReport: results.extractResultsViaReport,

    // --- SIMAN / VBA ---
    getSimanSource: siman.getSimanSource,
    getSimanBlocks: siman.getSimanBlocks,
    getVbaMacros: siman.getVbaMacros,
    runVbaMacro: siman.runVbaMacro,
    getSimanElement: siman.getSimanElement,

    // --- Ping ---
    ping() {
        return {
            ok: true,
            message: "pong",
            arenaOpen: lifecycle.hasArena(),
            modelOpen: lifecycle.hasModel(),
        };
    },
};

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
    const arena = lifecycle.peekArena();
    if (arena) { try { arena.Quit(); } catch {} }
    process.exit(0);
});
