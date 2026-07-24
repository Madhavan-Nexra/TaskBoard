import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TaskCard from '../components/TaskCard'
import { useAuth } from '../context/AuthContext'
import { createTask, getTask, updateTask } from '../lib/api'
import { CATEGORY_META, CATEGORY_ORDER, PRIORITY_META, PRIORITY_ORDER, STATUS_LABEL } from '../lib/badges'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '../lib/format'
import { FocusIllustration } from '../components/illustrations'
import type { Category, Priority, Status, Task } from '../types'

const STATUS_ORDER: Status[] = ['todo', 'doing', 'done']

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'medium' as Priority,
  status: 'todo' as Status,
  category: 'work' as Category,
  dueAt: '',
  progress: 0,
}

const CATEGORY_TIPS: Record<Category, string> = {
  learning: 'Learning missions are best tackled in short, focused sessions — pair this with a due date to build momentum.',
  work: 'Work missions benefit from a clear priority so your team knows what to expect and by when.',
  ai: 'AI missions move fast — keep progress updated as you experiment so your board stays honest.',
  rocket: 'Rocket missions are your moonshots. Break them down into smaller Doing tasks as you go.',
  personal: 'Personal missions matter too — schedule them like you would any other commitment.',
}

export default function TaskForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    getTask(id)
      .then((task) => {
        if (cancelled) return
        setForm({
          title: task.title,
          description: task.description ?? '',
          priority: task.priority,
          status: task.status,
          category: task.category,
          dueAt: toDatetimeLocalValue(task.due_at),
          progress: task.progress ?? 0,
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load task.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const previewTask: Task = useMemo(
    () => ({
      id: id ?? 'preview',
      title: form.title.trim() || 'Untitled mission',
      description: form.description || null,
      priority: form.priority,
      status: form.status,
      category: form.category,
      due_at: fromDatetimeLocalValue(form.dueAt),
      progress: form.status === 'doing' ? form.progress : null,
      completed_at: form.status === 'done' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [form, id]
  )

  const userInitial = (user?.email ?? '?').charAt(0).toUpperCase()

  function handleDiscard() {
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Mission title is required.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      priority: form.priority,
      status: form.status,
      category: form.category,
      due_at: fromDatetimeLocalValue(form.dueAt),
      progress: form.status === 'doing' ? form.progress : null,
    }
    try {
      if (isEdit && id) {
        await updateTask(id, payload)
      } else {
        await createTask(payload)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex max-w-7xl justify-center px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Mission Planning</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Define your goals and structure your focus for the day.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Task Basics</h2>

            <div className="mb-4">
              <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Mission Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Finish the onboarding flow"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Add any useful context for this mission…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Priority</p>
              <div className="flex gap-2">
                {PRIORITY_ORDER.map((p) => {
                  const meta = PRIORITY_META[p]
                  const active = form.priority === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? meta.activeButtonClass
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mb-5">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Status</p>
              <div className="flex gap-2">
                {STATUS_ORDER.map((s) => {
                  const active = form.status === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  )
                })}
              </div>
            </div>

            {form.status === 'doing' && (
              <div className="mb-5">
                <label htmlFor="progress" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Progress ({form.progress}%)
                </label>
                <input
                  id="progress"
                  type="range"
                  min={0}
                  max={100}
                  value={form.progress}
                  onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
                  className="w-full accent-blue-600"
                />
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="due_at" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Schedule
              </label>
              <input
                id="due_at"
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((c) => {
                  const meta = CATEGORY_META[c]
                  const active = form.category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: c }))}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? meta.activeButtonClass
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      {meta.icon} {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              💾 {saving ? 'Saving…' : 'Save Mission'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Mission Preview</h2>
            <TaskCard
              task={previewTask}
              userInitial={userInitial}
              draggable={false}
              onEdit={() => {}}
              onDelete={() => {}}
              onComplete={() => {}}
              onReopen={() => {}}
            />
            <p className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              This task will appear in: <strong>{STATUS_LABEL[form.status]}</strong>
            </p>
            <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Pro tip: </span>
              {CATEGORY_TIPS[form.category]}
            </div>
            <button
              type="button"
              onClick={handleDiscard}
              className="mt-3 text-xs font-medium text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-200"
            >
              Discard Draft
            </button>
          </div>

          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
            <div className="h-24 w-full p-4">
              <FocusIllustration />
            </div>
            <div className="p-4 pt-0 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Inspiration</p>
              <p className="mt-1 text-sm font-medium italic">"Stay focused, stay buddy."</p>
            </div>
          </div>
        </div>
      </form>
    </main>
  )
}
