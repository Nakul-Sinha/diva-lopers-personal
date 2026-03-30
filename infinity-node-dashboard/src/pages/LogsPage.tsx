import { useEffect, useMemo, useRef, useState } from 'react'
import type { ConnectionState, LogLine } from '../types'
import { formatClockTime } from '../utils/time'

interface LogsPageProps {
  logs: LogLine[]
  connectionState: ConnectionState
}

export function LogsPage({ logs, connectionState }: LogsPageProps) {
  const [query, setQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleLogs = useMemo(() => {
    if (!query.trim()) {
      return logs
    }
    return logs.filter((line) => {
      const target = `${line.functionName} ${line.message} ${line.jobId}`.toLowerCase()
      return target.includes(query.toLowerCase())
    })
  }, [logs, query])

  useEffect(() => {
    if (!autoScroll || !containerRef.current) {
      return
    }
    containerRef.current.scrollTop = 0
  }, [visibleLogs, autoScroll])

  return (
    <div className="page-enter">
      <header className="page-header compact">
        <p className="breadcrumb">LOGS / REAL-TIME STREAM</p>
        <h1>Logs</h1>
      </header>

      <section className="glass-card filter-bar">
        <input
          className="input"
          placeholder="Search logs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className={`conn-pill conn-${connectionState}`}>{connectionState.toUpperCase()}</div>
        <button type="button" className="btn btn-ghost" onClick={() => setAutoScroll((value) => !value)}>
          {autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
        </button>
      </section>

      <section className="logs-layout">
        <article className="glass-card logs-stream" ref={containerRef}>
          <div className="stream-head">
            <span className="mono">{visibleLogs.length.toLocaleString()} lines</span>
            <span className="muted">{query ? `matches for "${query}"` : 'live feed'}</span>
          </div>
          <div className="stream-rows">
            {visibleLogs.slice(0, 240).map((line) => (
              <div key={line.id} className={`log-row level-${line.level.toLowerCase()}`}>
                <span className="mono muted">{formatClockTime(line.timestamp)}</span>
                <span className="level-pill">{line.level}</span>
                <span className="mono tag">[{line.jobId}]</span>
                <span className="mono tag">{line.functionName}</span>
                <span className="mono log-message">{line.message}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="glass-card observability-panel">
          <h2>Observability</h2>
          <div className="obs-section">
            <p className="muted">Error rate (1h)</p>
            <div className="mini-chart" />
          </div>
          <div className="obs-section">
            <p className="muted">Log volume by level</p>
            <div className="bars">
              <span style={{ height: '56%' }} />
              <span style={{ height: '22%' }} />
              <span style={{ height: '34%' }} />
              <span style={{ height: '72%' }} />
            </div>
          </div>
          <div className="obs-section">
            <p className="muted">Top functions by volume</p>
            <ul>
              <li>fn:resize-image</li>
              <li>fn:parse-csv</li>
              <li>fn:video-transcode</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}
