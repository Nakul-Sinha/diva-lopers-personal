import { StatusBadge } from '../components/StatusBadge'
import type { ClusterHealth, Job, Metric } from '../types'
import { formatRelativeTime } from '../utils/time'

interface TimelineLane {
  node: string
  blocks: Array<{ id: string; label: string; width: number; offset: number; chartClass: string }>
}

interface OverviewPageProps {
  metrics: Metric[]
  timelineLanes: TimelineLane[]
  jobs: Job[]
  clusterHealth: ClusterHealth
}

export function OverviewPage({ metrics, timelineLanes, jobs, clusterHealth }: OverviewPageProps) {
  const recentJobs = jobs.slice(0, 9)
  const total = clusterHealth.running + clusterHealth.idle + clusterHealth.error
  const runningPct = Math.round((clusterHealth.running / Math.max(1, total)) * 100)
  const idlePct = Math.round((clusterHealth.idle / Math.max(1, total)) * 100)
  const errorPct = 100 - runningPct - idlePct

  return (
    <div className="page-enter">
      <header className="page-header">
        <p className="breadcrumb">OVERVIEW / LIVE CONTROL PLANE</p>
        <h1>Infinity Node</h1>
      </header>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article key={metric.key} className="metric-card glass-card">
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className={`metric-delta trend-${metric.trend}`}>{metric.delta}</p>
          </article>
        ))}
      </section>

      <section className="glass-card timeline-card">
        <div className="timeline-header">
          <h2>Execution Timeline</h2>
          <span className="mono">30s window</span>
        </div>
        <div className="timeline-now" />
        {timelineLanes.map((lane) => (
          <div className="timeline-lane" key={lane.node}>
            <span className="timeline-node">{lane.node}</span>
            <div className="timeline-track">
              {lane.blocks.map((block) => (
                <div
                  key={block.id}
                  className={`timeline-block ${block.chartClass}`}
                  style={{ width: `${block.width}%`, marginLeft: `${block.offset}%` }}
                >
                  {block.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="status-grid">
        <article className="glass-card panel-card">
          <div className="panel-head">
            <h2>Recent Jobs Feed</h2>
            <span className="mono">live</span>
          </div>
          <div className="table-wrap">
            <table className="dense-table">
              <thead>
                <tr>
                  <th>JOB ID</th>
                  <th>FUNCTION</th>
                  <th>STATUS</th>
                  <th>DURATION</th>
                  <th>NODE</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="mono muted">{job.id}</td>
                    <td>{job.functionName}</td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="mono">{job.durationMs}ms</td>
                    <td className="mono muted">{job.node}</td>
                    <td className="muted">{formatRelativeTime(job.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="glass-card panel-card">
          <div className="panel-head">
            <h2>Cluster Health</h2>
            <span className="mono">nodes</span>
          </div>
          <div
            className="donut"
            style={{
              background: `conic-gradient(var(--status-running) 0 ${runningPct}%, var(--status-idle) ${runningPct}% ${runningPct + idlePct}%, var(--status-error) ${runningPct + idlePct}% 100%)`,
            }}
          >
            <div className="donut-hole">{clusterHealth.activeNodes}</div>
          </div>
          <ul className="health-list">
            <li>
              <span>Active nodes</span>
              <strong>
                {clusterHealth.activeNodes} / {clusterHealth.maxNodes}
              </strong>
            </li>
            <li>
              <span>Autoscaler</span>
              <strong>{clusterHealth.autoscaler}</strong>
            </li>
            <li>
              <span>Last scale event</span>
              <strong>{clusterHealth.lastScaleEvent}</strong>
            </li>
            <li>
              <span>Error slots</span>
              <strong>{Math.max(0, errorPct)}%</strong>
            </li>
          </ul>
        </article>
      </section>

      <section className="glass-card deploy-card">
        <div className="deploy-head">
          <h2>Production Deployment</h2>
          <div className="button-row">
            <button className="btn btn-secondary" type="button">
              Repository
            </button>
            <button className="btn btn-ghost" type="button">
              Rollback
            </button>
          </div>
        </div>
        <div className="deploy-body">
          <div className="deploy-preview">
            <p className="mono">throughput ghost chart</p>
            <div className="sparkline" />
          </div>
          <div className="deploy-meta">
            <p>
              Deployment: <span className="mono">abc123f main 3h ago</span>
            </p>
            <p>
              Status: <span className="status-ready">READY</span>
            </p>
            <p>
              Region: <span className="mono">us-east-1</span>
            </p>
            <p>
              Nodes: <span className="mono">4 active</span>
            </p>
            <p className="muted">Last commit: fix(worker): increase vm snapshot pool size</p>
          </div>
        </div>
      </section>
    </div>
  )
}
