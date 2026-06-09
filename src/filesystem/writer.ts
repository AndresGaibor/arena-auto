import fs from "fs";
import path from "path";
import { isPathInWorkspace } from "./workspace.js";
import { isBinaryExtension, fileExists } from "./guards.js";
import { createBackup } from "./backup.js";

export type PatchOperation = {
  old: string;
  new: string;
};

export type PatchResult = {
  path: string;
  applied: boolean;
  changes: number;
  backupId?: string;
};

export function applyPatch(
  filePath: string,
  patches: PatchOperation[],
  options: { createBackup?: boolean; dryRun?: boolean } = {},
): PatchResult {
  const check = isPathInWorkspace(filePath);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const resolved = check.resolved;

  if (!fileExists(resolved)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (isBinaryExtension(resolved)) {
    throw new Error(`Cannot patch binary file: ${filePath}`);
  }

  const originalContent = fs.readFileSync(resolved, "utf-8");
  let content = originalContent;
  let changes = 0;

  for (const patch of patches) {
    const index = content.indexOf(patch.old);
    if (index === -1) {
      throw new Error(`Pattern not found in file: "${patch.old.slice(0, 50)}..."`);
    }
    // Check for multiple occurrences
    const secondIndex = content.indexOf(patch.old, index + 1);
    if (secondIndex !== -1) {
      throw new Error(
        `Pattern found multiple times. Provide more context to uniquely identify the location: "${patch.old.slice(0, 50)}..."`,
      );
    }
    content = content.replace(patch.old, patch.new);
    changes++;
  }

  if (options.dryRun) {
    return { path: filePath, applied: false, changes };
  }

  let backupId: string | undefined;

  if (options.createBackup !== false) {
    const manifest = createBackup(filePath, "file_patch");
    backupId = manifest.id;
  }

  // Atomic write: write to temp file first, then rename
  const tmpPath = resolved + ".tmp";
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, resolved);

  return { path: filePath, applied: true, changes, backupId };
}

export function writeFileSafe(
  filePath: string,
  content: string,
  options: { createBackup?: boolean } = {},
): { path: string; size: number; backupId?: string } {
  const check = isPathInWorkspace(filePath);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const resolved = check.resolved;

  let backupId: string | undefined;
  if (options.createBackup !== false && fileExists(resolved)) {
    const manifest = createBackup(filePath, "file_write");
    backupId = manifest.id;
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(resolved);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Atomic write
  const tmpPath = resolved + ".tmp";
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, resolved);

  const stat = fs.statSync(resolved);
  return { path: filePath, size: stat.size, backupId };
}
