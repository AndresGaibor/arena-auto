# ArenaModelSpec Reference

## Overview

ArenaModelSpec is a structured JSON format that describes a complete Arena simulation model. It is the core input format for the `arena_build_model` and `arena_validate_spec` tools.

## Top-Level Fields

```typescript
{
  name: string;                // Required. Model name (also used as .doe filename)
  description?: string;        // Optional model description
  timeUnits?: "Hours" | "Minutes" | "Seconds";  // Default: "Minutes"
  baseTimeUnits?: "Hours" | "Minutes" | "Seconds";
  replications?: number;       // Number of replications (default: 1)
  replicationLength?: number;  // Length per replication in timeUnits
  warmupPeriod?: number;       // Warmup period (>= 0)
  entities?: EntityDef[];
  resources?: ResourceDef[];
  queues?: QueueDef[];
  variables?: VariableDef[];
  attributes?: AttributeDef[];
  schedules?: ScheduleDef[];
  sets?: SetDef[];
  statistics?: StatisticDef[];
  stations?: StationDef[];
  transporters?: TransporterDef[];
  conveyors?: ConveyorDef[];
  distances?: DistanceDef[];
  flow: FlowModule[];          // Required. At least 1 create + 1 dispose
  connections: [string, string][];  // Required. Module ID pairs
}
```

## Complete Example (M/M/1 Queue)

```json
{
  "name": "MM1_Queue",
  "timeUnits": "Minutes",
  "replications": 5,
  "replicationLength": 480,
  "entities": [{ "id": "customer", "name": "Customer" }],
  "resources": [{ "id": "server", "name": "Server", "capacity": 1 }],
  "flow": [
    {
      "id": "Arrival",
      "type": "create",
      "entity": "customer",
      "arrival": {
        "distribution": { "type": "EXPO", "params": [5] }
      }
    },
    {
      "id": "Service",
      "type": "process",
      "resource": "server",
      "delay": {
        "distribution": { "type": "EXPO", "params": [4] },
        "units": "Minutes"
      }
    },
    {
      "id": "Exit",
      "type": "dispose"
    }
  ],
  "connections": [
    ["Arrival", "Service"],
    ["Service", "Exit"]
  ]
}
```

## Data Definitions

### Distribution

Supported types with their Arena names and parameter counts:

| Type | Arena Name | Params | Parameters |
|------|-----------|--------|-----------|
| EXPO | EXPO | 1 | mean |
| UNIF | UNIF | 2 | min, max |
| NORM | NORM | 2 | mean, stdDev |
| TRIA | TRIA | 3 | min, mode, max |
| ERLA | ERLA | 2 | mean, k (integer >= 1) |
| WEIB | WEIB | 2 | beta, alpha |
| GAMM | GAMM | 2 | beta, alpha |
| BETA | BETA | 2 | alpha, beta |
| POIS | POIS | 1 | mean |
| NEgexp | NEGEXP | 1 | mean |
| LOGN | LOGN | 2 | logMean, logStdDev |
| constant | (literal) | 1 | value |

Arena expression format: `EXPO(5)`, `NORM(10, 2)`, `TRIA(1, 3, 5)`, etc.

### EntityDef

```json
{ "id": "customer", "name": "Customer", "picture": "Picture.Blue", "initialCost": 0, "addCost": 0, "holdingCost": 0 }
```

### ResourceDef

```json
{ "id": "server", "name": "Server", "capacity": 1, "schedule": "shift1", "failures": [...], "costs": {...} }
```

- `capacity`: number of identical units
- `schedule`: optional reference to a ScheduleDef id for timed capacity changes
- `failures`: optional array of failure definitions (type, count/time based)
- `costs`: optional cost structure (perHour, perUse, perUnit, initial)

### QueueDef

```json
{ "id": "line", "name": "Line", "discipline": "FIFO" }
```

- `discipline`: `"FIFO"`, `"LIFO"`, `"LowestAttribute"`, `"HighestAttribute"`

### VariableDef

```json
{ "id": "totalCost", "name": "TotalCost", "type": "number", "initialValue": 0 }
```

### AttributeDef

```json
{ "id": "priority", "name": "Priority", "type": "number", "initialValue": 1 }
```

### ScheduleDef

```json
{
  "id": "shift1",
  "name": "DayShift",
  "type": "capacity",
  "timeUnits": "Hours",
  "durations": [
    { "value": 2, "length": 8 },
    { "value": 0, "length": 1 }
  ]
}
```

- `type`: `"capacity"` (resource capacity) or `"arrival"` (arrival rate)
- `durations`: array of { value, length } pairs specifying schedule pattern
- Durations cycle; the schedule repeats after all durations complete

### SetDef

```json
{ "id": "operators", "name": "Operators", "type": "resource", "members": ["alice", "bob", "carol"] }
```

- `type`: `"resource"` or `"queue"`
- `members`: array of ID references to resources or queues

### StationDef

```json
{ "id": "workstation", "name": "Workstation1", "x": 100, "y": 200 }
```

### TransporterDef

```json
{ "id": "forklift", "name": "Forklift", "capacity": 1, "speed": 50, "units": "Minutes" }
```

### ConveyorDef

```json
{ "id": "belt1", "name": "Conveyor1", "capacity": 10, "length": 100, "speed": 10, "type": "accumulating", "units": "Minutes" }
```

- `type`: `"fixed"` or `"accumulating"`

### DistanceDef

```json
{ "from": "Station1", "to": "Station2", "distance": 50 }
```

### StatisticDef

```json
{ "id": "waitStat", "type": "tally", "expression": "WAIT", "name": "WaitTime" }
```

- `type`: `"time_persistent"`, `"tally"`, `"counter"`, `"output"`

## Flow Modules

### Create

Entry point for entities entering the model.

```json
{
  "id": "Arrival",
  "type": "create",
  "entity": "customer",
  "arrival": {
    "distribution": { "type": "EXPO", "params": [5] },
    "entitiesPerArrival": 1,
    "maxArrivals": 1000
  }
}
```

### Process

Seizes a resource, delays, then releases.

```json
{
  "id": "Service",
  "type": "process",
  "resource": "server",
  "delay": {
    "distribution": { "type": "NORM", "params": [10, 2] },
    "units": "Minutes"
  }
}
```

### Dispose

Removes entities from the model.

```json
{
  "id": "Exit",
  "type": "dispose"
}
```

### Decide

Routes entities based on probability or expression conditions.

```json
{
  "id": "Inspection",
  "type": "decide",
  "branches": [
    { "type": "probability", "value": 0.95 },
    { "type": "expression", "expression": "NQ(QueueName) < 5" }
  ],
  "elseLabel": "Reject"
}
```

- `branches`: array of conditions (probability or expression)
- `elseLabel`: target module id for default (no-match) branch
- Connections must match branches in order: first branch -> first connection, etc.

### Assign

Sets variable or attribute values.

```json
{
  "id": "SetPriority",
  "type": "assign",
  "assignments": [
    { "variable": "priority", "value": "2" },
    { "variable": "arrivalTime", "value": "TNOW" }
  ]
}
```

### Record

Records statistics.

```json
{
  "id": "LogTime",
  "type": "record",
  "expression": "TNOW - arrivalTime",
  "name": "TotalTime"
}
```

### Batch

Groups entities into batches.

```json
{
  "id": "GroupParts",
  "type": "batch",
  "batchSize": 5,
  "rule": "Any Entity",
  "attributeName": "BatchAttr"
}
```

- `rule`: `"Any Entity"` or `"By Attribute"`
- `attributeName`: required if rule is "By Attribute"

### Separate

Splits a batch back into individual entities or creates duplicates.

```json
{
  "id": "SplitBatch",
  "type": "separate",
  "duplicates": 5
}
```

- `duplicates`: number of copies to create (original + duplicates)

### Hold

Waits for a condition, signal, or indefinitely.

```json
{
  "id": "WaitHere",
  "type": "hold",
  "action": "wait",
  "queue": "WaitQueue",
  "condition": "NQ(Server.Queue) < 3",
  "limit": 10
}
```

- `action`: `"wait"` (wait for condition), `"scan"` (scan condition), `"signal"` (wait for signal)
- `scanCondition`: required if action is "scan"
- `signal`: required if action is "signal"

### Signal

Sends a signal to release held entities.

```json
{
  "id": "ReleaseWorkers",
  "type": "signal",
  "signal": "Ready",
  "limit": 5
}
```

### Match

Synchronizes multiple entity types before proceeding.

```json
{
  "id": "SyncParts",
  "type": "match",
  "entities": [
    { "entity": "base", "attribute": "batchId" },
    { "entity": "cover", "attribute": "batchId" }
  ]
}
```

### Search

Searches a queue for an entity matching a condition.

```json
{
  "id": "FindPriority",
  "type": "search",
  "queue": "WorkQueue",
  "condition": "priority == 1"
}
```

### Store

Stores an entity in a store (holding area).

```json
{
  "id": "HoldParts",
  "type": "store",
  "store": "Buffer1"
}
```

### Unstore

Removes entity from a store.

```json
{
  "id": "ReleaseParts",
  "type": "unstore",
  "store": "Buffer1",
  "mode": "first"
}
```

- `mode`: `"first"`, `"last"`, or `"all"`

### ReadWrite

Reads from or writes to a file.

```json
{
  "id": "LogData",
  "type": "readwrite",
  "mode": "write",
  "filename": "output.txt",
  "format": "A123"
}
```

### Station

Defines a transfer station for route/transport networks.

```json
{
  "id": "WorkCenter",
  "type": "station",
  "station": "WC1",
  "group": "GroupA"
}
```

### Route

Routes an entity to a station with a travel time.

```json
{
  "id": "SendToWC",
  "type": "route",
  "station": "WC1",
  "routeTime": 5,
  "units": "Minutes"
}
```

### Enter

Entity enters from a station (used in station submodels).

```json
{
  "id": "ArriveAtWC",
  "type": "enter",
  "station": "WC1"
}
```

### Leave

Entity leaves to a station.

```json
{
  "id": "DepartFromWC",
  "type": "leave",
  "station": "WC2"
}
```

### PickStation

Selects a station based on a rule.

```json
{
  "id": "ChooseStation",
  "type": "pickstation",
  "stations": ["WC1", "WC2", "WC3"],
  "rule": "smallestQueue",
  "specificStation": "WC1"
}
```

- `rule`: `"random"`, `"smallestQueue"`, `"largestQueue"`, `"specific"`
- `specificStation`: required if rule is "specific"

### Transporter

Requests a transporter (vehicle).

```json
{
  "id": "CallForklift",
  "type": "transporter",
  "transporter": "forklift",
  "capacity": 1,
  "speed": 50,
  "station": "Loading"
}
```

### Conveyor

Accesses or releases a conveyor (base definition; use Access/Release for the actual operations).

```json
{
  "id": "BeltMove",
  "type": "conveyor",
  "conveyor": "belt1",
  "capacity": 10,
  "length": 100,
  "speed": 10,
  "accessMode": "access",
  "conveyorType": "accumulating"
}
```

### Access

Entity starts traveling on a conveyor.

```json
{
  "id": "GetOnBelt",
  "type": "access",
  "conveyor": "belt1"
}
```

### Release

Entity exits a conveyor.

```json
{
  "id": "GetOffBelt",
  "type": "release",
  "conveyor": "belt1"
}
```

## Connections Format

Connections are defined as an array of `[fromId, toId]` string pairs referencing module `id` values:

```json
"connections": [
  ["Arrival", "Service"],
  ["Service", "Inspect"],
  ["Inspect", "Accepted"],
  ["Inspect", "Rejected"]
]
```

For Decide modules, the connection order matters: the first branch maps to the first outgoing connection, the second branch to the second connection, and the elseLabel maps to the last connection(s).

## Validation Rules

The validator (`validateSpec()`) performs 34+ checks including:

- Model must have a name
- At least one Create and one Dispose module
- All module IDs must be unique
- All connections must reference existing module IDs
- Time units must be Hours, Minutes, or Seconds
- Distribution parameters must be valid (e.g., EXPO mean > 0)
- Entity/resource references must exist when entities/resources are defined
- Batch batchSize >= 2
- Decide probability branches should sum to 1
- Hold/Signal/Match/PickStation/Access/Release modules have required fields
- Warmup period >= 0
- Replications >= 1
- No duplicate entity/resource/queue/variable/attribute IDs
