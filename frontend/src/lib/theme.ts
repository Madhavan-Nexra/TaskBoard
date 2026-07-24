export const THEME_STORAGE_KEY = 'taskbuddy-theme'

export type ThemeName = 'light' | 'dark'

export function applyTheme(theme: ThemeName) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable (private mode, etc.) — non-fatal.
  }
}

export function getStoredTheme(): ThemeName | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}
