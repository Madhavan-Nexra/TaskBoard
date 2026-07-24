import { useState } from 'react'
import type { Task } from '../types'
import { CATEGORY_META, PRIORITY_META } from '../lib/badges'
import { formatShortDate, isOverdue, timeRemainingLabel } from '../lib/format'

interface TaskCardProps {
  task: Task
  userInitial: string
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onComplete: (task: Task) => void
  onReopen: (task: Task) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, task: Task) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
}

export default function TaskCard({
  task,
  userInitial,
  onEdit,
  onDelete,
  onComplete,
  onReopen,
  draggable = true,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const priority = PRIORITY_META[task.priority]
  const category = CATEGORY_META[task.category]
  const overdue = isOverdue(task.due_at, task.status)
  const isDone = task.status === 'done'

  function openEdit() {
    onEdit(task)
  }

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={onDragEnd}
      onClick={openEdit}
      className={`cursor-pointer rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 ${priority.borderClass} dark:bg-slate-900`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priority.pillClass}`}>
            {priority.label}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${category.pillClass}`}>
            {category.icon} {category.label}
          </span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="cursor-grab rounded px-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Task menu"
          >
            ⋮⋮
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    openEdit()
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Edit
                </button>
                {!isDone ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onComplete(task)
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Mark complete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onReopen(task)
                    }}
                    className="block w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Reopen
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete(task)
                  }}
                  className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3
        className={`font-semibold text-slate-900 dark:text-white ${
          isDone ? 'text-slate-400 line-through dark:text-slate-500' : ''
        }`}
      >
        {isDone && <span className="mr-1 text-emerald-500">✓</span>}
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>
      )}

      {task.status === 'doing' && task.progress != null && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${Math.max(0, Math.min(100, task.progress))}%` }}
            />
          </div>
          {task.due_at && (
            <p className="mt-1 text-[11px] font-medium text-slate-400">{timeRemainingLabel(task.due_at)}</p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {task.due_at ? (
          <span className={`text-xs ${overdue ? 'font-semibold text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>
            📅 {formatShortDate(task.due_at)}
          </span>
        ) : (
          <span />
        )}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
          {userInitial}
        </span>
      </div>
    </div>
  )
}
