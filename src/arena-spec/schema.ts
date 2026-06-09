export type Distribution =
  | { type: "EXPO"; params: [number] }
  | { type: "UNIF"; params: [number, number] }
  | { type: "NORM"; params: [number, number] }
  | { type: "TRIA"; params: [number, number, number] }
  | { type: "ERLA"; params: [number, number] }
  | { type: "WEIB"; params: [number, number] }
  | { type: "GAMM"; params: [number, number] }
  | { type: "BETA"; params: [number, number] }
  | { type: "POIS"; params: [number] }
  | { type: "NEgexp"; params: [number] }
  | { type: "LOGN"; params: [number, number] }
  | { type: "constant"; params: [number] };

export type TimeUnit = "Hours" | "Minutes" | "Seconds";

export type ExpressionDef = string | number;

export type FlowModuleType =
  | "create"
  | "process"
  | "dispose"
  | "decide"
  | "assign"
  | "record"
  | "batch"
  | "separate"
  | "hold"
  | "signal"
  | "match"
  | "search"
  | "store"
  | "unstore"
  | "readwrite"
  | "station"
  | "route"
  | "enter"
  | "leave"
  | "pickstation"
  | "transporter"
  | "conveyor"
  | "access"
  | "release";

export type DecideCondition =
  | { type: "probability"; value: number }
  | { type: "expression"; expression: string };

export type CreateModule = {
  id: string;
  type: "create";
  entity: string;
  arrival: {
    distribution: Distribution;
    entitiesPerArrival?: number;
    maxArrivals?: number;
  };
};

export type ProcessModule = {
  id: string;
  type: "process";
  resource?: string;
  delay: {
    distribution: Distribution;
    units?: TimeUnit;
  };
};

export type DisposeModule = {
  id: string;
  type: "dispose";
};

export type DecideModule = {
  id: string;
  type: "decide";
  branches: DecideCondition[];
  elseLabel?: string;
};

export type AssignModule = {
  id: string;
  type: "assign";
  assignments: Array<{
    variable: string;
    value: string;
  }>;
};

export type RecordModule = {
  id: string;
  type: "record";
  expression: string;
  name?: string;
};

export type BatchModule = {
  id: string;
  type: "batch";
  batchSize: number;
  rule?: "Any Entity" | "By Attribute";
  attributeName?: string;
};

export type SeparateModule = {
  id: string;
  type: "separate";
  duplicates?: number;
};

export type FlowModuleBase = {
  id: string;
};

export type HoldModule = FlowModuleBase & {
  type: "hold";
  queue?: string;
  condition?: string;
  signal?: string;
  action: "wait" | "scan" | "signal";
  scanCondition?: string;
  limit?: number;
};

export type SignalModule = FlowModuleBase & {
  type: "signal";
  signal: string;
  limit: number;
};

export type MatchModule = FlowModuleBase & {
  type: "match";
  entities: { entity: string; attribute?: string }[];
};

export type SearchModule = FlowModuleBase & {
  type: "search";
  queue: string;
  condition: string;
};

export type StoreModule = FlowModuleBase & {
  type: "store";
  store: string;
};

export type UnstoreModule = FlowModuleBase & {
  type: "unstore";
  store: string;
  mode: "first" | "last" | "all";
};

export type ReadWriteModule = FlowModuleBase & {
  type: "readwrite";
  mode: "read" | "write";
  filename: string;
  format?: string;
};

export type StationModule = FlowModuleBase & {
  type: "station";
  station: string;
  group?: string;
};

export type RouteModule = FlowModuleBase & {
  type: "route";
  station: string;
  routeTime: ExpressionDef;
  units?: TimeUnit;
};

export type EnterModule = FlowModuleBase & {
  type: "enter";
  station: string;
};

export type LeaveModule = FlowModuleBase & {
  type: "leave";
  station: string;
};

export type PickStationModule = FlowModuleBase & {
  type: "pickstation";
  stations: string[];
  rule: "random" | "smallestQueue" | "largestQueue" | "specific";
  specificStation?: string;
};

export type TransporterModule = FlowModuleBase & {
  type: "transporter";
  transporter: string;
  capacity?: number;
  speed?: number;
  distance?: string;
  station?: string;
};

export type ConveyorModule = FlowModuleBase & {
  type: "conveyor";
  conveyor: string;
  capacity?: number;
  length?: number;
  speed?: number;
  accessMode: "access" | "release";
  conveyorType?: "fixed" | "accumulating";
};

export type AccessModule = FlowModuleBase & {
  type: "access";
  conveyor: string;
};

export type ReleaseModule = FlowModuleBase & {
  type: "release";
  conveyor: string;
};

export type FlowModule =
  | CreateModule
  | ProcessModule
  | DisposeModule
  | DecideModule
  | AssignModule
  | RecordModule
  | BatchModule
  | SeparateModule
  | HoldModule
  | SignalModule
  | MatchModule
  | SearchModule
  | StoreModule
  | UnstoreModule
  | ReadWriteModule
  | StationModule
  | RouteModule
  | EnterModule
  | LeaveModule
  | PickStationModule
  | TransporterModule
  | ConveyorModule
  | AccessModule
  | ReleaseModule;

export type ResourceFailure = {
  type: "count" | "time";
  count?: number;
  length?: number;
  units?: TimeUnit;
  downtimeUnits?: TimeUnit;
  uptimeUnits?: TimeUnit;
};

export type ResourceCost = {
  perHour?: number;
  perUse?: number;
  perUnit?: number;
  initial?: number;
};

export type ResourceDef = {
  id: string;
  name?: string;
  capacity: number;
  schedule?: string;
  failures?: ResourceFailure[];
  costs?: ResourceCost;
};

export type EntityDef = {
  id: string;
  name?: string;
  picture?: string;
  initialCost?: number;
  addCost?: number;
  holdingCost?: number;
};

export type QueueDef = {
  id: string;
  name?: string;
  discipline?: "FIFO" | "LIFO" | "LowestAttribute" | "HighestAttribute";
  attributeName?: string;
};

export type SetDef = {
  id: string;
  name: string;
  type: "resource" | "queue";
  members: string[];
};

export type VariableDef = {
  id: string;
  name?: string;
  type: "number" | "string";
  initialValue?: number | string;
};

export type AttributeDef = {
  id: string;
  name?: string;
  type: "number" | "string";
  initialValue?: number | string;
};

export type ScheduleDef = {
  id: string;
  name?: string;
  type: "capacity" | "arrival";
  timeUnits: TimeUnit;
  durations: Array<{
    value: number;
    length: number;
  }>;
};

export type StationDef = {
  id: string;
  name: string;
  x?: number;
  y?: number;
};

export type TransporterDef = {
  id: string;
  name: string;
  capacity: number;
  speed: number;
  units: TimeUnit;
};

export type ConveyorDef = {
  id: string;
  name: string;
  capacity: number;
  length: number;
  speed: number;
  type: "fixed" | "accumulating";
  units: TimeUnit;
};

export type DistanceDef = {
  from: string;
  to: string;
  distance: number;
};

export type StatisticDef = {
  id: string;
  type: "time_persistent" | "tally" | "counter" | "output";
  expression: string;
  name?: string;
};

export type Connection = [string, string];

export type ArenaModelSpec = {
  name: string;
  description?: string;
  timeUnits?: TimeUnit;
  baseTimeUnits?: TimeUnit;
  replications?: number;
  replicationLength?: number;
  warmupPeriod?: number;
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
  flow: FlowModule[];
  connections: Connection[];
};
