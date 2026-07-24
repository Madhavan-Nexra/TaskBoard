import { useEffect, useRef, useState } from 'react'
import { ACTIVITY_META } from '../lib/activity'
import { getRecentActivity, getSettings, listTasks } from '../lib/api'
import { formatRelativeTime, isOverdue, timeRemainingLabel } from '../lib/format'
import type { ActivityLogEntry, Task } from '../types'

const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false)
  const [dueSoon, setDueSoon] = useState<Task[]>([])
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [tasks, activityRes, settings] = await Promise.all([
        listTasks(),
        getRecentActivity(5),
        getSettings(),
      ])
      if (cancelled) return

      const now = Date.now()
      const soon = tasks
        .filter(
          (t) =>
            t.status !== 'done' &&
            t.due_at !== null &&
            new Date(t.due_at).getTime() <= now + DUE_SOON_WINDOW_MS
        )
        .sort((a, b) => new Date(a.due_at as string).getTime() - new Date(b.due_at as string).getTime())

      setDueSoon(soon)
      setActivity(activityRes)
      setRemindersEnabled(settings.enable_reminders)
    }

    load()
    const interval = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const reminders = remindersEnabled ? dueSoon : []
  const badgeCount = reminders.length
  const hasNothing = reminders.length === 0 && activity.length === 0

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <span aria-hidden="true">🔔</span>
        {badgeCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {hasNothing && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">You're all caught up.</p>
            )}

            {reminders.length > 0 && (
              <div className="px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Due soon</p>
                <ul className="space-y-2">
                  {reminders.map((task) => {
                    const overdue = isOverdue(task.due_at, task.status)
                    return (
                      <li key={task.id} className="flex items-start gap-2">
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            overdue ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {task.title}
                          </p>
                          <p className={`text-xs ${overdue ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                            {task.due_at ? timeRemainingLabel(task.due_at) : ''}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {activity.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Recent activity</p>
                <ul className="space-y-3">
                  {activity.map((entry) => {
                    const meta = ACTIVITY_META[entry.action]
                    return (
                      <li key={entry.id} className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${meta.iconClass}`}
                        >
                          {meta.icon}
                        </span>
                        <p className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                          You {meta.verb} <span className="font-medium text-blue-600">{entry.task_title}</span>
                        </p>
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelativeTime(entry.created_at)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
