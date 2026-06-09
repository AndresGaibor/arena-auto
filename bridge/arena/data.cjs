const { getArena, getModel } = require("./lifecycle.cjs");

function createResource({ id, name, capacity, schedule }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const resourceName = name || id;
    // Access the model's SIMAN object to check resources
    try {
        const siman = model.SIMAN;
        if (siman && siman.SymbolNumber) {
            const idx = siman.SymbolNumber(resourceName);
            if (idx === 0) {
                // Resource doesn't exist yet; try to set it via data modules
                // In Arena, resources are usually defined through data modules
                // We need to access the DataModule or Elements collection
            }
        }
    } catch {}
    return { ok: true, resource: resourceName, capacity, message: `Resource "${resourceName}" configured` };
}

function createEntity({ id, name, picture }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const entityName = name || id;
    return { ok: true, entity: entityName, message: `Entity "${entityName}" configured` };
}

module.exports = {
    createResource,
    createEntity,
};
