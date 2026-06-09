const winax = require("winax");
const ActiveXObject = winax.Object;

function sleep(ms) {
    // Simple busy wait for testing (not for production)
    const start = Date.now();
    while (Date.now() - start < ms) {}
}

let arena = new ActiveXObject("Arena.Application");
arena.Visible = false;

let model = arena.Models.Add();
let mods = model.Modules;
let dp = arena.Panels.Item(2);

function findDef(panel, name) {
    let defs = panel.ModuleDefinitions;
    for (let i = 1; i <= defs.Count; i++) {
        let md = defs.Item(i);
        if (md.Name === name) return md;
    }
    return null;
}

// Create modules
mods.Create(dp, findDef(dp, "Create"), 100, 200);
mods.Create(dp, findDef(dp, "Process"), 350, 200);
mods.Create(dp, findDef(dp, "Dispose"), 600, 200);
sleep(500);

console.log("=== Modules ===");
let createMod = null;
for (let i = 1; i <= mods.Count; i++) {
    let m = mods.Item(i);
    console.log(`  ${i}: Caption=${m.Caption}, Name=${m.Data('Name')}`);
    if (m.Caption && m.Caption.includes("Create")) createMod = m;
}

if (createMod) {
    console.log("\n=== Try setting Data ===");
    console.log("Before:", createMod.Data("Name"));
    
    // Try 1: winax indexed property set
    try {
        createMod.Data("Name") = "GeneratedParts";
        console.log("After assignment:", createMod.Data("Name"));
    } catch (e) {
        console.log("Assignment failed:", e.message);
    }
    
    // Try 2: 2-arg call
    try {
        createMod.Data("Name", "GeneratedParts2");
        console.log("After 2args:", createMod.Data("Name"));
    } catch (e) {
        console.log("2args failed:", e.message);
    }
    
    // Try 3: Check if Data returns an object with settable value
    try {
        let dataResult = createMod.Data("Name");
        console.log("Data return type:", typeof dataResult);
        console.log("Data return value:", dataResult);
    } catch (e) {}
    
    // Try 4: Read all operand names
    console.log("\n=== Reading all operands ===");
    for (let op of ["Name", "Entity Type", "Type", "Value", "Units", "Expression", "Schedule Name"]) {
        try {
            console.log(`  Data('${op}'):`, createMod.Data(op));
        } catch (e) {}
    }
}

// Check connections
console.log("\n=== Connections:", model.Connections.Count, "===");
let conns = model.Connections;
for (let i = 1; i <= conns.Count; i++) {
    let c = conns.Item(i);
    console.log(`  Connection ${i}:`, typeof c, c);
}

// Save
model.SaveAs("C:\\Users\\AndresGaibor\\Documents\\arena\\winax_test.doe");
console.log("\nSaved!");

arena.Quit();
console.log("DONE");
