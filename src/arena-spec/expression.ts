import { DISTRIBUTION_REGISTRY } from "./distributions.js";
import type { Distribution } from "./schema.js";

export type ArenaExpression = {
  raw: string;
  parsed: "number" | "distribution" | "variable" | "attribute" | "expression";
  value?: number;
  distribution?: Distribution;
  variableName?: string;
  attributeName?: string;
};

const DIST_RE = /^([A-Z]+)\(([^)]+)\)$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;
const VAR_RE = /^[A-Za-z_]\w*$/;

export function parseExpression(expr: string): ArenaExpression {
  const trimmed = expr.trim();

  // Try number
  if (NUM_RE.test(trimmed)) {
    return { raw: trimmed, parsed: "number", value: parseFloat(trimmed) };
  }

  // Try variable/attribute name
  if (VAR_RE.test(trimmed)) {
    return { raw: trimmed, parsed: "variable", variableName: trimmed };
  }

  // Try distribution
  const match = trimmed.match(DIST_RE);
  if (match) {
    const typeName = match[1]!;
    const paramsStr = match[2]!;
    const meta = DISTRIBUTION_REGISTRY[typeName];
    if (meta) {
      const params = paramsStr.split(",").map((s) => parseFloat(s.trim()));
      if (params.length === meta.paramCount && params.every((p) => !isNaN(p))) {
        const distribution = { type: typeName as Distribution["type"], params } as Distribution;
        return { raw: trimmed, parsed: "distribution", distribution };
      }
    }
  }

  return { raw: trimmed, parsed: "expression" };
}

export function isNumeric(expr: string): boolean {
  return NUM_RE.test(expr.trim());
}

export function isVariableRef(expr: string): boolean {
  return VAR_RE.test(expr.trim());
}

export function extractVariables(expr: string): string[] {
  const vars: string[] = [];
  const words = expr.split(/[\s()+\-*/<>=,]+/);
  for (const w of words) {
    if (VAR_RE.test(w) && !NUM_RE.test(w)) {
      vars.push(w);
    }
  }
  return [...new Set(vars)];
}
