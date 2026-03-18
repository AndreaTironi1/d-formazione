import { NavLink, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  Briefcase,
  BookOpen,
  ClipboardList,
  Upload,
} from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/coe', label: 'CoE', icon: Building2 },
  { to: '/sedi', label: 'Sedi', icon: MapPin },
  { to: '/dipendenti', label: 'Dipendenti', icon: Users },
  { to: '/servizi', label: 'Servizi', icon: Briefcase },
  { to: '/corsi', label: 'Corsi', icon: BookOpen },
  { to: '/iscrizioni', label: 'Iscrizioni', icon: ClipboardList },
  { to: '/importa', label: 'Importa dati', icon: Upload },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Piano Formazione</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dasein</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  )}
                />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Version + User */}
        <div className="px-4 py-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">v0.3.2</span>
            <span className="text-xs text-slate-400">2026-03-18</span>
          </div>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-slate-600 truncate">Account</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
