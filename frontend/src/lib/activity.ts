// Shared activity-log presentation metadata, used by the task board's activity feed
// and the navbar notifications panel.

import type { ActivityAction } from '../types'

export const ACTIVITY_META: Record<ActivityAction, { icon: string; verb: string; iconClass: string }> = {
  created: { icon: '➕', verb: 'added', iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' },
  moved: { icon: '➜', verb: 'moved', iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' },
  completed: { icon: '✓', verb: 'completed', iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' },
  reopened: { icon: '↺', verb: 'reopened', iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' },
  updated: { icon: '✎', verb: 'updated', iconClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800' },
  deleted: { icon: '🗑', verb: 'deleted', iconClass: 'bg-slate-100 text-slate-500 dark:bg-slate-800' },
}
