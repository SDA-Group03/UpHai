import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Hero } from '../components/Hero'
import {
  fetchProfile,
  getAccessToken,
  logout,
  refreshAccessToken,
} from '../services/authService'

type Status = 'idle' | 'loading' | 'error' | 'success'

export function Home() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ id: number; username: string } | null>(null)

  const loadProfile = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      const data = await fetchProfile()
      setProfile(data)
      setStatus('success')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unauthorized')
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      await refreshAccessToken()
      setStatus('success')
      setMessage('Access token refreshed')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Refresh failed')
    }
  }

  const handleLogout = async () => {
    setStatus('loading')
    setMessage(null)
    try {
      await logout()
      setStatus('success')
      setMessage('Logged out')
      navigate('/login', { replace: true })
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Logout failed')
    }
  }

  return (
    <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
      <Hero />
      <section className="relative animate-fade-up-delayed">
        <div className="absolute -inset-6 bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-cyan-500/20 blur-2xl" />
        <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-semibold">Session overview</h2>
          <p className="text-xs text-slate-400 mt-2">
            Access token is stored locally. Refresh token lives in httpOnly cookie.
          </p>

          <div className="mt-6 grid gap-2 text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Access token</span>
              <span className="text-slate-200">{getAccessToken() ? 'Active' : 'Missing'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>User</span>
              <span className="text-slate-200">{profile ? profile.username : '-'}</span>
            </div>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-xl px-4 py-2 text-xs ${
                status === 'error'
                  ? 'bg-rose-500/20 text-rose-200'
                  : 'bg-emerald-500/20 text-emerald-200'
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={loadProfile}
              className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500 transition disabled:opacity-60"
              disabled={status === 'loading'}
            >
              Fetch Profile
            </button>
            <button
              onClick={handleRefresh}
              className="rounded-xl border border-slate-700 px-3 py-2 text-slate-200 hover:border-slate-500 transition disabled:opacity-60"
              disabled={status === 'loading'}
            >
              Refresh Token
            </button>
            <button
              onClick={handleLogout}
              className="col-span-2 rounded-xl bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700 transition disabled:opacity-60"
              disabled={status === 'loading'}
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
