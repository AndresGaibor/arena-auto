import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "path";
import os from "os";
import fs from "fs";

// Backup original env
const ORIGINAL_WORKSPACE = process.env.ARENA_WORKSPACE;

function getWorkspaceRoot(): string {
  return process.env.ARENA_WORKSPACE || path.join(os.homedir(), "Documents", "arena-workspace");
}

function isPathInWorkspace(targetPath: string): { ok: true; resolved: string } | { ok: false; reason: string } {
  const workspace = getWorkspaceRoot();
  const workspaceResolved = path.resolve(workspace);
  const targetResolved = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.join(workspaceResolved, targetPath);

  const relative = path.relative(workspaceResolved, targetResolved);
  const inside = relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));

  if (inside) {
    return { ok: true, resolved: targetResolved };
  }

  return {
    ok: false,
    reason: `Path "${targetPath}" is outside the allowed workspace. Allowed: ${workspaceResolved}`,
  };
}

describe("isPathInWorkspace", () => {
  const testDir = path.join(os.tmpdir(), "arena-workspace-test");

  beforeEach(() => {
    process.env.ARENA_WORKSPACE = testDir;
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
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

  it("accepts absolute path inside workspace", () => {
    const insidePath = path.join(testDir, "model.doe");
    const result = isPathInWorkspace(insidePath);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolved).toBe(insidePath);
    }
  });

  it("accepts relative path (resolves to workspace)", () => {
    const result = isPathInWorkspace("model.doe");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolved).toBe(path.join(testDir, "model.doe"));
    }
  });

  it("accepts workspace root itself", () => {
    const result = isPathInWorkspace(testDir);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolved).toBe(testDir);
    }
  });

  it("accepts nested path inside workspace", () => {
    const nested = path.join(testDir, "subdir", "deep", "model.doe");
    const result = isPathInWorkspace(nested);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolved).toBe(nested);
    }
  });

  it("rejects absolute path outside workspace", () => {
    const outside = path.join(os.tmpdir(), "some-other-dir", "model.doe");
    const result = isPathInWorkspace(outside);
    expect(result.ok).toBe(false);
  });

  it("rejects path with parent traversal", () => {
    const result = isPathInWorkspace("../outside.doe");
    expect(result.ok).toBe(false);
  });

  it("rejects double parent traversal", () => {
    const result = isPathInWorkspace("../../outside.doe");
    expect(result.ok).toBe(false);
  });

  it("rejects deeply nested parent traversal", () => {
    const result = isPathInWorkspace("subdir/../../../outside.doe");
    expect(result.ok).toBe(false);
  });

  it("handles Windows-style paths (backslashes)", () => {
    const insidePath = path.join(testDir, "model.doe").replace(/\//g, "\\");
    const result = isPathInWorkspace(insidePath);
    expect(result.ok).toBe(true);
  });
});
