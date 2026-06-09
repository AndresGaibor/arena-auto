const { getModel } = require("./lifecycle.cjs");

function runModel({ batchMode, quietMode, replicationLength } = {}) {
    const model = getModel();
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
}

function setReplicationLength({ length }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    model.ReplicationLength = String(length);
    return { ok: true, length: String(model.ReplicationLength), message: "Replication length set" };
}

module.exports = {
    runModel,
    setReplicationLength,
};
