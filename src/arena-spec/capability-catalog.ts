import type { TimeUnit } from "./schema.js";

export type CatalogModuleDef = {
  name: string;
  panelName: string;
  properties: string[];
};

export type CatalogPanel = {
  name: string;
  modules: CatalogModuleDef[];
};

export type CapabilityCatalog = {
  version: string;
  generatedAt: string;
  arenaVersion?: string;
  panels: CatalogPanel[];
};

export const PROPERTY_FALLBACKS: Record<string, string[]> = {
  // Create
  "Entity Type": ["EntityType", "Entity_Type"],
  "Entities per Arrival": ["EntitiesPerArrival", "BatchSize"],
  "Max Arrivals": ["MaxArrivals"],
  // Process
  "Delay Type": ["DelayType"],
  "Resource Name": ["ResourceName"],
  "Seize Delay Release": [],
  // Decide
  "2-way by Chance": [],
  "N-way by Chance": [],
  "N-way by Condition": [],
  "Percent True": ["PercentTrue"],
  "Percent1": ["Percent1"],
  "Percent2": ["Percent2"],
  "Condition1": ["Condition1"],
  "Condition2": ["Condition2"],
  // Assign
  "Assignment1": ["Assignment1"],
  "Assignment2": ["Assignment2"],
  // Record
  "Record Name": ["RecordName"],
  // Batch
  "Batch Size": ["BatchSize"],
  "Attribute Name": ["AttributeName"],
  // Separate
  "Duplicate": ["Duplicate"],
  // Common
  "Name": [],
  "Type": [],
  "Value": [],
  "Units": [],
  "Expression": [],
  "Action": [],
};

export function getKnownProperties(moduleType: string): string[] {
  const map: Record<string, string[]> = {
    Create: ["Name", "Entity Type", "Type", "Expression", "Units", "Entities per Arrival", "Max Arrivals"],
    Process: ["Name", "Type", "Action", "Delay Type", "Expression", "Units", "Resource Name"],
    Dispose: ["Name"],
    Decide: ["Name", "Type", "Percent True", "Percent1", "Percent2", "Condition1", "Condition2"],
    Assign: ["Name", "Assignment1", "Assignment2", "Assignment3", "Assignment4", "Assignment5"],
    Record: ["Name", "Type", "Expression", "Record Name"],
    Batch: ["Name", "Batch Size", "Type", "Attribute Name"],
    Separate: ["Name", "Duplicate"],
  };
  return map[moduleType] ?? ["Name"];
}

export function resolvePropertyName(moduleType: string, property: string, catalog?: CapabilityCatalog): string {
  if (catalog) {
    for (const panel of catalog.panels) {
      for (const mod of panel.modules) {
        if (mod.name === moduleType) {
          const exact = mod.properties.find((p) => p === property);
          if (exact) return exact;
          const fallback = mod.properties.find((p) =>
            p.replace(/[\s_]/g, "").toLowerCase() === property.replace(/[\s_]/g, "").toLowerCase()
          );
          if (fallback) return fallback;
        }
      }
    }
  }
  return property;
}
