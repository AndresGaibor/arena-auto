const { getModel } = require("./lifecycle.cjs");

function getSimanSource() {
    const model = getModel();
    if (!model) throw new Error("No model open");
    try {
        const siman = model.SIMAN;
        const source = siman.SourceText || "";
        return { ok: true, source, length: source.length };
    } catch (e) {
        return { ok: false, error: e.message, source: "" };
    }
}

function getSimanBlocks() {
    const model = getModel();
    if (!model) throw new Error("No model open");
    try {
        const siman = model.SIMAN;
        const blocks = [];
        try {
            const count = siman.ElementCount || 0;
            for (let i = 1; i <= count; i++) {
                blocks.push({
                    index: i,
                    name: siman.ElementName ? siman.ElementName(i) : `Element${i}`,
                    type: siman.ElementType ? siman.ElementType(i) : "unknown",
                });
            }
        } catch {}
        return { ok: true, blocks };
    } catch (e) {
        return { ok: false, error: e.message, blocks: [] };
    }
}

function getVbaMacros() {
    const model = getModel();
    if (!model) throw new Error("No model open");
    try {
        const vbe = model.VBE;
        if (!vbe) return { ok: true, macros: [], message: "VBA not available" };
        const vbProject = vbe.VBProjects.Item(1);
        const components = vbProject.VBComponents;
        const macros = [];
        for (let i = 1; i <= components.Count; i++) {
            const comp = components.Item(i);
            macros.push({
                name: comp.Name,
                type: comp.Type,
            });
        }
        return { ok: true, macros };
    } catch (e) {
        return { ok: false, error: e.message, macros: [] };
    }
}

function runVbaMacro({ macroName }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    try {
        model.RunMacro(macroName);
        return { ok: true, message: `Macro "${macroName}" executed` };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

function getSimanElement({ elementNumber }) {
    const model = getModel();
    if (!model) throw new Error("No model open");
    try {
        const siman = model.SIMAN;
        let element = null;
        try { element = siman.Element(elementNumber); } catch {}
        if (!element) try { element = siman.Block(elementNumber); } catch {}
        if (!element) throw new Error(`Element ${elementNumber} not found`);
        return { ok: true, element: String(element) };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

module.exports = {
    getSimanSource,
    getSimanBlocks,
    getVbaMacros,
    runVbaMacro,
    getSimanElement,
};
