const { getArena, getModel } = require("./lifecycle.cjs");

function findModule(caption) {
    const model = getModel();
    if (!model) return null;
    const modules = model.Modules;
    for (let i = 1; i <= modules.Count; i++) {
        const m = modules.Item(i);
        if (m.Caption === caption) return m;
    }
    return null;
}

function createModule({ panelName, moduleName, x, y }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const arena = getArena();
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
}

function getModuleProperty({ caption, property }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const m = findModule(caption);
    if (!m) throw new Error(`Module with caption "${caption}" not found`);
    return { ok: true, caption, property, value: m.Data(property) };
}

function setModuleProperty({ caption, property, value }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const m = findModule(caption);
    if (!m) throw new Error(`Module with caption "${caption}" not found`);
    const captionBefore = m.Caption;
    m.Data(property, value);
    const captionAfter = m.Caption;
    return { ok: true, captionBefore, captionAfter, property, value, message: "Property set" };
}

function listModuleProperties({ caption }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const m = findModule(caption);
    if (!m) throw new Error(`Module with caption "${caption}" not found`);
    const props = {};
    const commonProps = ["Name", "Entity Type", "Type", "Value", "Units", "Expression",
                       "Delay Type", "Allocation", "Minutes", "Hours", "Seconds",
                       "Report Statistics", "Priority", "Queue Type"];
    for (const p of commonProps) {
        try { props[p] = m.Data(p); } catch {}
    }
    return { ok: true, caption, properties: props };
}

function addConnection({ fromCaption, toCaption }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const fromMod = findModule(fromCaption);
    const toMod = findModule(toCaption);
    if (!fromMod) throw new Error(`Source module "${fromCaption}" not found`);
    if (!toMod) throw new Error(`Target module "${toCaption}" not found`);
    const conns = model.Connections;
    try { conns.Add(fromMod, toMod); return { ok: true, message: "Connected" }; } catch {}
    try { conns.Connect(fromMod, toMod); return { ok: true, message: "Connected" }; } catch {}
    try { conns.Create(fromMod, toMod); return { ok: true, message: "Connected" }; } catch {}
    throw new Error("Could not connect modules");
}

function listModules() {
    const model = getModel();
    if (!model) throw new Error("No model open");
    const modules = model.Modules;
    const list = [];
    for (let i = 1; i <= modules.Count; i++) {
        const mod = modules.Item(i);
        list.push({ caption: mod.Caption, type: mod.Type, id: mod.ID });
    }
    return { ok: true, modules: list, count: list.length };
}

module.exports = {
    findModule,
    createModule,
    getModuleProperty,
    setModuleProperty,
    listModuleProperties,
    addConnection,
    listModules,
};
