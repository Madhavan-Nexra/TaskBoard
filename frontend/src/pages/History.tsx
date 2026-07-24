import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '../App'
import { getHistory, getHistoryStats, reopenTask } from '../lib/api'
import { CATEGORY_META, CATEGORY_ORDER } from '../lib/badges'
import { HistoryIllustration } from '../components/illustrations'
import { dateGroupLabel, formatDate, formatRelativeTime, formatShortDate } from '../lib/format'
import type { Category, HistoryRange, HistoryStats, Task } from '../types'

const RANGE_TABS: { value: HistoryRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
]

const RANGE_ORDER: HistoryRange[] = ['today', 'week', 'month', 'all']

const MOTIVATIONAL_QUOTE = 'Success is the sum of small efforts, repeated day in and day out.'

function ProgressRing({ percent }: { percent: number }) {
  const size = 96
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, percent))
  const offset = circumference * (1 - clamped / 100)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-slate-200 dark:text-slate-800"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-blue-600 transition-all duration-500"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-slate-800 text-lg font-bold dark:fill-white"
      >
        {clamped}%
      </text>
    </svg>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="w-2 rounded-sm bg-blue-500/70"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
          title={`${v}`}
        />
      ))}
    </div>
  )
}

export default function History() {
  const { search, setSearch } = useOutletContext<LayoutContext>()
  const [range, setRange] = useState<HistoryRange>('week')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setError(null)
    try {
      const [historyRes, statsRes] = await Promise.all([
        getHistory({ range, category: category === 'all' ? undefined : category, search: search || undefined }),
        getHistoryStats(),
      ])
      setTasks(historyRes)
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.')
    } finally {
      setLoading(false)
    }
  }, [range, category, search])

  useEffect(() => {
    setLoading(true)
    fetchHistory()
  }, [fetchHistory])

  async function handleReopen(task: Task) {
    const previous = tasks
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    try {
      await reopenTask(task.id)
    } catch (err) {
      setTasks(previous)
      setError(err instanceof Error ? err.message : 'Failed to reopen task.')
    }
  }

  function handleLoadOlder() {
    const idx = RANGE_ORDER.indexOf(range)
    if (idx < RANGE_ORDER.length - 1) setRange(RANGE_ORDER[idx + 1])
  }

  // Group tasks by completed date, preserving the completed_at desc order from the API.
  const groups: { key: string; label: string; tasks: Task[] }[] = []
  for (const task of tasks) {
    const completedAt = task.completed_at ?? task.updated_at
    const key = new Date(completedAt).toDateString()
    let group = groups.find((g) => g.key === key)
    if (!group) {
      group = { key, label: dateGroupLabel(completedAt), tasks: [] }
      groups.push(group)
    }
    group.tasks.push(task)
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 p-8 dark:from-slate-900 dark:to-slate-800 sm:flex-row">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Look how far you've come!
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Every completed task is progress. Here's a record of everything you've finished, worth celebrating.
          </p>
        </div>
        <div className="h-24 w-24 shrink-0 rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-white/10">
          <HistoryIllustration />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {RANGE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setRange(tab.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  range === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search completed tasks..."
              className="w-full rounded-full border-none bg-slate-100 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              category === 'all'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All
          </button>
          {CATEGORY_ORDER.map((c) => {
            const meta = CATEGORY_META[c]
            const active = category === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  active ? meta.pillClass : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {meta.icon} {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-700">
              No completed tasks in this range yet.
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {group.label === 'Today' || group.label === 'Yesterday'
                        ? formatDate(group.tasks[0].completed_at ?? group.tasks[0].updated_at)
                        : group.label}
                    </h3>
                    {(group.label === 'Today' || group.label === 'Yesterday') && (
                      <span className="text-xs font-bold uppercase tracking-wide text-blue-600">{group.label}</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.tasks.map((task) => {
                      const categoryMeta = CATEGORY_META[task.category]
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40">
                            ✓
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-slate-700 line-through dark:text-slate-300">
                              {task.title}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${categoryMeta.pillClass}`}>
                                {categoryMeta.icon} {categoryMeta.label}
                              </span>
                              <span>
                                Completed {formatRelativeTime(task.completed_at ?? task.updated_at)}
                              </span>
                              {task.due_at && <span>Due {formatShortDate(task.due_at)}</span>}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleReopen(task)}
                            className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Reopen
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {range !== 'all' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleLoadOlder}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Load older tasks
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Stats</h2>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Completed this week
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.completed_this_week ?? '—'}</p>
              {stats && (
                <p className="text-xs font-medium text-blue-600">
                  {stats.completed_this_week_delta >= 0 ? '+' : ''}
                  {stats.completed_this_week_delta} from last week
                </p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Completed this month
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.completed_this_month ?? '—'}</p>
              {stats && <Sparkline values={stats.completed_last_8_weeks} />}
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total Completed
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                🏆 {stats?.total_completed ?? '—'}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center dark:border-slate-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Daily Goal
              </p>
              <ProgressRing percent={stats?.daily_goal_percent ?? 0} />
              <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">"{MOTIVATIONAL_QUOTE}"</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
