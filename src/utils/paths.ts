import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolveProjectPath(...segments: string[]): string {
  return path.resolve(__dirname, "..", "..", ...segments);
}

export function resolveWorkspacePath(...segments: string[]): string {
  const workspace = process.env.ARENA_WORKSPACE || path.join(os.homedir(), "Documents", "arena-workspace");
  return path.resolve(workspace, ...segments);
}

export function getWorkspaceRoot(): string {
  return process.env.ARENA_WORKSPACE || path.join(os.homedir(), "Documents", "arena-workspace");
}
