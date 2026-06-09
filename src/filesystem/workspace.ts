import path from "path";
import fs from "fs";
import { getWorkspaceRoot } from "../utils/paths.js";

export function isPathInWorkspace(targetPath: string): { ok: true; resolved: string } | { ok: false; reason: string } {
  const workspace = getWorkspaceRoot();
  const resolved = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.join(workspace, targetPath);

  if (!path.relative(workspace, resolved).startsWith("..")) {
    return { ok: true, resolved };
  }

  return {
    ok: false,
    reason: `Path "${targetPath}" is outside the allowed workspace. Allowed: ${workspace}`,
  };
}

export function ensureWorkspaceExists(): void {
  const workspace = getWorkspaceRoot();
  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
  }
}

export function resolveSafePath(inputPath: string): string {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }
  return path.join(getWorkspaceRoot(), inputPath);
}
