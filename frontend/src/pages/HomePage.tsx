import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Cpu, Zap, ArrowRight, Layers, Command, User, LogOut } from 'lucide-react';
import { useCurrentUser } from '../services/authService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HomePage() {
  const location = useLocation();
  const Navigate = useNavigate();
  const { user, handleLogout } = useCurrentUser();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-indigo-500/30">
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Radial Gradient for Hero Glow */}
      <div className="fixed left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-50 text-neutral-950">
              <Layers size={18} strokeWidth={3} />
            </div>
            <span>UpHai</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
            <Link to="/models" className="hover:text-neutral-50 transition-colors">Models</Link>
            <a href="#playground" className="hover:text-neutral-50 transition-colors">Playground</a>
            <a href="#api_key" className="hover:text-neutral-50 transition-colors">API Key</a>

            <a href="#docs" className="hover:text-neutral-50 transition-colors">Docs</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="hidden sm:flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer">
                    <User size={20} />
                    <span className="text-sm font-medium text-neutral-200">{user.username}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-neutral-950 border-neutral-800 text-neutral-200">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 focus:bg-neutral-900 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
            <button
              onClick={() => Navigate('/login', { state: { from: location } })}
            className="h-9 px-4 bg-neutral-50 text-neutral-950 rounded font-medium text-sm hover:bg-neutral-200 transition-colors">
              Log in
            </button>
              
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 px-6 text-center">
        
        {/* Badge */}
        <div className="mb-8 inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-300 backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
          v1.0 Now Public Beta
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl mb-6">
          Deploy Private AI <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300">
            No GPU Required.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="max-w-2xl text-lg text-neutral-400 mb-10 leading-relaxed">
          The lightweight orchestration layer for LLMs, Vision, and Audio models. 
          Run advanced AI containers on standard CPUs with zero latency overhead.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button 
            onClick={() => Navigate('/models')}
            className="h-12 px-8 bg-neutral-50 text-neutral-950 rounded-md font-semibold text-base hover:bg-neutral-200 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Start Deploying <ArrowRight size={18} />
          </button>
          <button className="h-12 px-8 border border-neutral-700 text-neutral-300 rounded-md font-medium text-base hover:bg-neutral-900 transition-all flex items-center gap-2 w-full sm:w-auto justify-center">
            <Terminal size={18} /> View Documentation
          </button>
        </div>

        {/* Tech Stack Strip */}
        <div className="mt-20 pt-10 border-t border-neutral-900 w-full max-w-5xl">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-6 font-semibold">
            Powered by modern infrastructure
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-60 hover:opacity-100 transition-opacity">
            {['Bun Runtime', 'ElysiaJS', 'Docker Engine', 'Ollama', 'React 19'].map((tech) => (
              <span key={tech} className="text-sm font-semibold text-neutral-400 flex items-center gap-2">
                <Command size={14} /> {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Features / Value Prop */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Cpu className="text-indigo-400" />,
              title: "On-Demand Compute",
              desc: "Containers sleep when idle and wake instantly. Optimized for cost-effective CPU environments."
            },
            {
              icon: <Layers className="text-purple-400" />,
              title: "Multi-Modal Ready",
              desc: "Orchestrate Chat, Vision, and Voice models seamlessly in a single unified API pipeline."
            },
            {
              icon: <Zap className="text-amber-400" />,
              title: "Lightning Backend",
              desc: "Built on Bun and ElysiaJS for sub-millisecond overhead and maximum throughput."
            }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 hover:border-neutral-700 transition-all">
              <div className="mb-4 inline-flex p-3 rounded-lg bg-neutral-800/50 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2 text-neutral-100">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-900 py-12 text-center text-sm text-neutral-600">
        <p>&copy; 2026 UpHai Platform. Engineering Project.</p>
      </footer>
    </div>
  );
}