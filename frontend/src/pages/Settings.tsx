import { useEffect, useState } from 'react'
import ToggleSwitch from '../components/ToggleSwitch'
import { getSettings, updateSettings } from '../lib/api'
import { applyTheme } from '../lib/theme'
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../lib/notifications'
import { SettingsIllustration } from '../components/illustrations'
import type { Settings as SettingsType } from '../types'

const THEME_PREVIEW_CHIPS = ['bg-blue-600', 'bg-slate-800', 'bg-emerald-500', 'bg-amber-500']

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((res) => {
        if (!cancelled) setSettings(res)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load settings.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function persist(partial: Partial<SettingsType>) {
    if (!settings) return
    const optimistic = { ...settings, ...partial }
    setSettings(optimistic)
    try {
      const saved = await updateSettings(partial)
      setSettings(saved)
    } catch (err) {
      setSettings(settings)
      setError(err instanceof Error ? err.message : 'Failed to save settings.')
    }
  }

  function handleThemeChange(theme: 'light' | 'dark') {
    applyTheme(theme)
    persist({ theme })
  }

  async function handleEnableBrowserNotifications() {
    const permission = await requestNotificationPermission()
    setNotifPermission(permission)
  }

  if (loading || !settings) {
    return (
      <main className="mx-auto flex max-w-7xl justify-center px-4 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col items-center gap-6 sm:flex-row">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            Shape TaskBuddy to match your journey.
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Adjust theme, notifications, and preferences so your board feels just right for you.
          </p>
        </div>
        <div className="h-24 w-24 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 p-2 dark:from-slate-900 dark:to-slate-800">
          <SettingsIllustration />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Mode</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-1 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  settings.theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                ☀️ Light
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  settings.theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Theme Preview
            </p>
            <div className="flex gap-2">
              {THEME_PREVIEW_CHIPS.map((chip) => (
                <span key={chip} className={`h-8 w-8 rounded-full ${chip}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 font-semibold text-slate-800 dark:text-slate-100">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable reminders</span>
              <ToggleSwitch
                id="enable-reminders"
                checked={settings.enable_reminders}
                onChange={(value) => persist({ enable_reminders: value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Browser pop-up notifications
                </span>
                <span className="block text-xs text-slate-400">
                  Real OS-level alerts (like WhatsApp) when a task is due soon.
                </span>
              </div>
              {notifPermission === 'unsupported' && (
                <span className="text-xs text-slate-400">Not supported</span>
              )}
              {notifPermission === 'granted' && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ Enabled</span>
              )}
              {notifPermission === 'denied' && (
                <span className="text-xs font-medium text-red-500">
                  Blocked — enable in browser site settings
                </span>
              )}
              {notifPermission === 'default' && (
                <button
                  type="button"
                  onClick={handleEnableBrowserNotifications}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Enable
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Highlight overdue tasks</span>
              <ToggleSwitch
                id="highlight-overdue"
                checked={settings.highlight_overdue}
                onChange={(value) => persist({ highlight_overdue: value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sound on</span>
              <ToggleSwitch
                id="sound-on"
                checked={settings.sound_on}
                onChange={(value) => persist({ sound_on: value })}
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <div>
                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Daily goal</span>
                <span className="block text-xs text-slate-400">Tasks/day target for your History progress ring.</span>
              </div>
              <input
                type="number"
                min={1}
                max={50}
                value={settings.daily_goal}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (!Number.isNaN(value) && value > 0) persist({ daily_goal: value })
                }}
                className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
