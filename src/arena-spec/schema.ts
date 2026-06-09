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

export type FlowModuleType =
  | "create"
  | "process"
  | "dispose"
  | "decide"
  | "assign"
  | "record"
  | "batch"
  | "separate";

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
    units?: "Hours" | "Minutes" | "Seconds";
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

export type FlowModule =
  | CreateModule
  | ProcessModule
  | DisposeModule
  | DecideModule
  | AssignModule
  | RecordModule
  | BatchModule
  | SeparateModule;

export type ResourceDef = {
  id: string;
  name?: string;
  capacity: number;
  schedule?: string;
};

export type EntityDef = {
  id: string;
  name?: string;
  picture?: string;
  initialCost?: number;
  addCost?: number;
};

export type QueueDef = {
  id: string;
  name?: string;
  type?: "FirstInFirstOut" | "LastInFirstOut" | "LowestAttributeFirst" | "HighestAttributeFirst";
  attributeName?: string;
};

export type VariableDef = {
  id: string;
  name?: string;
  type: "number" | "string";
  initialValue?: number | string;
};

export type ScheduleDef = {
  id: string;
  name?: string;
  type: "capacity" | "arrival";
  timeUnits: "Hours" | "Minutes" | "Seconds";
  durations: Array<{
    value: number;
    length: number;
  }>;
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
  timeUnits?: "Hours" | "Minutes" | "Seconds";
  replications?: number;
  replicationLength?: number;
  entities?: EntityDef[];
  resources?: ResourceDef[];
  queues?: QueueDef[];
  variables?: VariableDef[];
  schedules?: ScheduleDef[];
  statistics?: StatisticDef[];
  flow: FlowModule[];
  connections: Connection[];
};
