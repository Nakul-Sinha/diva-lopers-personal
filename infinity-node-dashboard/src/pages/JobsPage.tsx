import { useMemo, useState } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import type { Job, JobStatus, LogLine } from '../types'
import { formatRelativeTime } from '../utils/time'

interface JobsPageProps {
  jobs: Job[]
  logs: LogLine[]
}

const STATUS_FILTERS: Array<{ label: string; value: JobStatus | 'all' }> = [
  { label: 'ALL', value: 'all' },
  { label: 'RUNNING', value: 'running' },
  { label: 'TERMINAL', value: 'terminal' },
  { label: 'ERROR', value: 'error' },
  { label: 'PENDING', value: 'pending' },
  { label: 'DEAD-LETTER', value: 'dead-letter' },
]

export function JobsPage({ jobs, logs }: JobsPageProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<JobStatus | 'all'>('all')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        search.trim().length === 0 ||
        `${job.id} ${job.functionName} ${job.inputPreview}`
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchesStatus = status === 'all' || job.status === status
      return matchesSearch && matchesStatus
    })
  }, [jobs, search, status])

  const selectedLogs = useMemo(() => {
    if (!selectedJob) {
      return []
    }
    return logs.filter((line) => line.jobId === selectedJob.id).slice(0, 8)
  }, [logs, selectedJob])

  return (
    <div className="page-enter">
      <header className="page-header compact">
        <p className="breadcrumb">JOBS / OPERATIONAL CONSOLE</p>
        <h1>Jobs</h1>
      </header>

      <section className="glass-card filter-bar">
        <input
          className="input"
          placeholder="Search by job id, function, payload"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="pill-row">
          {STATUS_FILTERS.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className={`pill ${status === entry.value ? 'pill-active' : ''}`}
              onClick={() => setStatus(entry.value)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <div className="live-pill">LIVE</div>
      </section>

      <section className="glass-card panel-card">
        <div className="table-wrap">
          <table className="dense-table jobs-table">
            <thead>
              <tr>
                <th>STATUS</th>
                <th>JOB ID</th>
                <th>FUNCTION</th>
                <th>INPUT</th>
                <th>DURATION</th>
                <th>NODE</th>
                <th>MEMORY</th>
                <th>EXIT</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.slice(0, 60).map((job) => (
                <tr
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={job.status === 'dead-letter' ? 'dead-letter-row' : ''}
                >
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="mono muted">{job.id}</td>
                  <td>{job.functionName}</td>
                  <td className="mono muted">{job.inputPreview}</td>
                  <td className="mono">{job.durationMs}ms</td>
                  <td className="mono muted">{job.node}</td>
                  <td className={job.memoryMb > 220 ? 'warn mono' : 'mono'}>{job.memoryMb}MB</td>
                  <td className="mono">{job.exitCode}</td>
                  <td className="muted">{formatRelativeTime(job.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedJob && (
        <aside className="drawer-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="job-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="mono">{selectedJob.id}</h2>
              <StatusBadge status={selectedJob.status} />
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedJob(null)}>
                Close
              </button>
            </div>
            <div className="drawer-section">
              <h3>Summary</h3>
              <ul>
                <li>Function: {selectedJob.functionName}</li>
                <li>Version: {selectedJob.version}</li>
                <li>Node: {selectedJob.node}</li>
                <li>Duration: {selectedJob.durationMs}ms</li>
                <li>Exit: {selectedJob.exitCode}</li>
              </ul>
            </div>
            <div className="drawer-section">
              <h3>Logs</h3>
              <div className="drawer-logs">
                {selectedLogs.length === 0 && <p className="muted">No logs for this job yet.</p>}
                {selectedLogs.map((line) => (
                  <p key={line.id} className="mono drawer-log-line">
                    [{line.level}] {line.message}
                  </p>
                ))}
              </div>
            </div>
            <div className="drawer-footer">
              <button className="btn btn-secondary" type="button">
                Re-run
              </button>
              <button className="btn btn-primary" type="button">
                Re-enqueue
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
