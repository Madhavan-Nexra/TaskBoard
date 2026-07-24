// Small date/time formatting helpers shared across TaskCard, TaskBoard, and History.

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = now - then
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`
  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  const diffWeek = Math.round(diffDay / 7)
  if (diffWeek < 5) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`
  const diffMonth = Math.round(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`
  const diffYear = Math.round(diffDay / 365)
  return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function isOverdue(dueAt: string | null, status: string): boolean {
  if (!dueAt || status === 'done') return false
  return new Date(dueAt).getTime() < Date.now()
}

/** Formats the remaining time until a due date as a short "Xh left" / "Xd left" style label. */
export function timeRemainingLabel(dueAt: string): string {
  const diffMs = new Date(dueAt).getTime() - Date.now()
  if (diffMs <= 0) return 'overdue'
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (diffHours < 1) return `${Math.max(1, Math.round(diffMs / (1000 * 60)))}m left`
  if (diffHours < 24) return `${diffHours}h left`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d left`
}

/** Converts an ISO datetime to the `YYYY-MM-DDTHH:mm` format required by `<input type="datetime-local">`. */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`
}

/** Converts a `datetime-local` input value back to an ISO string, or null if empty. */
export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/** Groups a completed_at ISO timestamp into "Today" / "Yesterday" / a formatted date label. */
export function dateGroupLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return formatDate(iso)
}
