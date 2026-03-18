import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Building2, MapPin, Users, Briefcase, BookOpen, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'

interface StatCardProps {
  label: string
  count: number | undefined
  icon: React.ElementType
  to: string
  color: string
  bgColor: string
}

function StatCard({ label, count, icon: Icon, to, color, bgColor }: StatCardProps) {
  return (
    <Link to={to} className="card p-6 hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {count ?? <span className="text-slate-300">...</span>}
          </p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const coe = useQuery(api.coe.getAll)
  const coeWithResp = useQuery(api.coe.getAllWithResponsabili)
  const sedi = useQuery(api.sedi.getAll)
  const sediWithResp = useQuery(api.sedi.getAllWithResponsabili)
  const dipendenti = useQuery(api.dipendenti.getAll)
  const servizi = useQuery(api.servizi.getAll)
  const corsi = useQuery(api.corsi.getAll)
  const iscrizioni = useQuery(api.iscrizioni.getAll)

  const stats = [
    { label: 'CoE', count: coe?.length, icon: Building2, to: '/coe', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { label: 'Sedi', count: sedi?.length, icon: MapPin, to: '/sedi', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Dipendenti', count: dipendenti?.length, icon: Users, to: '/dipendenti', color: 'text-green-600', bgColor: 'bg-green-50' },
    { label: 'Servizi', count: servizi?.length, icon: Briefcase, to: '/servizi', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    { label: 'Corsi', count: corsi?.length, icon: BookOpen, to: '/corsi', color: 'text-rose-600', bgColor: 'bg-rose-50' },
    { label: 'Iscrizioni', count: iscrizioni?.length, icon: ClipboardList, to: '/iscrizioni', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Panoramica del piano formazione Dasein</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Responsabili widgets + charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responsabili CoE */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            Responsabili CoE
          </h2>
          {coeWithResp ? (
            <div className="space-y-2">
              {coeWithResp.map(c => (
                <div key={c._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{c.nome}</span>
                  <span className="text-sm text-slate-500">
                    {c.responsabile?.nome ?? <span className="italic text-slate-300">Non assegnato</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Caricamento...</div>
          )}
        </div>

        {/* Responsabili Sede */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            Responsabili Sede
          </h2>
          {sediWithResp ? (
            <div className="space-y-2">
              {sediWithResp.map(s => (
                <div key={s._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{s.areaGeografica}</span>
                  <span className="text-sm text-slate-500">
                    {s.responsabile?.nome ?? <span className="italic text-slate-300">Non assegnato</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Caricamento...</div>
          )}
        </div>

        {/* Corsi per priorità */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Corsi per priorità</h2>
          {corsi ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((p) => {
                const count = corsi.filter((c) => c.priorita === p).length
                const colors = ['bg-slate-400', 'bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']
                const labels = ['Bassa', 'Medio-bassa', 'Media', 'Medio-alta', 'Alta']
                return (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24">P{p} — {labels[p - 1]}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${colors[p - 1]} transition-all`} style={{ width: corsi.length ? `${(count / corsi.length) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Caricamento...</div>
          )}
        </div>

        {/* Dipendenti per ruolo */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Dipendenti per ruolo</h2>
          {dipendenti ? (
            <div className="space-y-2">
              {['Responsabile CoE', 'Responsabile Sede', 'Consulente', 'Operations'].map((ruolo) => {
                const count = dipendenti.filter((d) => d.ruolo === ruolo).length
                return (
                  <div key={ruolo} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{ruolo}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Caricamento...</div>
          )}
        </div>
      </div>
    </div>
  )
}
