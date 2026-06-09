import fs from "fs";
import path from "path";
import type { ArenaModelSpec } from "../arena-spec/schema.js";

const TEMPLATES_ROOT = path.resolve(process.cwd(), "templates");

export type TemplateParamDef = {
  default: string | number;
  description: string;
};

export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  category: string;
  filePath: string;
  params: Record<string, TemplateParamDef>;
};

export type TemplateCatalog = {
  templates: TemplateMeta[];
};

const PARAM_RE = /\{\{(\w+)\}\}/g;

function extractParamsFromText(raw: string): Record<string, TemplateParamDef> {
  const idx = raw.indexOf('"_params"');
  if (idx === -1) return {};

  // Find the matching closing brace for the _params value
  const braceStart = raw.indexOf("{", idx + 8);
  if (braceStart === -1) return {};

  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  const paramsJson = raw.slice(braceStart, end);
  try {
    const parsed = JSON.parse(paramsJson) as Record<string, { default: string | number; description: string }>;
    const params: Record<string, TemplateParamDef> = {};
    for (const [key, val] of Object.entries(parsed)) {
      params[key] = { default: val.default, description: val.description ?? "" };
    }
    return params;
  } catch {
    return {};
  }
}

export function expandTemplate(raw: string, params: Record<string, string | number>): string {
  return raw.replace(PARAM_RE, (_, key: string) => {
    if (params[key] !== undefined) return String(params[key]);
    return `{{${key}}}`;
  });
}

export function listTemplates(): TemplateCatalog {
  const templates: TemplateMeta[] = [];

  function walk(dir: string, category: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), entry.name);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        const filePath = path.join(dir, entry.name);
        try {
          const raw = fs.readFileSync(filePath, "utf-8");
          const params = extractParamsFromText(raw);
          const id = path.basename(entry.name, ".json");
          const nameMatch = raw.match(/"name"\s*:\s*"([^"]+)"/);
          const descMatch = raw.match(/"description"\s*:\s*"([^"]+)"/);
          templates.push({
            id,
            name: nameMatch?.[1] ?? id,
            description: descMatch?.[1] ?? "",
            category,
            filePath,
            params,
          });
        } catch {
          // skip invalid template files
        }
      }
    }
  }

  walk(TEMPLATES_ROOT, "");
  return { templates };
}

export function loadTemplate(templateId: string, overrides?: Record<string, string | number>): ArenaModelSpec {
  const catalog = listTemplates();
  const meta = catalog.templates.find((t) => t.id === templateId);
  if (!meta) throw new Error(`Template not found: "${templateId}". Use listTemplates() to see available templates.`);

  const raw = fs.readFileSync(meta.filePath, "utf-8");

  const effective: Record<string, string | number> = {};
  for (const [key, def] of Object.entries(meta.params)) {
    effective[key] = overrides?.[key] ?? def.default;
  }

  const expanded = expandTemplate(raw, effective);
  const spec = JSON.parse(expanded) as ArenaModelSpec;
  delete (spec as any)._params;
  return spec;
}
