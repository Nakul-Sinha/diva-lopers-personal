import { useEffect, useMemo, useState } from 'react'
import type {
  ClusterHealth,
  ConnectionState,
  FunctionCard,
  Job,
  JobStatus,
  LogLine,
  Metric,
} from '../types'

const FUNCTION_NAMES = [
  'fn:resize-image',
  'fn:parse-csv',
  'fn:send-email',
  'fn:video-transcode',
  'fn:build-thumbnail',
  'fn:clean-webhook',
]

const NODES = ['worker-node-01', 'worker-node-02', 'worker-node-03', 'worker-node-04']
const LEVELS: LogLine['level'][] = ['INFO', 'DEBUG', 'WARN', 'ERROR', 'STDOUT', 'STDERR']

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(values: T[]): T {
  return values[randomInt(0, values.length - 1)]
}

function makeJob(idSeed: number): Job {
  const statusPool: JobStatus[] = ['running', 'terminal', 'pending', 'error', 'terminal']
  const status = pick(statusPool)
  return {
    id: `job_${String(idSeed).padStart(7, '0')}`,
    functionName: pick(FUNCTION_NAMES),
    version: `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
    status,
    durationMs: randomInt(18, 1400),
    node: pick(NODES),
    memoryMb: randomInt(40, 256),
    exitCode: status === 'error' ? 1 : 0,
    timestamp: Date.now() - randomInt(0, 1000 * 60 * 30),
    inputPreview: '{"batch":24,"format":"webp"}',
  }
}

function makeLog(job: Job, lineId: number): LogLine {
  const level = pick(LEVELS)
  const messages = [
    'execution started',
    'artifact loaded from cache',
    'snapshot restored',
    'input validated',
    'processing batch items',
    'execution completed',
    'memory near limit',
    'retry scheduled',
  ]

  return {
    id: `log_${lineId}`,
    timestamp: Date.now() - randomInt(0, 1000 * 60 * 10),
    level,
    jobId: job.id,
    functionName: job.functionName,
    message: pick(messages),
  }
}

function makeFunctionCards(): FunctionCard[] {
  return FUNCTION_NAMES.map((name, index) => ({
    id: `fn_${index + 1}`,
    name,
    runtime: index % 2 === 0 ? 'Python 3.11' : 'Node.js 22',
    memory: `${64 + index * 32}MB`,
    invocations: randomInt(900, 2600),
    p99: randomInt(22, 88),
    errorRate: Number((Math.random() * 0.45).toFixed(2)),
    deployedAgo: `${randomInt(1, 9)}h ago`,
    owner: index % 2 === 0 ? 'krishang' : 'ananya',
    active: true,
  }))
}

export function useMockRealtime() {
  const [jobs, setJobs] = useState<Job[]>(() => Array.from({ length: 48 }, (_, i) => makeJob(i + 1)))
  const [logs, setLogs] = useState<LogLine[]>(() => {
    const seeds = Array.from({ length: 120 }, (_, i) => makeJob(i + 100))
    return seeds.map((job, idx) => makeLog(job, idx + 1))
  })
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected')
  const [, setCounter] = useState(10000)
  const [functionCards] = useState<FunctionCard[]>(() => makeFunctionCards())

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => {
        const nextCounter = prev + 1

        setJobs((prevJobs) => {
          const newest = makeJob(nextCounter)
          newest.timestamp = Date.now()

          const bumped = prevJobs.map((job) => {
            if (job.status === 'running' && Math.random() > 0.65) {
              const nextStatus: JobStatus = Math.random() > 0.86 ? 'error' : 'terminal'
              return {
                ...job,
                status: nextStatus,
                durationMs: job.durationMs + randomInt(12, 180),
              }
            }
            return job
          })

          return [newest, ...bumped].slice(0, 220)
        })

        setLogs((prevLogs) => {
          const latestJob = makeJob(nextCounter + 1)
          latestJob.timestamp = Date.now()
          const newLines = Array.from({ length: randomInt(1, 3) }, (_, idx) =>
            makeLog(latestJob, nextCounter * 10 + idx),
          )
          return [...newLines, ...prevLogs].slice(0, 600)
        })

        if (Math.random() > 0.96) {
          setConnectionState('disconnected')
        } else if (Math.random() > 0.92) {
          setConnectionState('connecting')
        } else {
          setConnectionState('connected')
        }

        return nextCounter
      })
    }, 2400)

    return () => clearInterval(interval)
  }, [])

  const metrics = useMemo<Metric[]>(() => {
    const running = jobs.filter((job) => job.status === 'running').length
    const errors = jobs.filter((job) => job.status === 'error').length
    const errorRate = jobs.length ? ((errors / jobs.length) * 100).toFixed(2) : '0.00'

    return [
      {
        key: 'running',
        label: 'RUNNING',
        value: String(running),
        delta: `+${randomInt(1, 4)} (1m)`,
        trend: 'up',
      },
      {
        key: 'jps',
        label: 'JOBS/SEC',
        value: (120 + Math.random() * 40).toFixed(1),
        delta: `+${randomInt(2, 16)}%`,
        trend: 'up',
      },
      {
        key: 'p99',
        label: 'P99 LATENCY',
        value: `${randomInt(24, 61)}ms`,
        delta: `-${randomInt(1, 5)}ms`,
        trend: 'down',
      },
      {
        key: 'error',
        label: 'ERROR RATE',
        value: `${errorRate}%`,
        delta: errorRate === '0.00' ? 'healthy' : 'watching',
        trend: Number(errorRate) > 1 ? 'up' : 'neutral',
      },
      {
        key: 'queue',
        label: 'QUEUE DEPTH',
        value: String(randomInt(20, 140)),
        delta: Math.random() > 0.5 ? 'draining' : 'steady',
        trend: 'neutral',
      },
    ]
  }, [jobs])

  const clusterHealth = useMemo<ClusterHealth>(() => {
    const running = jobs.filter((job) => job.status === 'running').length
    const error = jobs.filter((job) => job.status === 'error').length
    return {
      running,
      idle: Math.max(0, 12 - running),
      error,
      activeNodes: 4,
      maxNodes: 8,
      autoscaler: running > 8 ? 'SCALING OUT' : running < 2 ? 'DRAINING' : 'STABLE',
      lastScaleEvent: 'scaled out +2 nodes, 4m ago',
    }
  }, [jobs])

  const timelineLanes = useMemo(() => {
    return NODES.map((node, index) => ({
      node,
      blocks: Array.from({ length: randomInt(1, 3) }, (_, idx) => ({
        id: `${node}-${idx}`,
        label: pick(FUNCTION_NAMES),
        width: randomInt(14, 48),
        offset: randomInt(0, 40),
        chartClass: `chart-${((index + idx) % 6) + 1}`,
      })),
    }))
  }, [jobs])

  return {
    metrics,
    jobs,
    logs,
    connectionState,
    functionCards,
    clusterHealth,
    timelineLanes,
  }
}
