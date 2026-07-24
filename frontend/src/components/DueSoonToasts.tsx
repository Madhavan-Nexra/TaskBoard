import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSettings, listTasks } from '../lib/api'
import { formatRelativeTime, isOverdue, timeRemainingLabel } from '../lib/format'
import { showNativeNotification } from '../lib/notifications'

const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000
const POLL_INTERVAL_MS = 60_000
const TOAST_LIFETIME_MS = 8_000

interface Toast {
  id: string
  title: string
  overdue: boolean
  label: string
}

function playChime() {
  try {
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.35)
    oscillator.onended = () => ctx.close()
  } catch {
    // audio unavailable (autoplay policy, unsupported browser) — skip silently
  }
}

/** Watches tasks for ones entering their "due soon" window and pops a toast the
 * first time each one crosses that threshold. Mounted once at the app root so it
 * fires regardless of which page the user is on. */
export default function DueSoonToasts() {
  const { session } = useAuth()
  const [toasts, setToasts] = useState<Toast[]>([])
  const announced = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function check() {
      const [tasks, settings] = await Promise.all([listTasks(), getSettings()])
      if (cancelled || !settings.enable_reminders) return

      const now = Date.now()
      const newlyDue = tasks.filter(
        (t) =>
          t.status !== 'done' &&
          t.due_at !== null &&
          new Date(t.due_at).getTime() <= now + DUE_SOON_WINDOW_MS &&
          !announced.current.has(t.id)
      )

      if (newlyDue.length === 0) return

      newlyDue.forEach((t) => announced.current.add(t.id))
      const entries = newlyDue.map((t) => {
        const overdue = isOverdue(t.due_at, t.status)
        return {
          id: t.id,
          title: t.title,
          overdue,
          label: overdue
            ? `was due ${formatRelativeTime(t.due_at as string)}`
            : `due in ${timeRemainingLabel(t.due_at as string)}`,
        }
      })
      setToasts((prev) => [...prev, ...entries])
      entries.forEach((e) => showNativeNotification(e.title, e.label, e.id))
      if (settings.sound_on) playChime()
    }

    check()
    const interval = setInterval(check, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [session])

  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), TOAST_LIFETIME_MS)
    return () => clearTimeout(timer)
  }, [toasts])

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg ${
            toast.overdue
              ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
              : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
          }`}
        >
          <span aria-hidden="true">{toast.overdue ? '⏰' : '🔔'}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{toast.title}</p>
            <p className={`text-xs capitalize ${toast.overdue ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
              {toast.label}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => dismiss(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
