export function Hero() {
  return (
    <section className="space-y-6 animate-fade-up">
      <p className="text-slate-400 uppercase tracking-[0.35em] text-xs">One Platform</p>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight">
        All your AI
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-400">
          inference needs
        </span>
      </h1>
      <p className="text-slate-300 max-w-xl leading-relaxed">
        Secure sign-in with refresh tokens, fast access, and a clear workflow for building
        protected experiences on top of your UpHai stack.
      </p>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/30">
          Get started for free
        </button>
        <button className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 transition">
          Contact sales
        </button>
      </div>
      <div className="flex gap-6 text-xs text-slate-400">
        <span>Refresh token rotation</span>
        <span>Access token guard</span>
        <span>Cookie-based auth</span>
      </div>
    </section>
  )
}
