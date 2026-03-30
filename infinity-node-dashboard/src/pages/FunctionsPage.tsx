import { useState } from 'react'
import type { FunctionCard } from '../types'

interface FunctionsPageProps {
  functionCards: FunctionCard[]
}

const PROCESS_LINES = [
  'Validating artifact...      OK',
  'Hashing content (SHA-256)... OK a3f2c1b9',
  'Uploading to storage...      100%',
  'Registering function...      OK',
  'Running smoke test...        OK exit 0 (42ms)',
]

export function FunctionsPage({ functionCards }: FunctionsPageProps) {
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)

  function handleStartUpload() {
    setProcessing(true)
    window.setTimeout(() => setProcessing(false), 4300)
  }

  return (
    <div className="page-enter">
      <header className="page-header compact page-head-row">
        <div>
          <p className="breadcrumb">COMPUTE / FUNCTIONS</p>
          <h1>Functions</h1>
        </div>
        <button type="button" className="btn btn-primary">
          Deploy Function
        </button>
      </header>

      <section
        className={`glass-card upload-zone ${dragActive ? 'upload-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          handleStartUpload()
        }}
      >
        {!processing && (
          <>
            <p className="upload-icon">^</p>
            <h2>Drag and drop your function tarball</h2>
            <p className="muted">or paste a Docker image URL</p>
            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={handleStartUpload}>
                Browse files
              </button>
              <button type="button" className="btn btn-ghost">
                From Git
              </button>
              <button type="button" className="btn btn-ghost">
                From Registry
              </button>
            </div>
          </>
        )}

        {processing && (
          <div className="terminal-block">
            {PROCESS_LINES.map((line) => (
              <p key={line} className="mono log-line-new">
                {line}
              </p>
            ))}
            <p className="mono terminal-success">Function deployed: fn:image-resize v1.0.0</p>
          </div>
        )}
      </section>

      <section className="fn-grid">
        {functionCards.map((fn) => (
          <article className="glass-card fn-card" key={fn.id}>
            <div className="fn-card-head">
              <h3>{fn.name}</h3>
              <span className="active-pill">active</span>
            </div>
            <p className="muted">
              {fn.runtime} - {fn.memory}
            </p>
            <div className="sparkline" />
            <p className="mono">{fn.invocations.toLocaleString()} invocations today</p>
            <p className="muted">
              P99: {fn.p99}ms - Error: {fn.errorRate}%
            </p>
            <p className="muted">Deployed {fn.deployedAgo} by {fn.owner}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
