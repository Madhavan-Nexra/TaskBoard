import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationsPanel from './NotificationsPanel'

interface NavbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  showSearch?: boolean
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-blue-600 underline decoration-2 underline-offset-8'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
  }`

export default function Navbar({ searchValue, onSearchChange, showSearch = true }: NavbarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const initial = (user?.email ?? '?').charAt(0).toUpperCase()

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-blue-600">
          <span aria-hidden="true">✅</span>
          TaskBuddy
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Task Board
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            History
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            Settings
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {showSearch && (
            <div className="relative hidden sm:block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                🔍
              </span>
              <input
                type="search"
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Quick find..."
                className="w-48 rounded-full border-none bg-slate-100 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          <NotificationsPanel />

          <button
            type="button"
            onClick={() => navigate('/tasks/new')}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Add Task
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
            >
              {initial}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="truncate px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                    {user?.email}
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
