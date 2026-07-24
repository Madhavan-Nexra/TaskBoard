import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (!data.session) {
      // Email confirmation is required before a session is issued.
      setCheckEmail(true)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-2xl font-bold text-blue-600">
            <span aria-hidden="true">✅</span> TaskBuddy
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create an account to start your mission board.</p>
        </div>

        {checkEmail ? (
          <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Check your email to confirm your account before signing in.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
