export type JobStatus =
  | 'running'
  | 'terminal'
  | 'error'
  | 'pending'
  | 'dead-letter'
  | 'idle'

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'failed'

export interface Metric {
  key: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
}

export interface Job {
  id: string
  functionName: string
  version: string
  status: JobStatus
  durationMs: number
  node: string
  memoryMb: number
  exitCode: number
  timestamp: number
  inputPreview: string
}

export interface LogLine {
  id: string
  timestamp: number
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'STDOUT' | 'STDERR'
  jobId: string
  functionName: string
  message: string
}

export interface FunctionCard {
  id: string
  name: string
  runtime: string
  memory: string
  invocations: number
  p99: number
  errorRate: number
  deployedAgo: string
  owner: string
  active: boolean
}

export interface ClusterHealth {
  running: number
  idle: number
  error: number
  activeNodes: number
  maxNodes: number
  autoscaler: 'STABLE' | 'SCALING OUT' | 'DRAINING'
  lastScaleEvent: string
}
