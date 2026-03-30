import type { JobStatus } from '../types'

interface StatusBadgeProps {
  status: JobStatus
}

const STATUS_LABEL: Record<JobStatus, string> = {
  running: 'RUNNING',
  terminal: 'DONE',
  error: 'ERROR',
  pending: 'PENDING',
  'dead-letter': 'DL',
  idle: 'IDLE',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {STATUS_LABEL[status]}
    </span>
  )
}
