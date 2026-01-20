import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" className="hover:scale-110 transition-transform">
          <img 
            src={viteLogo} 
            className="h-24 w-24 hover:drop-shadow-[0_0_2em_#646cffaa]" 
            alt="Vite logo" 
          />
        </a>
        <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform">
          <img 
            src={reactLogo} 
            className="h-24 w-24 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-[spin_20s_linear_infinite]" 
            alt="React logo" 
          />
        </a>
      </div>

      <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
        Vite + React
      </h1>

      <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl text-center max-w-md w-full">
        <button 
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-2 bg-slate-900 border border-slate-600 rounded-lg hover:border-cyan-500 hover:text-cyan-400 transition-colors font-semibold mb-4"
        >
          count is {count}
        </button>
        
        <p className="text-slate-400">
          Edit <code className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-200 font-mono text-sm">src/App.tsx</code> and save to test HMR
        </p>
      </div>

      <p className="mt-8 text-slate-500 text-sm">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App