const winax = require("winax");
const ActiveXObject = winax.Object;

let arena = null;
let model = null;

function getArena() {
    if (!arena) {
        arena = new ActiveXObject("Arena.Application");
    }
    return arena;
}

function getModel() {
    return model;
}

function setModel(m) {
    model = m;
}

function clearModel() {
    model = null;
}

function clearArena() {
    arena = null;
}

function setArena(a) {
    arena = a;
}

function hasArena() {
    return arena !== null;
}

function hasModel() {
    return model !== null;
}

function peekArena() {
    return arena;
}

function peekModel() {
    return model;
}

module.exports = {
    ActiveXObject,
    getArena,
    setArena,
    getModel,
    setModel,
    clearModel,
    clearArena,
    hasArena,
    hasModel,
    peekArena,
    peekModel,
};
