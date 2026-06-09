import fs from "fs";
import { isPathInWorkspace } from "./workspace.js";
import { isBinaryExtension, isFileTooLarge, fileExists, detectEncoding, getFileSize } from "./guards.js";

export type FileReadResult = {
  path: string;
  size: number;
  encoding: string;
  content: string;
  truncated: boolean;
};

export function readFileSafe(inputPath: string, maxBytes = 20_000): FileReadResult {
  const check = isPathInWorkspace(inputPath);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const resolved = check.resolved;

  if (!fileExists(resolved)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  if (isBinaryExtension(resolved)) {
    throw new Error(`Cannot read binary file: ${inputPath}`);
  }

  if (isFileTooLarge(resolved)) {
    throw new Error(`File too large: ${inputPath}`);
  }

  const size = getFileSize(resolved);
  const encoding = detectEncoding(resolved);

  if (encoding === "binary") {
    throw new Error(`File appears to be binary: ${inputPath}`);
  }

  let content: string;
  let truncated = false;

  if (size > maxBytes) {
    const buf = fs.readFileSync(resolved, "utf-8");
    content = buf.slice(0, maxBytes);
    truncated = true;
  } else {
    content = fs.readFileSync(resolved, "utf-8");
  }

  return { path: inputPath, size, encoding, content, truncated };
}
