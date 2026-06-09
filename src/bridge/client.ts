import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { BridgeError, BridgeErrorCode } from "./errors.js";
import { logger } from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE_SCRIPT = path.resolve(__dirname, "..", "..", "bridge", "index.cjs");

const DEFAULT_TIMEOUT_MS = 30_000;

type PendingRequest = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

let proc: ChildProcess | null = null;
const pending = new Map<number, PendingRequest>();
let nextId = 1;
let buf = "";
let busy = false;
const cmdQueue: Array<() => void> = [];
let initPromise: Promise<void> | null = null;

function start(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("node", [BRIDGE_SCRIPT], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

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
            clearTimeout(p.timer);
            pending.delete(msg.id);
            if (msg.error) {
              p.reject(new BridgeError(BridgeErrorCode.COM_ERROR, msg.error));
            } else {
              p.resolve(msg.result ?? msg);
            }
          }
        } catch {
          // ignore parse errors
        }
      }
    });

    child.stderr!.on("data", (d: Buffer) => {
      const s = d.toString().trim();
      if (s) logger.warn("[bridge]", { stderr: s });
    });

    child.on("error", (e) => {
      logger.error("[bridge] process error", { message: e.message });
      reject(e);
    });

    child.on("exit", (code) => {
      logger.info("[bridge] process exited", { code });
      proc = null;
      for (const [id, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new BridgeError(BridgeErrorCode.BRIDGE_DIED, "Bridge process died"));
        pending.delete(id);
      }
    });

    child.on("spawn", () => resolve());
  });
}

function send(method: string, params?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!proc || !proc.stdin) {
      reject(new BridgeError(BridgeErrorCode.BRIDGE_DIED, "Bridge not started"));
      return;
    }
    const id = nextId++;
    const req = JSON.stringify({ id, method, params }) + "\n";
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new BridgeError(BridgeErrorCode.TIMEOUT, `Operation "${method}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    proc.stdin.write(req);
  });
}

async function ensure(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await start();
      await send("ping");
    })();
  }
  await initPromise;
}

async function lockedSend(method: string, params?: unknown, timeoutMs?: number): Promise<unknown> {
  await new Promise<void>((resolve) => {
    if (!busy) {
      busy = true;
      resolve();
    } else {
      cmdQueue.push(resolve);
    }
  });
  try {
    return await send(method, params, timeoutMs);
  } finally {
    if (cmdQueue.length > 0) {
      const next = cmdQueue.shift()!;
      next();
    } else {
      busy = false;
    }
  }
}

export async function callBridge(method: string, params?: unknown, timeoutMs?: number): Promise<unknown> {
  await ensure();
  return lockedSend(method, params, timeoutMs);
}

export function destroyBridge(): void {
  if (proc) {
    try { proc.stdin!.end(); } catch { /* ignore */ }
    proc = null;
  }
  initPromise = null;
}
