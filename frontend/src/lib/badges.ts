// Single shared source of truth for priority + category display (color, label, icon).
// Imported by TaskCard, TaskBoard, History, and TaskForm — do not duplicate this mapping.

import type { Category, Priority } from '../types'

export interface PriorityMeta {
  label: string
  pillClass: string // badge background + text color
  borderClass: string // left border color used on task cards
  dotClass: string // small solid dot color
  activeButtonClass: string // segmented control "selected" state
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  low: {
    label: 'Low',
    pillClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    borderClass: 'border-l-slate-400',
    dotClass: 'bg-slate-400',
    activeButtonClass: 'bg-slate-500 text-white border-slate-500',
  },
  medium: {
    label: 'Medium',
    pillClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    borderClass: 'border-l-blue-500',
    dotClass: 'bg-blue-500',
    activeButtonClass: 'bg-blue-600 text-white border-blue-600',
  },
  high: {
    label: 'High',
    pillClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    borderClass: 'border-l-red-500',
    dotClass: 'bg-red-500',
    activeButtonClass: 'bg-red-600 text-white border-red-600',
  },
}

export interface CategoryMeta {
  label: string
  pillClass: string
  activeButtonClass: string
  icon: string // emoji, keeps the app dependency-free
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  learning: {
    label: 'Learning',
    pillClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    activeButtonClass: 'bg-amber-600 text-white border-amber-600',
    icon: '📚',
  },
  work: {
    label: 'Work',
    pillClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    activeButtonClass: 'bg-blue-600 text-white border-blue-600',
    icon: '💼',
  },
  ai: {
    label: 'AI',
    pillClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    activeButtonClass: 'bg-violet-600 text-white border-violet-600',
    icon: '🤖',
  },
  rocket: {
    label: 'Rocket',
    pillClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    activeButtonClass: 'bg-orange-600 text-white border-orange-600',
    icon: '🚀',
  },
  personal: {
    label: 'Personal',
    pillClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    activeButtonClass: 'bg-teal-600 text-white border-teal-600',
    icon: '🌱',
  },
}

export const PRIORITY_ORDER: Priority[] = ['low', 'medium', 'high']
export const CATEGORY_ORDER: Category[] = ['learning', 'work', 'ai', 'rocket', 'personal']

export const STATUS_LABEL: Record<'todo' | 'doing' | 'done', string> = {
  todo: 'To-Do',
  doing: 'Doing',
  done: 'Done',
}
