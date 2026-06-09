const { getArena, getModel } = require("./lifecycle.cjs");

function findDataModulePanel(arena, panelNames) {
    const panels = arena.Panels;
    for (let i = 1; i <= panels.Count; i++) {
        const p = panels.Item(i);
        if (panelNames.includes(p.Name)) return p;
    }
    return null;
}

function findModuleDef(panel, defName) {
    const defs = panel.ModuleDefinitions;
    for (let i = 1; i <= defs.Count; i++) {
        const md = defs.Item(i);
        if (md.Name === defName) return md;
    }
    return null;
}

function createResource({ id, name, capacity, schedule, failures, costs }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
    const resourceName = name || id;

    const panel = findDataModulePanel(arena, ["BasicProcess", "Basic Process", "AdvancedProcess", "Advanced Process"]);
    if (!panel) throw new Error("Could not find Basic/Advanced Process panel for Resource creation");

    const def = findModuleDef(panel, "Resource");
    if (!def) throw new Error("Resource module definition not found in panel");

    const resourceMod = model.Modules.Create(panel, def, 0, 0);
    resourceMod.Data("Name", resourceName);
    if (capacity !== undefined) resourceMod.Data("Capacity", capacity);
    if (schedule !== undefined) resourceMod.Data("Schedule", schedule);

    // Set cost data if provided
    if (costs) {
        if (costs.perHour !== undefined) resourceMod.Data("Cost Per Hour", costs.perHour);
        if (costs.perUse !== undefined) resourceMod.Data("Cost Per Use", costs.perUse);
        if (costs.perUnit !== undefined) resourceMod.Data("Cost Per Unit", costs.perUnit);
        if (costs.initial !== undefined) resourceMod.Data("Initial Cost", costs.initial);
    }

    // Create failure modules if provided
    if (failures && failures.length > 0) {
        for (const failure of failures) {
            const failureName = `${resourceName}_Failure`;
            createFailure({ id: failureName, name: failureName, type: failure.type, count: failure.count, length: failure.length, units: failure.units, downtimeUnits: failure.downtimeUnits, uptimeUnits: failure.uptimeUnits });
        }
    }

    return { ok: true, resource: resourceName, caption: resourceMod.Caption, capacity, message: `Resource "${resourceName}" created` };
}

function createEntity({ id, name, picture }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
    const entityName = name || id;

    const panel = findDataModulePanel(arena, ["BasicProcess", "Basic Process"]);
    if (!panel) throw new Error("Could not find BasicProcess panel for Entity creation");

    const def = findModuleDef(panel, "Entity");
    if (!def) throw new Error("Entity module definition not found in panel");

    const entityMod = model.Modules.Create(panel, def, 0, 0);
    entityMod.Data("Name", entityName);
    if (picture !== undefined) entityMod.Data("Initial Picture", picture);

    return { ok: true, entity: entityName, caption: entityMod.Caption, message: `Entity "${entityName}" created` };
}

function createQueue({ id, name, discipline, attributeName }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
    const queueName = name || id;

    const panel = findDataModulePanel(arena, ["BasicProcess", "Basic Process", "AdvancedProcess", "Advanced Process"]);
    if (!panel) throw new Error("Could not find Basic/Advanced Process panel for Queue creation");

    const def = findModuleDef(panel, "Queue");
    if (!def) throw new Error("Queue module definition not found in panel");

    const queueMod = model.Modules.Create(panel, def, 0, 0);
    queueMod.Data("Name", queueName);
    if (discipline !== undefined) queueMod.Data("Type", discipline);
    if (attributeName !== undefined) queueMod.Data("Attribute Name", attributeName);

    return { ok: true, queue: queueName, caption: queueMod.Caption, message: `Queue "${queueName}" created` };
}

function createSchedule({ id, name, type, timeUnits, durations }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
    const schedName = name || id;

    const panel = findDataModulePanel(arena, ["BasicProcess", "Basic Process", "AdvancedProcess", "Advanced Process"]);
    if (!panel) throw new Error("Could not find Basic/Advanced Process panel for Schedule creation");

    const def = findModuleDef(panel, "Schedule");
    if (!def) throw new Error("Schedule module definition not found in panel");

    const schedMod = model.Modules.Create(panel, def, 0, 0);
    schedMod.Data("Name", schedName);
    if (type !== undefined) schedMod.Data("Type", type);
    if (timeUnits !== undefined) schedMod.Data("Time Units", timeUnits);

    // Set duration values if provided
    if (durations && durations.length > 0) {
        for (let i = 0; i < durations.length; i++) {
            const d = durations[i];
            const idx = i + 1;
            schedMod.Data(`Duration Value ${idx}`, d.value);
            schedMod.Data(`Duration Length ${idx}`, d.length);
        }
    }

    return { ok: true, schedule: schedName, caption: schedMod.Caption, message: `Schedule "${schedName}" created` };
}

function createSet({ id, name, setType, members }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
    const setName = name || id;

    const panel = findDataModulePanel(arena, ["BasicProcess", "Basic Process", "AdvancedProcess", "Advanced Process"]);
    if (!panel) throw new Error("Could not find Basic/Advanced Process panel for Set creation");

    const def = findModuleDef(panel, "Set");
    if (!def) throw new Error("Set module definition not found in panel");

    const setMod = model.Modules.Create(panel, def, 0, 0);
    setMod.Data("Name", setName);
    if (setType !== undefined) setMod.Data("Type", setType);

    // Set members if provided
    if (members && members.length > 0) {
        for (let i = 0; i < members.length; i++) {
            const idx = i + 1;
            setMod.Data(`Member ${idx}`, members[i]);
        }
    }

    return { ok: true, set: setName, caption: setMod.Caption, message: `Set "${setName}" created` };
}

function createFailure({ id, name, type, count, length, units, downtimeUnits, uptimeUnits }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
    const failureName = name || id;

    const panel = findDataModulePanel(arena, ["AdvancedProcess", "Advanced Process"]);
    if (!panel) throw new Error("Could not find AdvancedProcess panel for Failure creation");

    const def = findModuleDef(panel, "Failure");
    if (!def) throw new Error("Failure module definition not found in panel");

    const failureMod = model.Modules.Create(panel, def, 0, 0);
    failureMod.Data("Name", failureName);
    if (type !== undefined) failureMod.Data("Type", type);
    if (count !== undefined) failureMod.Data("Count", count);
    if (length !== undefined) failureMod.Data("Length", length);
    if (units !== undefined) failureMod.Data("Units", units);
    if (downtimeUnits !== undefined) failureMod.Data("Downtime Units", downtimeUnits);
    if (uptimeUnits !== undefined) failureMod.Data("Uptime Units", uptimeUnits);

    return { ok: true, failure: failureName, caption: failureMod.Caption, message: `Failure "${failureName}" created` };
}

module.exports = {
    createResource,
    createEntity,
    createQueue,
    createSchedule,
    createSet,
    createFailure,
};
