import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Hero } from '../components/Hero'
import {
  clearAccessToken,
  getAccessToken,
  login,
  refreshAccessToken,
} from '../services/authService'

type Status = 'idle' | 'loading' | 'error'

export function Login() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      if (!getAccessToken()) return
      try {
        await refreshAccessToken()
        if (active) navigate('/', { replace: true })
      } catch {
        clearAccessToken()
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    console.log('Login submit')
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')

    try {
      await login({ username, password })
      navigate('/', { replace: true })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
      <Hero />
      <section className="relative animate-fade-up-delayed">
        <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-cyan-500/20 blur-2xl" />
        <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="text-xs text-slate-400 mt-2">
            Sign in to continue building with UpHai Flow.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              Username
              <input
                name="username"
                required
                minLength={3}
                className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="yourname"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-60"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Signing in...' : 'Login'}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-xl px-4 py-2 text-xs bg-rose-500/20 text-rose-200">
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
