import { isPathInWorkspace } from "./workspace.js";
import { readFileSafe } from "./reader.js";

export type DiffLine = {
  type: "added" | "removed" | "unchanged";
  lineA: number;
  lineB: number;
  content: string;
};

export type DiffResult = {
  path: string;
  hunks: Array<{ startA: number; startB: number; lines: DiffLine[] }>;
  summary: { added: number; removed: number; unchanged: number };
};

function simpleDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) {
      result.push({ type: "added", lineA: -1, lineB: i + 1, content: newLines[i]! });
      added++;
    } else if (i >= newLines.length) {
      result.push({ type: "removed", lineA: i + 1, lineB: -1, content: oldLines[i]! });
      removed++;
    } else if (oldLines[i] !== newLines[i]) {
      result.push({ type: "removed", lineA: i + 1, lineB: -1, content: oldLines[i]! });
      result.push({ type: "added", lineA: -1, lineB: i + 1, content: newLines[i]! });
      removed++;
      added++;
    } else {
      result.push({ type: "unchanged", lineA: i + 1, lineB: i + 1, content: oldLines[i]! });
      unchanged++;
    }
  }

  return result;
}

export function generateDiff(originalPath: string, newContent: string): DiffResult {
  const check = isPathInWorkspace(originalPath);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const original = readFileSafe(originalPath);
  const oldLines = original.content.split("\n");
  const newLines = newContent.split("\n");
  const lines = simpleDiff(oldLines, newLines);

  const summary = { added: 0, removed: 0, unchanged: 0 };
  for (const line of lines) {
    if (line.type === "added") summary.added++;
    else if (line.type === "removed") summary.removed++;
    else summary.unchanged++;
  }

  const hunks = [{
    startA: 1,
    startB: 1,
    lines,
  }];

  return {
    path: originalPath,
    hunks,
    summary,
  };
}

export function formatDiff(diff: DiffResult): string {
  const lines: string[] = [];
  lines.push(`--- ${diff.path}`);
  lines.push(`+++ ${diff.path}`);
  lines.push(`@@ ${diff.summary.added} additions, ${diff.summary.removed} deletions @@`);

  for (const hunk of diff.hunks) {
    for (const line of hunk.lines) {
      switch (line.type) {
        case "added":
          lines.push(`+ ${line.content}`);
          break;
        case "removed":
          lines.push(`- ${line.content}`);
          break;
        case "unchanged":
          lines.push(`  ${line.content}`);
          break;
      }
    }
  }
  return lines.join("\n");
}
