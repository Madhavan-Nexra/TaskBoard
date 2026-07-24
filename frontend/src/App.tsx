import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import DueSoonToasts from './components/DueSoonToasts'
import Login from './pages/Login'
import Signup from './pages/Signup'
import TaskBoard from './pages/TaskBoard'
import TaskForm from './pages/TaskForm'
import History from './pages/History'
import Settings from './pages/Settings'
import { getSettings } from './lib/api'
import { applyTheme, getStoredTheme } from './lib/theme'

export interface LayoutContext {
  search: string
  setSearch: (value: string) => void
}

/** Shared chrome for all authenticated pages: the sticky Navbar + routed content.
 * Owns the "Quick find" search box state, which only TaskBoard/History consume.
 * The same state is exposed via outlet context so History's own filter-bar search
 * input (per DESIGN_SPEC) stays in sync with the navbar's quick-find box. */
function AppLayout() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const showSearch = location.pathname === '/' || location.pathname === '/history'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar searchValue={search} onSearchChange={setSearch} showSearch={showSearch} />
      <Outlet context={{ search, setSearch } satisfies LayoutContext} />
    </div>
  )
}

function ThemeSync() {
  const { session } = useAuth()

  // index.html already applied the localStorage value synchronously pre-paint;
  // here we reconcile it against the server-side setting once auth resolves.
  useEffect(() => {
    if (!session) return
    let cancelled = false
    getSettings()
      .then((settings) => {
        if (!cancelled) applyTheme(settings.theme)
      })
      .catch(() => {
        const stored = getStoredTheme()
        if (stored) applyTheme(stored)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  return null
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<TaskBoard />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tasks/new" element={<TaskForm />} />
        <Route path="/tasks/:id/edit" element={<TaskForm />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeSync />
        <DueSoonToasts />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
