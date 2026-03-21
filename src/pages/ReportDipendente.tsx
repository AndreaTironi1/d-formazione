import { useState, useMemo, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { cn } from '../lib/utils'
import { printElement } from '../utils/exportPdf'

// ── Types ────────────────────────────────────────────────────────────────────

type CoeMultiplo = {
  _id: string
  coe: { nome: string } | null
  percentuale?: number
}

type SedeMultipla = {
  _id: string
  sede: { areaGeografica: string } | null
  percentuale?: number
}

type Dipendente = {
  _id: Id<'dipendenti'>
  nome: string
  email?: string
  ruolo: string
  seniority?: string
  coe?: { nome: string } | null
  sede?: { areaGeografica: string } | null
  coeMultipli: CoeMultiplo[]
  sediMultiple: SedeMultipla[]
}

type Iscrizione = {
  _id: string
  dipendenteId: Id<'dipendenti'>
  corsoId: Id<'corsi'>
  dipendente?: { nome: string } | null
  corso?: {
    titolo: string
    destinatari?: string
    dataInizio?: string
    dataFine?: string
    oreAula?: number
    durataOre?: number
    priorita: number
  } | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [2026, 2027, 2028, 2029, 2030]

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-slate-400',
  2: 'bg-blue-500',
  3: 'bg-yellow-400',
  4: 'bg-orange-500',
  5: 'bg-red-600',
}

const PRIORITY_LABEL: Record<number, string> = {
  1: 'Bassa',
  2: 'Media',
  3: 'Alta',
  4: 'Urgente',
  5: 'Critica',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

function daysInYear(y: number): number {
  return isLeapYear(y) ? 366 : 365
}

/** Returns [leftPct, widthPct] for the Gantt bar, or null if out of range */
function getGanttBar(
  dataInizio: string,
  dataFine: string,
  year: number
): { left: number; width: number } | null {
  const yearStart = new Date(year, 0, 1).getTime()
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999).getTime()
  const total = daysInYear(year) * 24 * 60 * 60 * 1000

  const start = new Date(dataInizio).getTime()
  const end = new Date(dataFine).getTime()

  // Completely outside year
  if (end < yearStart || start > yearEnd) return null

  const clampedStart = Math.max(start, yearStart)
  const clampedEnd = Math.min(end, yearEnd)

  const left = ((clampedStart - yearStart) / total) * 100
  const width = ((clampedEnd - clampedStart) / total) * 100

  return { left: Math.max(0, left), width: Math.max(0.5, width) }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CoeBadges({ dip }: { dip: Dipendente }) {
  const list = dip.coeMultipli ?? []
  if (list.length > 0) {
    return (
      <div className="flex flex-wrap gap-1">
        {list.map((dc) => (
          <span
            key={dc._id}
            className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700"
          >
            {dc.coe?.nome ?? '—'}
            {dc.percentuale != null && dc.percentuale < 100 && (
              <span className="opacity-60 ml-1">{dc.percentuale}%</span>
            )}
          </span>
        ))}
      </div>
    )
  }
  if (dip.coe?.nome) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
        {dip.coe.nome}
      </span>
    )
  }
  return <span className="text-xs text-slate-400">—</span>
}

function SedeBadges({ dip }: { dip: Dipendente }) {
  const list = dip.sediMultiple ?? []
  if (list.length > 1) {
    return (
      <div className="flex flex-wrap gap-1">
        {list.map((ds) => (
          <span
            key={ds._id}
            className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
          >
            {ds.sede?.areaGeografica ?? '—'}
            {ds.percentuale != null && ds.percentuale < 100 && (
              <span className="opacity-60 ml-1">{ds.percentuale}%</span>
            )}
          </span>
        ))}
      </div>
    )
  }
  if (dip.sede?.areaGeografica) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        {dip.sede.areaGeografica}
      </span>
    )
  }
  return <span className="text-xs text-slate-400">—</span>
}

// Gantt row for a single corso — 2-row layout
function GanttRow({
  iscrizione,
  year,
}: {
  iscrizione: Iscrizione
  year: number
}) {
  const corso = iscrizione.corso
  if (!corso) return null

  const priorita = corso.priorita ?? 1
  const barColor = PRIORITY_COLORS[priorita] ?? 'bg-slate-400'
  const ore = corso.oreAula ?? corso.durataOre

  const bar =
    corso.dataInizio && corso.dataFine
      ? getGanttBar(corso.dataInizio, corso.dataFine, year)
      : null

  return (
    <div className="py-1.5 space-y-1">
      {/* Row 1: title + destinatari + priority + ore + dates */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-700 truncate max-w-xs" title={corso.titolo}>
          {corso.titolo}
        </span>

        {corso.destinatari && (
          <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 shrink-0">
            {corso.destinatari}
          </span>
        )}

        <span
          className={cn(
            'shrink-0 px-1.5 py-0.5 rounded text-xs font-medium text-white',
            barColor
          )}
          title={`Priorità ${priorita}: ${PRIORITY_LABEL[priorita] ?? ''}`}
        >
          P{priorita}
        </span>

        {ore != null && (
          <span className="text-xs text-slate-500 shrink-0">{ore}h</span>
        )}

        {corso.dataInizio && corso.dataFine && (
          <span className="text-xs text-slate-400 shrink-0">
            {formatDateShort(corso.dataInizio)} → {formatDateShort(corso.dataFine)}
          </span>
        )}
      </div>

      {/* Row 2: Gantt bar */}
      <div className="relative h-4 bg-slate-100 rounded overflow-hidden">
        {bar ? (
          <div
            className={cn('absolute top-0 h-full rounded opacity-80', barColor)}
            style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
            title={`${corso.dataInizio} → ${corso.dataFine}`}
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
            {corso.dataInizio ? 'fuori anno' : 'date non definite'}
          </span>
        )}
      </div>
    </div>
  )
}

// Months header for the Gantt
function GanttHeader() {
  return (
    <div className="flex mb-1">
      {MONTHS.map((m) => (
        <div key={m} className="flex-1 text-center text-xs text-slate-400 font-medium">
          {m}
        </div>
      ))}
    </div>
  )
}

// Card for a single dipendente
function DipCard({
  dip,
  iscrizioni,
  year,
}: {
  dip: Dipendente
  iscrizioni: Iscrizione[]
  year: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const myIscrizioni = iscrizioni.filter((i) => i.dipendenteId === dip._id)
  const totalOre = myIscrizioni.reduce((sum, i) => sum + (i.corso?.oreAula ?? i.corso?.durataOre ?? 0), 0)

  const handleExportPdf = () => {
    if (!cardRef.current) return
    printElement(cardRef.current, { orientation: 'landscape' })
  }

  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header dipendente */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-900 truncate">{dip.nome}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{dip.ruolo}</p>
          {dip.email && (
            <a
              href={`mailto:${dip.email}`}
              className="text-xs text-blue-600 hover:underline break-all"
            >
              {dip.email}
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 w-8">CoE</span>
            <CoeBadges dip={dip} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 w-8">Sede</span>
            <SedeBadges dip={dip} />
          </div>
          <button
            onClick={handleExportPdf}
            className="mt-1 text-xs text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg px-2 py-1 transition-colors"
          >
            Stampa / Salva PDF
          </button>
        </div>
      </div>

      {/* Statistiche */}
      <div className="flex gap-4">
        <div className="bg-slate-50 rounded-lg px-4 py-2 text-center">
          <p className="text-lg font-bold text-slate-900">{myIscrizioni.length}</p>
          <p className="text-xs text-slate-500">Corsi</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-4 py-2 text-center">
          <p className="text-lg font-bold text-slate-900">{totalOre}</p>
          <p className="text-xs text-slate-500">Ore totali</p>
        </div>
      </div>

      {/* Corsi */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Corsi iscritti ({myIscrizioni.length})
        </h3>

        {myIscrizioni.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Nessun corso iscritto.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <GanttHeader />
              <div className="divide-y divide-slate-100">
                {myIscrizioni.map((isc) => (
                  <GanttRow key={isc._id} iscrizione={isc} year={year} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ReportDipendente() {
  const dipendenti = useQuery(api.dipendenti.getAllWithRelations) as Dipendente[] | undefined
  const iscrizioni = useQuery(api.iscrizioni.getAllWithRelations) as Iscrizione[] | undefined

  const [year, setYear] = useState<number>(
    YEARS.includes(CURRENT_YEAR) ? CURRENT_YEAR : YEARS[1]
  )
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!dipendenti) return []
    const q = search.trim().toLowerCase()
    if (!q) return dipendenti
    return dipendenti.filter((d) => d.nome.toLowerCase().includes(q))
  }, [dipendenti, search])

  const isLoading = dipendenti === undefined || iscrizioni === undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Report Dipendenti</h1>
          <p className="text-slate-500 text-sm mt-1">
            Visualizza le iscrizioni ai corsi per dipendente con timeline Gantt.
          </p>
        </div>

        {/* Anno selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-sm font-medium text-slate-600" htmlFor="year-select">
            Anno
          </label>
          <select
            id="year-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-field w-28"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          className="input-field pl-9"
          placeholder="Cerca dipendente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400 py-12 justify-center">
          <svg
            className="animate-spin w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Caricamento...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {search ? 'Nessun dipendente corrisponde alla ricerca.' : 'Nessun dipendente trovato.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dip) => (
            <DipCard
              key={String(dip._id)}
              dip={dip}
              iscrizioni={iscrizioni ?? []}
              year={year}
            />
          ))}
        </div>
      )}
    </div>
  )
}
