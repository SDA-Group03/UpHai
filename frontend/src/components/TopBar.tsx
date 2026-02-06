import { Link, useLocation } from 'react-router-dom'

export function TopBar() {
  const location = useLocation()
  
  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 text-center text-xs sm:text-sm py-2 font-semibold tracking-wide">
        MiniMax-M2.1 is available now — Try it today
      </div>
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-[0_0_18px_rgba(99,102,241,0.6)]" />
          </Link>
          <Link to="/" className="text-lg tracking-tight font-semibold">
            UpHai Flow
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-200">
          <Link 
            to="/" 
            className={`hover:text-white transition ${location.pathname === '/' ? 'text-white' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/models" 
            className={`hover:text-white transition ${location.pathname === '/models' ? 'text-white' : ''}`}
          >
            Models
          </Link>
          <a className="hover:text-white transition" href="#">
            Products
          </a>
          <a className="hover:text-white transition" href="#">
            Pricing
          </a>
          <a className="hover:text-white transition" href="#">
            Docs
          </a>
          <a className="hover:text-white transition" href="#">
            About
          </a>
        </nav>
        <button className="hidden md:inline-flex items-center gap-2 rounded-full bg-emerald-400 text-slate-900 px-5 py-2 text-sm font-semibold shadow-lg shadow-emerald-500/20">
          Get Started
          <span aria-hidden>→</span>
        </button>
      </header>
    </>
  )
}
