import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '../App'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'
import ToggleSwitch from '../components/ToggleSwitch'
import { useAuth } from '../context/AuthContext'
import {
  completeTask,
  deleteTask,
  getBoardStats,
  getRecentActivity,
  listTasks,
  reopenTask,
  updateTaskStatus,
} from '../lib/api'
import { ACTIVITY_META } from '../lib/activity'
import { BoardIllustration } from '../components/illustrations'
import { formatRelativeTime } from '../lib/format'
import type { ActivityLogEntry, BoardStats, Status, Task } from '../types'

const COLUMNS: { status: Status; title: string; dotClass: string; bgClass: string }[] = [
  { status: 'todo', title: 'To-Do', dotClass: 'bg-slate-400', bgClass: 'bg-slate-50 dark:bg-slate-900/40' },
  { status: 'doing', title: 'Doing', dotClass: 'bg-blue-500', bgClass: 'bg-rose-50/60 dark:bg-slate-900/40' },
  { status: 'done', title: 'Done', dotClass: 'bg-slate-800 dark:bg-slate-300', bgClass: 'bg-slate-50 dark:bg-slate-900/40' },
]

export default function TaskBoard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { search } = useOutletContext<LayoutContext>()

  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<BoardStats | null>(null)
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [highPriorityOnly, setHighPriorityOnly] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null)

  const userInitial = (user?.email ?? '?').charAt(0).toUpperCase()

  const refetchAll = useCallback(async () => {
    setError(null)
    try {
      const [tasksRes, statsRes, activityRes] = await Promise.all([
        listTasks(),
        getBoardStats(),
        getRecentActivity(10),
      ])
      setTasks(tasksRes)
      setStats(statsRes)
      setActivity(activityRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the board.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetchAll()
  }, [refetchAll])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (highPriorityOnly && task.priority !== 'high') return false
      if (hideCompleted && task.status === 'done') return false
      if (search.trim() && !task.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
  }, [tasks, highPriorityOnly, hideCompleted, search])

  const columnsData = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      tasks: filteredTasks.filter((t) => t.status === col.status),
    }))
  }, [filteredTasks])

  function handleEdit(task: Task) {
    navigate(`/tasks/${task.id}/edit`)
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    try {
      await deleteTask(task.id)
      await refetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task.')
    }
  }

  async function handleComplete(task: Task) {
    try {
      await completeTask(task.id)
      await refetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task.')
    }
  }

  async function handleReopen(task: Task) {
    try {
      await reopenTask(task.id)
      await refetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen task.')
    }
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, task: Task) {
    setDraggedTaskId(task.id)
    e.dataTransfer.setData('text/plain', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, status: Status) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    setDragOverStatus(null)
    setDraggedTaskId(null)
    if (!taskId) return
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === status) return

    // Optimistic update, rolled back on failure.
    const previousTasks = tasks
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)))
    try {
      await updateTaskStatus(taskId, status)
      await refetchAll()
    } catch (err) {
      setTasks(previousTasks)
      setError(err instanceof Error ? err.message : 'Failed to move task.')
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero banner */}
      <div className="mb-6 flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-8 dark:from-slate-900 dark:to-slate-800 sm:flex-row">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Welcome back, your tasks are ready
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Drag your missions from To-Do to Doing to Done and keep moving forward. Use TaskBuddy as your personal
            mission board for study, work, and future projects.
          </p>
        </div>
        <div className="h-28 w-28 shrink-0 rounded-2xl bg-white/70 p-2 shadow-sm dark:bg-white/10">
          <BoardIllustration />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Tasks" value={stats?.total_tasks ?? '—'} accentClass="text-blue-600" />
        <StatCard label="To-Do" value={stats?.todo ?? '—'} accentClass="text-blue-600" />
        <StatCard label="Doing" value={stats?.doing ?? '—'} accentClass="text-amber-600" />
        <StatCard label="Done" value={stats?.done ?? '—'} accentClass="text-emerald-600" />
        <StatCard label="Overdue" value={stats?.overdue ?? '—'} accentClass="text-red-600" />
      </div>

      {/* Toggles */}
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <ToggleSwitch
          id="high-priority-toggle"
          checked={highPriorityOnly}
          onChange={setHighPriorityOnly}
          label="Show only high priority"
        />
        <ToggleSwitch id="hide-completed-toggle" checked={hideCompleted} onChange={setHideCompleted} label="Hide completed" />
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {columnsData.map((col) => (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStatus(col.status)
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-xl p-4 transition ${col.bgClass} ${
                dragOverStatus === col.status ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${col.dotClass}`} />
                <h2 className="font-semibold text-slate-800 dark:text-slate-100">{col.title}</h2>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                  {col.tasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {col.tasks.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
                    No tasks here.
                  </p>
                )}
                {col.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    userInitial={userInitial}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                    onReopen={handleReopen}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activity.map((entry) => {
              const meta = ACTIVITY_META[entry.action]
              return (
                <li key={entry.id} className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${meta.iconClass}`}>
                    {meta.icon}
                  </span>
                  <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">You</span> {meta.verb}{' '}
                    <span className="font-medium text-blue-600">{entry.task_title}</span>
                    {entry.detail ? ` ${entry.detail}` : ''}
                  </p>
                  <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(entry.created_at)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
