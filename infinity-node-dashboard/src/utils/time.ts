export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSec < 60) {
    return `${diffSec}s ago`
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return `${diffMin}m ago`
  }

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) {
    return `${diffHr}h ago`
  }

  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function formatClockTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
