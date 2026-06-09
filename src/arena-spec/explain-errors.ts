import type { ValidationResult } from "./validator.js";

export type ErrorExplanation = {
  error: string;
  explanation: string;
  severity: "error" | "warning";
  suggestion: string;
};

function explainError(msg: string, severity: "error" | "warning"): ErrorExplanation {
  const lower = msg.toLowerCase();

  if (lower.includes("duplicate")) {
    return {
      error: msg,
      explanation: "Two or more items share the same identifier, causing ambiguity in Arena.",
      severity,
      suggestion: "Rename duplicate items with unique identifiers, or use arena_repair_spec to auto-fix.",
    };
  }

  if (lower.includes("non-existent") || lower.includes("not found") || lower.includes("references")) {
    return {
      error: msg,
      explanation: "A module or definition references another item that does not exist in the specification.",
      severity,
      suggestion: "Ensure the referenced item is defined (entities, resources, etc.) before it is used.",
    };
  }

  if (lower.includes("must have a name")) {
    return {
      error: msg,
      explanation: "The model specification requires a name field for identification.",
      severity,
      suggestion: 'Add a "name" field to the specification, e.g. "name": "MyModel".',
    };
  }

  if (lower.includes("must have at least one create")) {
    return {
      error: msg,
      explanation: "A simulation model needs at least one Create module to generate entities.",
      severity,
      suggestion: "Add a Create module to the flow array with an entity type and arrival distribution.",
    };
  }

  if (lower.includes("must have at least one dispose")) {
    return {
      error: msg,
      explanation: "Entities must be disposed at the end of their flow; otherwise they accumulate.",
      severity,
      suggestion: "Add a Dispose module at the end of each flow path, or use arena_repair_spec to auto-fix.",
    };
  }

  if (lower.includes("timeunits") || lower.includes("basetimeunits")) {
    return {
      error: msg,
      explanation: "The time unit specified is not one of the supported values.",
      severity,
      suggestion: 'Use one of: "Hours", "Minutes", or "Seconds".',
    };
  }

  if (lower.includes("distribution")) {
    return {
      error: msg,
      explanation: "A distribution parameter is invalid (negative mean, min >= max, out-of-order params, etc.).",
      severity,
      suggestion: "Check the distribution parameter constraints and fix the values.",
    };
  }

  if (lower.includes("connection")) {
    return {
      error: msg,
      explanation: "A connection references a module ID that does not exist in the flow.",
      severity,
      suggestion: "Check that all module IDs in connections match IDs in the flow array.",
    };
  }

  if (lower.includes("warmupperiod")) {
    return {
      error: msg,
      explanation: "The warmup period must be a non-negative number.",
      severity,
      suggestion: "Set warmupPeriod to a value >= 0, or omit it to use the default.",
    };
  }

  if (lower.includes("batchsize")) {
    return {
      error: msg,
      explanation: "A Batch module requires at least 2 entities to form a batch.",
      severity,
      suggestion: "Set batchSize to at least 2.",
    };
  }

  if (lower.includes("replications") || lower.includes("replicationlength")) {
    return {
      error: msg,
      explanation: "Replications and replication length must be positive numbers.",
      severity,
      suggestion: "Set replications and replicationLength to values >= 1.",
    };
  }

  if (lower.includes("schedule")) {
    return {
      error: msg,
      explanation: "A schedule definition is incomplete or has invalid duration data.",
      severity,
      suggestion: "Ensure each schedule has at least one duration with length > 0.",
    };
  }

  if (lower.includes("probability") || lower.includes("sum")) {
    return {
      error: msg,
      explanation: "The probability branches in a Decide module should sum to exactly 1.0.",
      severity,
      suggestion: "Adjust probability values so they sum to 1.0, or use arena_repair_spec to auto-normalize.",
    };
  }

  return {
    error: msg,
    explanation: "The specification contains an error that prevents it from being built.",
    severity,
    suggestion: "Review the specification and fix the reported issue.",
  };
}

export function explainSpecErrors(validation: ValidationResult): ErrorExplanation[] {
  const result: ErrorExplanation[] = [];

  for (const error of validation.errors) {
    result.push(explainError(error, "error"));
  }

  for (const warning of validation.warnings) {
    result.push(explainError(warning, "warning"));
  }

  return result;
}
