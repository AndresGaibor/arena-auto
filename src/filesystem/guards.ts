import fs from "fs";
import path from "path";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const BINARY_EXTENSIONS = new Set([
  ".exe", ".dll", ".so", ".dylib", ".bin", ".obj", ".o", ".lib",
  ".zip", ".tar", ".gz", ".7z", ".rar",
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".ico", ".webp",
  ".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".doe", // Arena model files - should not be edited as text
]);

const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".json", ".xml", ".yaml", ".yml", ".toml", ".ini", ".cfg",
  ".ts", ".js", ".cjs", ".mjs", ".tsx", ".jsx",
  ".css", ".scss", ".less", ".html", ".htm",
  ".py", ".rb", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".go", ".rs",
  ".sh", ".bat", ".ps1", ".fish",
  ".env", ".gitignore", ".gitattributes",
  ".csv", ".tsv",
]);

export function isBinaryExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export function isTextExtension(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export function isFileTooLarge(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    return stat.size > MAX_FILE_BYTES;
  } catch {
    return false;
  }
}

export function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return -1;
  }
}

export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function detectEncoding(filePath: string): string {
  try {
    const buf = fs.readFileSync(filePath);
    // Check for BOM
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) return "utf-8-bom";
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) return "utf-16le";
    if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) return "utf-16be";
    // Check for null bytes -> binary
    for (let i = 0; i < Math.min(buf.length, 8192); i++) {
      if (buf[i] === 0) return "binary";
    }
    return "utf-8";
  } catch {
    return "unknown";
  }
}
