import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "../filesystem/workspace.js";
import { isPathInWorkspace } from "../filesystem/workspace.js";

const DOE_TEMPLATES_ROOT = path.resolve(process.cwd(), "doe-templates");

export type DoeTemplateMeta = {
  id: string;
  name: string;
  description: string;
  filePath: string;
  fileSize: number;
};

export function listDoeTemplates(): { templates: DoeTemplateMeta[] } {
  if (!fs.existsSync(DOE_TEMPLATES_ROOT)) return { templates: [] };
  const entries = fs.readdirSync(DOE_TEMPLATES_ROOT);
  const templates: DoeTemplateMeta[] = [];
  for (const entry of entries) {
    if (entry.endsWith(".doe")) {
      const filePath = path.join(DOE_TEMPLATES_ROOT, entry);
      const stat = fs.statSync(filePath);
      templates.push({
        id: path.basename(entry, ".doe"),
        name: path.basename(entry, ".doe"),
        description: `Pre-built .doe template: ${entry}`,
        filePath,
        fileSize: stat.size,
      });
    }
  }
  return { templates };
}

export function cloneDoeTemplate(templateId: string, saveAs: string): { ok: boolean; path: string; message: string } {
  const catalog = listDoeTemplates();
  const template = catalog.templates.find(t => t.id === templateId);
  if (!template) throw new Error(`Doe template not found: "${templateId}"`);

  const check = isPathInWorkspace(saveAs);
  if (!check.ok) throw new Error(check.reason);

  fs.copyFileSync(template.filePath, check.resolved!);

  return {
    ok: true,
    path: check.resolved!,
    message: `Template "${templateId}" cloned to ${check.resolved}`,
  };
}
