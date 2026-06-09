import type { ArenaModelSpec } from "../arena-spec/schema.js";
import type { SpecPatch } from "./types.js";

function deepSet(obj: unknown, path: string, value: unknown): void {
  const keys = path.split(".");
  let current: any = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    const arrMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrMatch) {
      current = current?.[arrMatch[1]!]?.[parseInt(arrMatch[2]!)];
    } else {
      current = current?.[key];
    }
    if (current === undefined) throw new Error(`Cannot navigate path "${path}": "${key}" not found`);
  }
  const lastKey = keys[keys.length - 1]!;
  const lastArrMatch = lastKey.match(/^(\w+)\[(\d+)\]$/);
  if (lastArrMatch) {
    const arr = current?.[lastArrMatch[1]!];
    if (!Array.isArray(arr)) throw new Error(`Cannot navigate path "${path}": "${lastArrMatch[1]}" is not an array`);
    arr[parseInt(lastArrMatch[2]!)] = value;
  } else {
    current[lastKey] = value;
  }
}

export function cloneSpec(spec: ArenaModelSpec): ArenaModelSpec {
  return JSON.parse(JSON.stringify(spec));
}

export function applyPatches(spec: ArenaModelSpec, patches: SpecPatch[]): ArenaModelSpec {
  const cloned = cloneSpec(spec);
  for (const patch of patches) {
    deepSet(cloned, patch.path, patch.value);
  }
  return cloned;
}

export function patchDescription(patches: SpecPatch[]): string {
  return patches.map((p) => `${p.path} = ${JSON.stringify(p.value)}`).join(", ");
}
