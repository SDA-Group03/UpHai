import React, { useState, useEffect } from 'react';
import { ChevronDown, Sparkles, Layers, Terminal, Key, BookOpen } from 'lucide-react';

export default function HomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background decorative crosshairs */}
      <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0" />
      <div className="absolute top-1/4 left-1/4 w-32 h-px bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0" />
      <div className="absolute top-1/2 right-1/4 w-px h-40 bg-gradient-to-b from-purple-500/0 via-purple-500/50 to-purple-500/0" />
      <div className="absolute top-1/2 right-1/4 w-40 h-px bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0" />
      <div className="absolute bottom-1/3 left-1/3 w-px h-24 bg-gradient-to-b from-violet-500/0 via-violet-500/40 to-violet-500/0" />
      <div className="absolute bottom-1/3 left-1/3 w-24 h-px bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-violet-500/0" />

      {/* Purple glow effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 blur-[80px] rounded-full" />
      <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-purple-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-violet-500/10 blur-[80px] rounded-full" />

      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950 opacity-50" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-purple-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-wider">UpHai</span>
            <span className="text-xs text-gray-500 ml-2 tracking-widest uppercase">Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <a href="#models" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
            <Layers className="w-4 h-4" />
            Models
          </a>
          <a href="#playground" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
            <Terminal className="w-4 h-4" />
            Playground
          </a>
          <a href="#api-keys" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
            <Key className="w-4 h-4" />
            API Keys
          </a>
          <a href="#docs" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
            <BookOpen className="w-4 h-4" />
            Docs
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors font-medium">
            Login
          </button>
          <button className="px-6 py-2.5 bg-white text-black rounded-md hover:bg-gray-200 transition-colors font-semibold">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-88px)] px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/5 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300 tracking-wider uppercase font-medium">Model-as-a-Service</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-7xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tight leading-[0.95] pb-4">
            Deploy AI models
            <br />
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              in just a few clicks
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Scale seamlessly with our end-to-end infrastructure service, or deploy
            powerful, production-ready AI models in minutes.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <button className="px-8 py-3.5 bg-white text-black rounded-md hover:bg-gray-200 transition-all font-semibold shadow-lg shadow-white/10 hover:shadow-white/20">
              Deploy a model
            </button>
            <button className="px-8 py-3.5 bg-transparent border border-gray-700 text-white rounded-md hover:border-gray-500 hover:bg-gray-900/50 transition-all font-semibold">
              View playground
            </button>
          </div>

          {/* Model Types Pills */}
          <div className="flex items-center justify-center gap-3 pt-12 flex-wrap">
            {[
              { name: 'Chat', color: 'from-blue-500 to-cyan-500' },
              { name: 'Vision', color: 'from-purple-500 to-pink-500' },
              { name: 'Voice', color: 'from-green-500 to-emerald-500' },
              { name: 'Image', color: 'from-orange-500 to-red-500' },
              { name: 'Container', color: 'from-indigo-500 to-violet-500' }
            ].map((model, idx) => (
              <div
                key={idx}
                className="group relative px-5 py-2.5 rounded-full border border-gray-800 bg-gray-900/30 hover:border-gray-700 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${model.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <span className="relative text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {model.name}
                </span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-8 max-w-3xl mx-auto pt-16 border-t border-gray-900">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">50+</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Models</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">&lt;30s</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Deploy Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">10M+</div>
              <div className="text-sm text-gray-500 uppercase tracking-wider">API Calls</div>
            </div>
          </div>
        </div>
      </main>

      {/* Tech Stack Footer */}
      <div className="relative z-10 border-t border-gray-900 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600 uppercase tracking-widest">Powered by</div>
            <div className="flex items-center gap-8">
              {[
                { name: 'React + Vite', icon: '⚛️' },
                { name: 'Bun', icon: '🥟' },
                { name: 'ElysiaJS', icon: '🦋' },
                { name: 'Docker', icon: '🐳' }
              ].map((tech, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors cursor-default">
                  <span className="text-lg">{tech.icon}</span>
                  <span className="text-sm font-medium">{tech.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
}