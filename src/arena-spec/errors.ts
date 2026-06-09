export class SpecError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly path: string[] = [],
  ) {
    super(message);
    this.name = "SpecError";
  }
}

export class ValidationError extends SpecError {
  constructor(
    message: string,
    public readonly severity: "error" | "warning" = "error",
    path: string[] = [],
    code?: string,
  ) {
    super(message, code ?? "VALIDATION_ERROR", path);
    this.name = "ValidationError";
  }
}

export class NormalizationError extends SpecError {
  constructor(message: string, path: string[] = []) {
    super(message, "NORMALIZATION_ERROR", path);
    this.name = "NormalizationError";
  }
}

export class ReferenceError extends ValidationError {
  constructor(
    public readonly refType: string,
    public readonly refName: string,
    path: string[] = [],
  ) {
    super(
      `Reference to non-existent ${refType}: "${refName}"`,
      "error",
      path,
      "REFERENCE_ERROR",
    );
    this.name = "ReferenceError";
  }
}

export class DuplicateIdError extends ValidationError {
  constructor(
    public readonly id: string,
    public readonly container: string,
  ) {
    super(
      `Duplicate ${container} ID: "${id}"`,
      "error",
      [container],
      "DUPLICATE_ID",
    );
    this.name = "DuplicateIdError";
  }
}

export class DistributionError extends ValidationError {
  constructor(
    public readonly distributionType: string,
    message: string,
  ) {
    super(message, "error", [], "DISTRIBUTION_ERROR");
    this.name = "DistributionError";
  }
}

export function formatErrors(errors: ValidationError[]): string {
  return errors
    .map((e) => {
      const prefix = e.severity === "warning" ? "warning" : "error";
      const pathStr = e.path.length > 0 ? ` [${e.path.join(".")}]` : "";
      return `  ${prefix}${pathStr}: ${e.message}`;
    })
    .join("\n");
}
