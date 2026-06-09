# Bridge Protocol

## Overview

The bridge is a Node.js child process (CommonJS) that communicates with the TypeScript MCP server via stdin/stdout using a JSON-RPC-like message format. It serves as the intermediary between the MCP server and Arena's COM API (via the `winax` library).

## Message Format

### Request (from MCP server to bridge)

```json
{ "id": 1, "method": "openArena", "params": { "visible": true } }
```

- `id`: integer, request identifier used for response correlation
- `method`: string, handler name (see Available Methods below)
- `params`: object, method-specific parameters (may be omitted)

### Response (from bridge to MCP server)

```json
{ "id": 1, "result": { "ok": true, "message": "Arena opened" } }
```

### Error Response

```json
{ "id": 1, "error": "COM error: Could not create ActiveX object" }
```

### Ping (keepalive / health check)

Request:
```json
{ "id": 0, "method": "ping" }
```

Response:
```json
{ "id": 0, "result": { "ok": true, "message": "pong", "arenaOpen": true, "modelOpen": false } }
```

## Available Methods

All 19 registered handlers in `bridge/index.cjs`:

### Arena Lifecycle

| Method | Params | Description |
|--------|--------|-------------|
| `openArena` | `{ visible?: boolean }` | Opens Arena via COM `ActiveXObject("Arena.Application")`. Sets Visible property. |
| `closeArena` | `{}` | Closes the model (if open), quits Arena, clears internal references. |

### Model Management

| Method | Params | Description |
|--------|--------|-------------|
| `openModel` | `{ path: string }` | Opens a .doe model file from disk. |
| `closeModel` | `{}` | Closes the currently open model via `Model.End()`. |
| `createNewModel` | `{}` | Creates a new empty Arena model. |
| `saveModel` | `{ path: string }` | Saves the current model to a .doe file path. |
| `getModelInfo` | `{}` | Returns model name, simulation run time, and status. |
| `exploreCom` | `{}` | Traverses the Arena COM object model for discovery. |
| `generateCapabilityCatalog` | `{}` | Probes all panels, module definitions, and properties to build a capability catalog JSON. |

### Module Operations

| Method | Params | Description |
|--------|--------|-------------|
| `createModule` | `{ panelName: string, moduleName: string, x: number, y: number }` | Creates a module on the specified panel at the given coordinates. Returns the assigned caption (e.g., "Create 1"). |
| `getModuleProperty` | `{ caption: string, property: string }` | Reads a module property/operand value by caption. |
| `setModuleProperty` | `{ caption: string, property: string, value: string }` | Sets a module property via `Data(operandName, value)`. |
| `listModuleProperties` | `{ caption: string }` | Lists all readable properties for a given module. |
| `addConnection` | `{ fromCaption: string, toCaption: string }` | Connects two modules by their captions. |
| `listModules` | `{}` | Lists all modules in the current model with their types and captions. |

### Simulation

| Method | Params | Description |
|--------|--------|-------------|
| `runModel` | `{ batchMode?: boolean, quietMode?: boolean }` | Runs the simulation. Batch mode suppresses UI; quiet mode suppresses dialogs. |
| `setReplicationLength` | `{ length: number }` | Sets the replication length for the simulation. |

### Data Elements

| Method | Params | Description |
|--------|--------|-------------|
| `createResource` | `{ name: string, capacity: number, ... }` | Creates a resource element in the model's data. |
| `createEntity` | `{ name: string, ... }` | Creates an entity type in the model's data. |
| `createQueue` | `{ name: string, discipline?: string, ... }` | Creates a queue element. |
| `createSchedule` | `{ name: string, type: string, timeUnits: string, durations: array }` | Creates a capacity or arrival schedule. |
| `createSet` | `{ name: string, type: string, members: string[] }` | Creates a resource or queue set. |
| `createFailure` | `{ name: string, type: string, ... }` | Creates a failure definition for resources. |

### Results & Variables

| Method | Params | Description |
|--------|--------|-------------|
| `getModelResults` | `{}` | Returns summary results (model name, simulation time, status). |
| `exportResults` | `{ format?: string }` | Exports simulation report in specified format (txt, csv, xls). |
| `getVariable` | `{ name: string }` | Reads a SIMAN variable value. |
| `setVariable` | `{ name: string, value: number }` | Sets a SIMAN variable value. |
| `listVariables` | `{}` | Lists all SIMAN variables in the model. |
| `getQueueLength` | `{ queueName: string }` | Gets the current queue length for a named queue. |
| `getResourceState` | `{ resourceName: string }` | Gets the current state of a resource (idle, busy, etc.). |
| `extractResults` | `{}` | Extracts structured entity, queue, resource, and variable statistics via SIMAN. |
| `extractResultsViaReport` | `{ format: string }` | Extracts results by parsing the Arena CSV report as fallback. |

### SIMAN / VBA

| Method | Params | Description |
|--------|--------|-------------|
| `getSimanSource` | `{}` | Gets the SIMAN source code of the current model as text. |
| `getSimanBlocks` | `{}` | Lists all SIMAN blocks with their labels and types. |
| `getVbaMacros` | `{}` | Lists available VBA macros in the current model. |
| `runVbaMacro` | `{ macroName: string }` | Executes a VBA macro by name. |
| `getSimanElement` | `{ element: string }` | Gets a specific SIMAN element value. |

### Ping

| Method | Params | Description |
|--------|--------|-------------|
| `ping` | `{}` | Health check. Returns `{ ok, message, arenaOpen, modelOpen }`. |

## Transport Details

- **Communication**: stdin/stdout (piped by the TypeScript parent process)
- **Encoding**: UTF-8, newline-delimited JSON (NDJSON)
- **Request lifecycle**: MCP server spawns bridge as a child process once. Each request is serialized through a queue to ensure one-at-a-time execution (COM is single-threaded).
- **Timeout**: configurable per operation (ranges from 10s for simple ops to 5min for simulation runs)
- **Error codes** (defined in `src/bridge/errors.ts`):
  - `ARENA_NOT_INSTALLED` — Arena.Application COM class not available
  - `ARENA_NOT_OPEN` — Arena not opened before model operation
  - `MODEL_NOT_OPEN` — Model not opened before module operation
  - `MODEL_NOT_FOUND` — .doe file not found
  - `MODULE_NOT_FOUND` — Module caption not found in model
  - `PROPERTY_NOT_FOUND` — Property/operand not found on module
  - `COM_ERROR` — General COM interaction error
  - `TIMEOUT` — Operation exceeded timeout
  - `INVALID_PATH` — File path is invalid or outside workspace
  - `INVALID_PARAMS` — Invalid parameters for handler
  - `BRIDGE_DIED` — Bridge process crashed or disconnected

## Example Conversation

**Request** (create a Create module):
```json
{"id":1,"method":"createModule","params":{"panelName":"DiscreteProcessing","moduleName":"Create","x":100,"y":200}}
```

**Response**:
```json
{"id":1,"result":{"ok":true,"caption":"Create 1"}}
```

**Request** (set its name property):
```json
{"id":2,"method":"setModuleProperty","params":{"caption":"Create 1","property":"Name","value":"Arrival"}}
```

**Response**:
```json
{"id":2,"result":{"ok":true,"captionAfter":"Arrival"}}
```

**Request** (invalid method):
```json
{"id":3,"method":"nonexistent", "params":{}}
```

**Response**:
```json
{"id":3,"error":"Unknown method: nonexistent"}
```

## Lifecycle

1. MCP server imports `bridge/client.ts` which lazily spawns the bridge on first `callBridge()`
2. Bridge initializes, responds to `ping` to confirm readiness
3. Subsequent calls are serialized through a mutex-like queue
4. On `arena_close`, `destroyBridge()` ends the bridge's stdin, triggering graceful shutdown
5. If bridge child process exits unexpectedly, all pending requests are rejected with `BRIDGE_DIED`
