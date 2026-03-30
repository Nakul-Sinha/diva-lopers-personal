import type { FunctionCard, Job } from '../types'

interface AnalyticsPageProps {
  jobs: Job[]
  functionCards: FunctionCard[]
}

export function AnalyticsPage({ jobs, functionCards }: AnalyticsPageProps) {
  const totalJobs = jobs.length
  const errors = jobs.filter((job) => job.status === 'error').length
  const errorRate = ((errors / Math.max(1, totalJobs)) * 100).toFixed(2)

  return (
    <div className="page-enter">
      <header className="page-header compact">
        <p className="breadcrumb">ANALYTICS / DATA FORWARD</p>
        <h1>Analytics</h1>
      </header>

      <section className="analytics-grid">
        <article className="glass-card analytics-card wide">
          <h2>Invocations Over Time</h2>
          <div className="line-chart">
            {Array.from({ length: 36 }, (_, i) => (
              <span key={i} style={{ height: `${25 + ((i * 9) % 60)}%` }} />
            ))}
          </div>
        </article>

        <article className="glass-card analytics-card">
          <h2>Error Rate</h2>
          <p className="metric-value">{errorRate}%</p>
          <p className="muted">last 1h rolling</p>
        </article>

        <article className="glass-card analytics-card">
          <h2>Top Functions</h2>
          <ul className="rank-list">
            {functionCards.slice(0, 5).map((fn) => (
              <li key={fn.id}>
                <span>{fn.name}</span>
                <strong className="mono">{fn.invocations}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-card analytics-card wide">
          <h2>Node Utilization Heatmap</h2>
          <div className="heatmap">
            {Array.from({ length: 56 }, (_, i) => (
              <span key={i} className={`heat-${(i % 5) + 1}`} />
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
