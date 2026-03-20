import { useState } from 'react'
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
  Download,
  BarChart2,
  CalendarDays,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface NavSection {
  label: string
  items: { to: string; label: string; icon: React.ElementType }[]
}

const navSections: NavSection[] = [
  {
    label: 'Report',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/report', label: 'Report Dipendenti', icon: BarChart2 },
      { to: '/report-mensile', label: 'Report Mensile', icon: CalendarDays },
    ],
  },
  {
    label: 'Dati',
    items: [
      { to: '/coe', label: 'CoE', icon: Building2 },
      { to: '/sedi', label: 'Sedi', icon: MapPin },
      { to: '/dipendenti', label: 'Dipendenti', icon: Users },
      { to: '/servizi', label: 'Servizi', icon: Briefcase },
      { to: '/corsi', label: 'Corsi', icon: BookOpen },
      { to: '/iscrizioni', label: 'Iscrizioni', icon: ClipboardList },
    ],
  },
  {
    label: 'Utilità',
    items: [
      { to: '/importa', label: 'Importa dati', icon: Upload },
      { to: '/esporta', label: 'Esporta dati', icon: Download },
    ],
  },
]

interface LayoutProps {
  children: React.ReactNode
}

function NavSection({ section }: { section: NavSection }) {
  const location = useLocation()
  const isActive = section.items.some(i => location.pathname === i.to)
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5"
      >
        <span className={cn('text-xs font-semibold uppercase tracking-wider', isActive ? 'text-blue-600' : 'text-slate-400')}>
          {section.label}
        </span>
        <ChevronDown className={cn('w-3 h-3 text-slate-400 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && (
        <div className="space-y-0.5">
          {section.items.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-blue-600' : 'text-slate-400')} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm flex-shrink-0">
        <div className="px-6 py-5 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Piano Formazione</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dasein</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {navSections.map(s => <NavSection key={s.label} section={s} />)}
        </nav>

        <div className="px-4 py-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <NavLink
              to="/changelog"
              className={({ isActive }) =>
                `text-xs font-mono transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'}`
              }
            >
              v0.4.1
            </NavLink>
            <span className="text-xs text-slate-400">2026-03-20</span>
          </div>
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm text-slate-600 truncate">Account</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
