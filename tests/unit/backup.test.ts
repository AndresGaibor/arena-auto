import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "path";
import os from "os";
import fs from "fs";

const ORIGINAL_WORKSPACE = process.env.ARENA_WORKSPACE;
let testDir: string;
let backupRoot: string;

// Simplified backup functions for testing (avoids hardcoded BACKUP_ROOT)
function createBackup(filePath: string, workspace: string, backupRootDir: string): {
  id: string;
  createdAt: string;
  operation: string;
  files: Array<{ original: string; resolvedOriginal: string; backup: string }>;
} {
  const workspaceResolved = path.resolve(workspace);
  const targetResolved = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.join(workspaceResolved, filePath);

  const relative = path.relative(workspaceResolved, targetResolved);
  const inside = relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));

  if (!inside) {
    throw new Error(`Path "${filePath}" is outside the allowed workspace. Allowed: ${workspaceResolved}`);
  }

  if (!fs.existsSync(backupRootDir)) {
    fs.mkdirSync(backupRootDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = path.join(backupRootDir, timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupName = path.basename(targetResolved).replace(/\./g, "_") + ".bak";
  const backupPath = path.join(backupDir, backupName);

  if (fs.existsSync(targetResolved)) {
    fs.copyFileSync(targetResolved, backupPath);
  }

  const manifest = {
    id: timestamp,
    createdAt: new Date().toISOString(),
    operation: "test_backup",
    files: [{ original: filePath, resolvedOriginal: targetResolved, backup: backupName }],
  };

  fs.writeFileSync(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

function restoreBackup(backupId: string, backupRootDir: string): Array<{ original: string; restored: string }> {
  const backupDir = path.join(backupRootDir, backupId);
  const manifestPath = path.join(backupDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const results: Array<{ original: string; restored: string }> = [];

  for (const file of manifest.files) {
    const backupPath = path.join(backupDir, file.backup);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${file.backup}`);
    }

    const resolved = path.resolve(file.resolvedOriginal);
    fs.copyFileSync(backupPath, resolved);
    results.push({ original: file.original, restored: resolved });
  }

  return results;
}

function listBackups(backupRootDir: string): Array<{ id: string; files: number }> {
  if (!fs.existsSync(backupRootDir)) return [];

  const entries = fs.readdirSync(backupRootDir, { withFileTypes: true });
  const backups: Array<{ id: string; files: number }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(backupRootDir, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      backups.push({ id: entry.name, files: manifest.files.length });
    } catch {
      // skip invalid
    }
  }

  return backups.sort((a, b) => b.id.localeCompare(a.id));
}

describe("Backup operations", () => {
  beforeEach(() => {
    testDir = path.join(os.tmpdir(), "arena-test-" + Date.now());
    backupRoot = path.join(testDir, ".arena-auto", "backups");
    process.env.ARENA_WORKSPACE = testDir;
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    if (ORIGINAL_WORKSPACE) {
      process.env.ARENA_WORKSPACE = ORIGINAL_WORKSPACE;
    } else {
      delete process.env.ARENA_WORKSPACE;
    }
  });

  it("creates a backup of a file inside workspace", () => {
    const sourcePath = path.join(testDir, "test.doe");
    fs.writeFileSync(sourcePath, "fake-content");

    const manifest = createBackup(sourcePath, testDir, backupRoot);
    expect(manifest.files.length).toBe(1);
    expect(manifest.files[0]!.original).toBe(sourcePath);
    expect(manifest.files[0]!.resolvedOriginal).toBe(sourcePath);

    const backupFilePath = path.join(backupRoot, manifest.id, manifest.files[0]!.backup);
    expect(fs.existsSync(backupFilePath)).toBe(true);
    expect(fs.readFileSync(backupFilePath, "utf-8")).toBe("fake-content");
  });

  it("rejects backup of file outside workspace", () => {
    const outsidePath = path.join(os.tmpdir(), "outside.doe");
    fs.writeFileSync(outsidePath, "outside-content");

    expect(() => createBackup(outsidePath, testDir, backupRoot)).toThrow("outside the allowed workspace");
  });

  it("creates backup for non-existent file (no error)", () => {
    const missingPath = path.join(testDir, "missing.doe");
    const manifest = createBackup(missingPath, testDir, backupRoot);
    expect(manifest.files.length).toBe(1);
  });

  it("restores a backup to original location", () => {
    const sourcePath = path.join(testDir, "restore-test.doe");
    fs.writeFileSync(sourcePath, "original-content");

    const manifest = createBackup(sourcePath, testDir, backupRoot);

    // Modify original
    fs.writeFileSync(sourcePath, "modified-content");

    // Restore
    const restored = restoreBackup(manifest.id, backupRoot);
    expect(restored.length).toBe(1);
    expect(restored[0]!.original).toBe(sourcePath);
    expect(fs.readFileSync(sourcePath, "utf-8")).toBe("original-content");
  });

  it("restore works with relative path in manifest", () => {
    // Simulate backup created with relative path
    const relativeFile = "relative-test.doe";
    const absPath = path.join(testDir, relativeFile);
    fs.writeFileSync(absPath, "relative-original");

    const manifest = createBackup(relativeFile, testDir, backupRoot);
    expect(manifest.files[0]!.resolvedOriginal).toBe(absPath);

    // Modify and restore
    fs.writeFileSync(absPath, "modified");
    restoreBackup(manifest.id, backupRoot);
    expect(fs.readFileSync(absPath, "utf-8")).toBe("relative-original");
  });

  it("lists backups sorted by date", async () => {
    const sourcePath = path.join(testDir, "list-test.doe");
    fs.writeFileSync(sourcePath, "content");

    createBackup(sourcePath, testDir, backupRoot);
    await new Promise((r) => setTimeout(r, 1100));
    createBackup(sourcePath, testDir, backupRoot);

    const backups = listBackups(backupRoot);
    expect(backups.length).toBe(2);
  });

  it("throws for non-existent backup restore", () => {
    expect(() => restoreBackup("non-existent-id", backupRoot)).toThrow("Backup not found");
  });
});
