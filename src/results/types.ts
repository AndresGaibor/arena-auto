export type EntityMetrics = {
  name: string;
  numberIn: number;
  numberOut: number;
  avgTimeInSystem: number;
  halfWidthTimeInSystem: number;
  avgWorkInProcess: number;
  halfWidthWorkInProcess: number;
};

export type QueueMetrics = {
  name: string;
  avgLength: number;
  halfWidthLength: number;
  avgWaitTime: number;
  halfWidthWaitTime: number;
  maxLength: number;
  currentLength: number;
};

export type ResourceMetrics = {
  name: string;
  avgBusy: number;
  halfWidthBusy: number;
  avgUtilization: number;
  avgIdle: number;
  avgNumberSeized: number;
  halfWidthNumberSeized: number;
  currentState: number;
};

export type VariableMetrics = {
  name: string;
  finalValue: number;
};

export type SimulationMetrics = {
  replicationCount: number;
  replicationLength: number;
  warmupPeriod: number;
  timeUnits: string;
  runTime: number;
  entities: EntityMetrics[];
  queues: QueueMetrics[];
  resources: ResourceMetrics[];
  variables: VariableMetrics[];
};

export type SimulationSummary = {
  modelName: string;
  runAt: string;
  status: string;
  simulationTime: number;
  metrics: SimulationMetrics;
};

export type Diagnosis = {
  bottlenecks: {
    resource: string;
    utilization: number;
    suggestion: string;
  }[];
  saturatedResources: {
    resource: string;
    utilization: number;
    suggestion: string;
  }[];
  growingQueues: {
    queue: string;
    avgLength: number;
    maxLength: number;
    suggestion: string;
  }[];
  entityStats: {
    entity: string;
    totalInSystem: number;
    avgTime: number;
    suggestion?: string;
  }[];
  warnings: string[];
  score: number;
};

export type Report = {
  summary: SimulationSummary;
  diagnosis: Diagnosis;
  markdown: string;
};
