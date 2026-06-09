import path from "path";
import fs from "fs";
import { getWorkspaceRoot as _getWorkspaceRoot } from "../utils/paths.js";

export const getWorkspaceRoot = _getWorkspaceRoot;

export function isPathInWorkspace(targetPath: string): { ok: true; resolved: string } | { ok: false; reason: string } {
  const workspace = getWorkspaceRoot();
  const workspaceResolved = path.resolve(workspace);
  const targetResolved = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.join(workspaceResolved, targetPath);

  const relative = path.relative(workspaceResolved, targetResolved);

  const inside =
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));

  if (inside) {
    return { ok: true, resolved: targetResolved };
  }

  return {
    ok: false,
    reason: `Path "${targetPath}" is outside the allowed workspace. Allowed: ${workspaceResolved}`,
  };
}

export function ensureWorkspaceExists(): void {
  const workspace = getWorkspaceRoot();
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
  }
}
