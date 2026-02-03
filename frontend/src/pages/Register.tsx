import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { register } from '../services/authService'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function Register() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setMessage(null)
    const form = new FormData(event.currentTarget)
    const username = String(form.get('username') ?? '').trim()
    const password = String(form.get('password') ?? '')

    try {
      await register({ username, password })
      setStatus('success')
      setMessage('Account created successfully! You can now login.')
      // Redirect to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Registration failed')
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
      <Hero />
      <section className="relative animate-fade-up-delayed">
        <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-cyan-500/20 blur-2xl" />
        <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-semibold">Create Account</h2>
          <p className="text-xs text-slate-400 mt-2">
            Join UpHai Flow and start building.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              Username
              <input
                name="username"
                required
                minLength={3}
                maxLength={64}
                className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="yourname"
                disabled={status === 'loading' || status === 'success'}
              />
            </label>
            <label className="block text-sm text-slate-300">
              Password
              <input
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
                disabled={status === 'loading' || status === 'success'}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/25 disabled:opacity-60"
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 rounded-xl px-4 py-2 text-xs ${
              status === 'success' 
                ? 'bg-green-500/20 text-green-200' 
                : 'bg-rose-500/20 text-rose-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}