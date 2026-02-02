import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-display">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(76,120,255,0.35),transparent_50%),radial-gradient(circle_at_75%_10%,rgba(147,51,234,0.35),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.25),transparent_55%)]" />
        <div className="relative">
          <TopBar />
          <div className="max-w-6xl mx-auto px-6 pb-16 pt-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
