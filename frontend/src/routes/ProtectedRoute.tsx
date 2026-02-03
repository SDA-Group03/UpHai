import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getAccessToken, refreshAccessToken } from '../services/authService'

type GateStatus = 'checking' | 'authorized' | 'unauthorized'

export function ProtectedRoute() {
  const [status, setStatus] = useState<GateStatus>('checking')

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      if (getAccessToken()) {
        if (active) setStatus('authorized')
        return
      }
      try {
        await refreshAccessToken()
        if (active) setStatus('authorized')
      } catch {
        if (active) setStatus('unauthorized')
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-300">
        Checking session...
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
