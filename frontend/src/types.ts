// Types mirroring API_CONTRACT.md exactly. Keep in sync with the backend.

export type Priority = 'low' | 'medium' | 'high'
export type Status = 'todo' | 'doing' | 'done'
export type Category = 'learning' | 'work' | 'ai' | 'rocket' | 'personal'

export interface Task {
  id: string // uuid
  title: string
  description: string | null
  priority: Priority
  status: Status
  category: Category
  due_at: string | null // ISO 8601 datetime, nullable
  progress: number | null // 0-100, only meaningful for "doing" tasks
  completed_at: string | null // ISO 8601 datetime, set when status becomes "done"
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string | null
  priority?: Priority
  category?: Category
  due_at?: string | null
  progress?: number | null
  status?: Status
}

export interface TaskUpdate {
  title?: string
  description?: string | null
  priority?: Priority
  category?: Category
  due_at?: string | null
  progress?: number | null
  status?: Status
}

export interface Settings {
  theme: 'light' | 'dark'
  enable_reminders: boolean
  highlight_overdue: boolean
  sound_on: boolean
  daily_goal: number // tasks/day target used for the "Daily Goal" ring
}

export type SettingsUpdate = Partial<Settings>

export type ActivityAction = 'created' | 'moved' | 'completed' | 'reopened' | 'updated' | 'deleted'

export interface ActivityLogEntry {
  id: string
  action: ActivityAction
  task_title: string
  detail: string | null // e.g. "to Doing"
  created_at: string
}

export interface BoardStats {
  total_tasks: number
  todo: number
  doing: number
  done: number
  overdue: number
}

export interface HistoryStats {
  completed_this_week: number
  completed_this_week_delta: number // vs previous 7-day window
  completed_this_month: number
  completed_last_8_weeks: number[] // for the small sparkline bars, oldest->newest
  total_completed: number
  daily_goal_percent: number // min(100, round(completed_today / settings.daily_goal * 100))
}

export type HistoryRange = 'today' | 'week' | 'month' | 'all'

export interface HealthResponse {
  status: string
}
