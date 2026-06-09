import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.resolve(__dirname, "..", "..", ".arena-auto", "backups");

export type BackupManifest = {
  id: string;
  createdAt: string;
  operation: string;
  files: Array<{
    original: string;
    backup: string;
  }>;
};

function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_ROOT)) {
    fs.mkdirSync(BACKUP_ROOT, { recursive: true });
  }
}

export function createBackup(filePath: string, operation = "file_edit"): BackupManifest {
  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = path.join(BACKUP_ROOT, timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  const resolvedPath = path.resolve(filePath);
  const backupName = path.basename(resolvedPath).replace(/\./g, "_") + ".bak";
  const backupPath = path.join(backupDir, backupName);

  if (fs.existsSync(resolvedPath)) {
    fs.copyFileSync(resolvedPath, backupPath);
  }

  const manifest: BackupManifest = {
    id: timestamp,
    createdAt: new Date().toISOString(),
    operation,
    files: [{ original: filePath, backup: backupName }],
  };

  fs.writeFileSync(
    path.join(backupDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  return manifest;
}

export function listBackups(): Array<{ id: string; createdAt: string; operation: string; files: number }> {
  ensureBackupDir();

  const entries = fs.readdirSync(BACKUP_ROOT, { withFileTypes: true });
  const backups: Array<{ id: string; createdAt: string; operation: string; files: number }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(BACKUP_ROOT, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      backups.push({
        id: entry.name,
        createdAt: manifest.createdAt,
        operation: manifest.operation,
        files: manifest.files.length,
      });
    } catch {
      // skip invalid manifests
    }
  }

  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function restoreBackup(backupId: string): Array<{ original: string; restored: string }> {
  ensureBackupDir();

  const backupDir = path.join(BACKUP_ROOT, backupId);
  const manifestPath = path.join(backupDir, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup not found: ${backupId}`);
  }

  const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const results: Array<{ original: string; restored: string }> = [];

  for (const file of manifest.files) {
    const backupPath = path.join(backupDir, file.backup);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${file.backup}`);
    }

    const resolved = path.resolve(file.original);
    fs.copyFileSync(backupPath, resolved);
    results.push({ original: file.original, restored: resolved });
  }

  return results;
}
