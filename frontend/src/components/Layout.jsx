import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Bug, BookOpen, PlusCircle, Zap, Activity } from 'lucide-react'

const navItems = [
  { to: '/', icon: Bug, label: 'Analyze', exact: true },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
  { to: '/ingest', icon: PlusCircle, label: 'Add Issue' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-border bg-surface flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Zap size={16} className="text-accent" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-white">DebugAI</p>
              <p className="text-[10px] text-muted font-mono">v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
            <span className="text-xs text-muted font-mono">LangGraph + Groq + Qdrant</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-text hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon size={15} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-[10px] text-muted font-mono leading-relaxed">
            Powered by LangChain · LangGraph<br />
            Groq LLaMA 3.3 · Qdrant
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-base bg-grid">
        <Outlet />
      </main>
    </div>
  )
}
