import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_SCRIPT = path.resolve(__dirname, "..", "bridge", "index.cjs");

let proc: ChildProcess | null = null;
let pending: Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }> = new Map();
let nextId = 1;
let buf = "";
let busy = false;
let cmdQueue: Array<() => void> = [];

function start() {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      "node",
      [BRIDGE_SCRIPT],
      { stdio: ["pipe", "pipe", "pipe"], windowsHide: true },
    );

    proc = child;

    child.stdout!.on("data", (data: Buffer) => {
      buf += data.toString();
      const lines = buf.split("\n");
      buf = lines.pop()!;
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        try {
          const msg = JSON.parse(t);
          const p = pending.get(msg.id);
          if (p) {
            pending.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error));
            else p.resolve(msg.result ?? msg);
          }
        } catch {
          /* ignore parse errors */
        }
      }
    });

    child.stderr!.on("data", (d: Buffer) => {
      const s = d.toString().trim();
      if (s) console.error("[node-bridge]", s);
    });

    child.on("error", (e) => {
      console.error("[node-bridge] error:", e.message);
      reject(e);
    });

    child.on("exit", (code) => {
      console.error(`[node-bridge] exited (${code})`);
      proc = null;
      for (const [id, p] of pending) {
        p.reject(new Error("Bridge process died"));
        pending.delete(id);
      }
    });

    child.on("spawn", () => resolve());
    setTimeout(() => resolve(), 500);
  });
}

function send(method: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!proc || !proc.stdin) {
      reject(new Error("Bridge not started"));
      return;
    }
    const id = nextId++;
    const req = JSON.stringify({ id, method, params }) + "\n";
    pending.set(id, { resolve, reject });
    proc.stdin.write(req);
  });
}

let initPromise: Promise<void> | null = null;

async function ensure() {
  if (!initPromise) {
    initPromise = (async () => {
      await start();
      await send("ping");
    })();
  }
  await initPromise;
}

async function lockedSend(method: string, params?: any): Promise<any> {
  await new Promise<void>((resolve) => {
    if (!busy) {
      busy = true;
      resolve();
    } else {
      cmdQueue.push(resolve);
    }
  });

  try {
    return await send(method, params);
  } finally {
    if (cmdQueue.length > 0) {
      const next = cmdQueue.shift()!;
      next();
    } else {
      busy = false;
    }
  }
}

export async function callBridge(method: string, params?: any): Promise<any> {
  await ensure();
  return lockedSend(method, params);
}

// Convenience wrappers
export async function openArena(visible = false) {
  return callBridge("openArena", { visible });
}

export async function closeArena() {
  const r = await callBridge("closeArena");
  if (proc) { proc.stdin!.end(); proc = null }
  initPromise = null;
  return r;
}

export async function openModel(modelPath: string) {
  return callBridge("openModel", { path: modelPath });
}

export async function closeModel() {
  return callBridge("closeModel");
}

export async function runModel(batchMode = true, quietMode = true) {
  return callBridge("runModel", { batchMode, quietMode });
}

export async function getVariable(name: string) {
  return callBridge("getVariable", { name });
}

export async function setVariable(name: string, value: number) {
  return callBridge("setVariable", { name, value });
}

export async function listVariables() {
  return callBridge("listVariables");
}

export async function listModules() {
  return callBridge("listModules");
}

export async function exportResults(format = "txt") {
  return callBridge("exportResults", { format });
}

export async function getQueueLength(queueName: string) {
  return callBridge("getQueueLength", { queueName });
}

export async function getResourceState(resourceName: string) {
  return callBridge("getResourceState", { resourceName });
}

export async function getModelInfo() {
  return callBridge("getModelInfo");
}

export async function exploreCom() {
  return callBridge("exploreCom");
}

export async function createNewModel() {
  return callBridge("createNewModel");
}

export async function createModule(panelName: string, moduleName: string, x?: number, y?: number) {
  return callBridge("createModule", { panelName, moduleName, x, y });
}

export async function getModuleProperty(caption: string, property: string) {
  return callBridge("getModuleProperty", { caption, property });
}

export async function setModuleProperty(caption: string, property: string, value: any) {
  return callBridge("setModuleProperty", { caption, property, value });
}

export async function listModuleProperties(caption: string) {
  return callBridge("listModuleProperties", { caption });
}

export async function addConnection(fromCaption: string, toCaption: string) {
  return callBridge("addConnection", { fromCaption, toCaption });
}

export async function saveModel(path?: string) {
  return callBridge("saveModel", { path });
}
