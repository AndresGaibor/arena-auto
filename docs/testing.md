# Testing

## Test Framework

The project uses **Bun's built-in test runner** (`bun test`) which provides Jest-compatible APIs (`describe`, `it`, `expect`, `mock`, etc.).

## Running Tests

### Run all unit tests

```powershell
bun test
```

### Run a specific test file

```powershell
bun test tests/unit/validator.test.ts
```

### Run unit tests only (excludes integration)

```powershell
bun run test:unit
```

### Run integration tests

```powershell
bun run test:integration
```

### TypeScript type check

```powershell
bun run check
```

### Bridge syntax check

```powershell
bun run bridge:check
```

## Test File Organization

```
tests/
├── unit/                           # Unit tests (no Arena required)
│   ├── backup.test.ts              # Backup/restore functionality
│   ├── capability-catalog.test.ts  # Capability catalog types & logic
│   ├── compile-spec.test.ts        # Spec compilation to build plan
│   ├── diff.test.ts                # Diff generation
│   ├── distributions.test.ts       # Distribution validation & expressions
│   ├── doe-templates.test.ts       # .doe template listing & cloning
│   ├── expression.test.ts          # SIMAN expression parsing
│   ├── modules-compile.test.ts     # Module compiler unit tests
│   ├── normalizer.test.ts          # Spec normalization & ID sanitization
│   ├── repair.test.ts              # Auto-repair logic
│   ├── results-diagnosis.test.ts   # Diagnosis & bottleneck detection
│   ├── scenarios.test.ts           # Scenario patching & comparison
│   ├── siman.test.ts               # SIMAN client wrappers
│   ├── template-loader.test.ts     # Template loading & expansion
│   ├── units.test.ts               # Time unit conversion & validation
│   ├── validator-extended.test.ts  # Extended validation rules
│   └── workspace.test.ts           # Path validation & workspace logic
└── integration/                    # Integration tests (Arena COM required)
```

There are currently **17 unit test files** with **175+ passing tests**.

## How to Add New Tests

### 1. Choose the right location

- **Unit tests** (`tests/unit/`): for testing pure logic — validation, compilation, normalization, distribution handling, template loading, results diagnosis, scenarios, filesystem operations. These tests do NOT require Arena to be installed.
- **Integration tests** (`tests/integration/`): for testing COM interaction — model creation, module operations, simulation, results extraction. These require Windows with Arena installed.

### 2. Create a test file

Use the `*.test.ts` naming convention. Tests use Bun's built-in test API:

```typescript
import { describe, it, expect } from "bun:test";
import { validateSpec } from "../../src/arena-spec/validator.js";
import type { ArenaModelSpec } from "../../src/arena-spec/schema.js";

describe("validateSpec", () => {
  it("should reject empty spec name", () => {
    const result = validateSpec({ name: "", flow: [], connections: [] } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Model must have a name");
  });
});
```

### 3. Run just your new test

```powershell
bun test tests/unit/your-test.test.ts
```

### 4. Verify full suite

Before committing, ensure all existing tests still pass:

```powershell
bun test
bun run check
bun run bridge:check
```

## Testing Patterns

### Testing validation

```typescript
const spec: ArenaModelSpec = { name: "Test", flow: [...], connections: [...] };
const result = validateSpec(spec);
expect(result.valid).toBe(true);
```

### Testing compilation

```typescript
const plan = compileSpec(spec, "test.doe");
expect(plan.steps.length).toBeGreaterThan(0);
expect(plan.steps[0].type).toBe("createModule");
```

### Testing with mocks

The bridge client and filesystem modules can be mocked using Bun's mock function:

```typescript
const mockCallBridge = (method: string) => {
  if (method === "ping") return { ok: true };
  // ...
};
```

### Testing templates

```typescript
const spec = loadTemplate("mm1", {
  modelName: "Test",
  arrivalMean: 5,
  serviceMean: 4,
});
expect(spec.name).toBe("Test");
expect(spec.flow.length).toBe(3);
```

## CI Considerations

- **Unit tests**: run on any platform (Windows, macOS, Linux) — no Arena dependency
- **Integration tests**: Windows only, require Arena Simulation installed
- **Type checks**: run `bun run check` on all platforms
- **Bridge checks**: run `bun run bridge:check` on all platforms (Node.js syntax validation)
