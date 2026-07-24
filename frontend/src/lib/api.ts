import { supabase } from './supabaseClient'
import type {
  ActivityLogEntry,
  BoardStats,
  Category,
  HistoryRange,
  HistoryStats,
  Settings,
  SettingsUpdate,
  Status,
  Task,
  TaskCreate,
  TaskUpdate,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface ErrorBody {
  detail?: string
}

async function handleUnauthorized() {
  try {
    await supabase.auth.signOut()
  } finally {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    await handleUnauthorized()
    throw new Error('Not authenticated')
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = (await response.json()) as ErrorBody
      if (body?.detail) message = body.detail
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

// ---------- Tasks ----------

export function listTasks(filters: { status?: Status; category?: Category; search?: string } = {}) {
  return request<Task[]>(`/tasks${buildQuery(filters)}`)
}

export function createTask(data: TaskCreate) {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getTask(taskId: string) {
  return request<Task>(`/tasks/${taskId}`)
}

export function updateTask(taskId: string, data: TaskUpdate) {
  return request<Task>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function updateTaskStatus(taskId: string, status: Status) {
  return request<Task>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function completeTask(taskId: string) {
  return request<Task>(`/tasks/${taskId}/complete`, { method: 'POST' })
}

export function reopenTask(taskId: string) {
  return request<Task>(`/tasks/${taskId}/reopen`, { method: 'POST' })
}

export function deleteTask(taskId: string) {
  return request<void>(`/tasks/${taskId}`, { method: 'DELETE' })
}

// ---------- Stats ----------

export function getBoardStats() {
  return request<BoardStats>('/stats/board')
}

export function getHistoryStats() {
  return request<HistoryStats>('/stats/history')
}

// ---------- History ----------

export function getHistory(filters: { range?: HistoryRange; category?: Category; search?: string } = {}) {
  return request<Task[]>(`/history${buildQuery(filters)}`)
}

// ---------- Activity ----------

export function getRecentActivity(limit = 10) {
  return request<ActivityLogEntry[]>(`/activity/recent${buildQuery({ limit })}`)
}

// ---------- Settings ----------

export function getSettings() {
  return request<Settings>('/settings')
}

export function updateSettings(data: SettingsUpdate) {
  return request<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
