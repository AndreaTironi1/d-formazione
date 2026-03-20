import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import Modal from '../components/Modal'

// ── Constants ─────────────────────────────────────────────────────────────────

const YEARS = [2026, 2027, 2028, 2029, 2030]

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const PRIORITY_CELL_BG: Record<number, string> = {
  1: 'bg-slate-300',
  2: 'bg-blue-400',
  3: 'bg-yellow-400',
  4: 'bg-orange-400',
  5: 'bg-red-500',
}

const PRIORITY_BADGE: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600 border-slate-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  4: 'bg-orange-50 text-orange-700 border-orange-200',
  5: 'bg-red-50 text-red-700 border-red-200',
}

const PRIORITY_LABEL: Record<number, string> = {
  1: 'Bassa', 2: 'Media', 3: 'Alta', 4: 'Urgente', 5: 'Critica',
}

// ── Types ─────────────────────────────────────────────────────────────────────

type CorsoInfo = {
  titolo: string
  idCorso?: string
  ambito?: string
  destinatari?: string
  priorita: number
  dataInizio?: string
  dataFine?: string
  durataOre?: number
  oreAula?: number
  modalitaErogazione?: string
  owner?: string
  tutor?: string
  docenza?: string
  competenzaSapere?: string
  competenzaSaperFare?: string
  outputTipici?: string
}

type IscrizioneRow = {
  _id: string
  dipendenteId: Id<'dipendenti'>
  corso?: CorsoInfo | null
}

type Dipendente = {
  _id: Id<'dipendenti'>
  nome: string
  ruolo: string
  seniority?: string
  coeId?: Id<'coe'>
  sedeId?: Id<'sedi'>
  coeMultipli: { _id: string; coeId: Id<'coe'>; coe?: { nome: string } | null }[]
  sediMultiple: { _id: string; sedeId: Id<'sedi'>; sede?: { areaGeografica: string } | null }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getCorsiOnDay(
  dipendenteId: string,
  day: number,
  year: number,
  month: number,
  iscrizioni: IscrizioneRow[]
): CorsoInfo[] {
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return iscrizioni
    .filter(i => {
      if (String(i.dipendenteId) !== dipendenteId) return false
      if (!i.corso?.dataInizio || !i.corso?.dataFine) return false
      const start = new Date(i.corso.dataInizio)
      const end = new Date(i.corso.dataFine)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })
    .map(i => i.corso!)
}

// ── Cell ─────────────────────────────────────────────────────────────────────

function GridCell({
  corsi,
  onClick,
}: {
  corsi: CorsoInfo[]
  onClick: (c: CorsoInfo) => void
}) {
  if (corsi.length === 0) {
    return <td className="border border-slate-100 w-7 min-w-[1.75rem]" />
  }

  const first = corsi[0]
  const bg = PRIORITY_CELL_BG[first.priorita] ?? 'bg-slate-300'

  return (
    <td
      className={`border border-white w-7 min-w-[1.75rem] cursor-pointer hover:opacity-75 transition-opacity ${bg}`}
      onClick={() => onClick(first)}
      title={corsi.map(c => c.titolo).join(' / ')}
    >
      {corsi.length > 1 && (
        <div className="flex items-center justify-center h-full">
          <span className="text-[9px] font-bold text-white leading-none">+{corsi.length}</span>
        </div>
      )}
    </td>
  )
}

// ── Corso Modal ───────────────────────────────────────────────────────────────

function CorsoModal({ corso, onClose }: { corso: CorsoInfo | null; onClose: () => void }) {
  return (
    <Modal open={!!corso} onClose={onClose} title="Dettagli corso" size="md">
      {corso && (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Titolo</p>
            <p className="font-semibold text-slate-900">{corso.titolo}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {corso.idCorso && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">ID Corso</p>
                <p className="font-mono text-sm text-slate-700">{corso.idCorso}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Priorità</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${PRIORITY_BADGE[corso.priorita] ?? ''}`}>
                P{corso.priorita} — {PRIORITY_LABEL[corso.priorita] ?? ''}
              </span>
            </div>
            {corso.ambito && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Ambito</p>
                <p className="text-sm text-slate-700">{corso.ambito}</p>
              </div>
            )}
            {corso.destinatari && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Destinatari</p>
                <p className="text-sm text-slate-700">{corso.destinatari}</p>
              </div>
            )}
            {corso.dataInizio && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Data inizio</p>
                <p className="text-sm text-slate-700">{corso.dataInizio}</p>
              </div>
            )}
            {corso.dataFine && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Data fine</p>
                <p className="text-sm text-slate-700">{corso.dataFine}</p>
              </div>
            )}
            {corso.durataOre != null && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Durata</p>
                <p className="text-sm text-slate-700">{corso.durataOre}h</p>
              </div>
            )}
            {corso.oreAula != null && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Ore aula</p>
                <p className="text-sm text-slate-700">{corso.oreAula}h</p>
              </div>
            )}
            {corso.modalitaErogazione && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Modalità</p>
                <p className="text-sm text-slate-700">{corso.modalitaErogazione}</p>
              </div>
            )}
            {corso.owner && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Owner</p>
                <p className="text-sm text-slate-700">{corso.owner}</p>
              </div>
            )}
            {corso.tutor && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Tutor</p>
                <p className="text-sm text-slate-700">{corso.tutor}</p>
              </div>
            )}
            {corso.docenza && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Tipo docenza</p>
                <p className="text-sm text-slate-700">{corso.docenza}</p>
              </div>
            )}
          </div>

          {(corso.competenzaSapere || corso.competenzaSaperFare || corso.outputTipici) && (
            <div className="border-t border-slate-100 pt-3 space-y-3">
              {corso.competenzaSapere && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Competenza — sapere</p>
                  <p className="text-sm text-slate-600">{corso.competenzaSapere}</p>
                </div>
              )}
              {corso.competenzaSaperFare && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Competenza — saper fare</p>
                  <p className="text-sm text-slate-600">{corso.competenzaSaperFare}</p>
                </div>
              )}
              {corso.outputTipici && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Output tipici</p>
                  <p className="text-sm text-slate-600">{corso.outputTipici}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ReportMensile() {
  const dipendenti = useQuery(api.dipendenti.getAllWithRelations) as Dipendente[] | undefined
  const iscrizioni = useQuery(api.iscrizioni.getAllWithRelations) as IscrizioneRow[] | undefined
  const coeList = useQuery(api.coe.getAll)
  const sediList = useQuery(api.sedi.getAll)

  const now = new Date()
  const defaultMonth = now.getMonth() + 1
  const defaultYear = YEARS.includes(now.getFullYear()) ? now.getFullYear() : YEARS[0]

  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [filterCoe, setFilterCoe] = useState('')
  const [filterSede, setFilterSede] = useState('')
  const [selectedCorso, setSelectedCorso] = useState<CorsoInfo | null>(null)

  const days = useMemo(() => {
    const n = daysInMonth(year, month)
    return Array.from({ length: n }, (_, i) => i + 1)
  }, [year, month])

  const filteredDipendenti = useMemo(() => {
    if (!dipendenti) return []
    return dipendenti.filter(d => {
      if (filterCoe) {
        const inPrimary = String(d.coeId) === filterCoe
        const inMultipli = d.coeMultipli?.some(dc => String(dc.coeId) === filterCoe)
        if (!inPrimary && !inMultipli) return false
      }
      if (filterSede) {
        const inPrimary = String(d.sedeId) === filterSede
        const inMultipli = d.sediMultiple?.some(ds => String(ds.sedeId) === filterSede)
        if (!inPrimary && !inMultipli) return false
      }
      return true
    })
  }, [dipendenti, filterCoe, filterSede])

  const isLoading = dipendenti === undefined || iscrizioni === undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Report Mensile</h1>
        <p className="text-slate-500 text-sm mt-1">
          Visualizza i corsi per dipendente giorno per giorno.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Mese</label>
            <select
              className="input-field"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Anno</label>
            <select
              className="input-field"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">CoE</label>
            <select
              className="input-field"
              value={filterCoe}
              onChange={e => setFilterCoe(e.target.value)}
            >
              <option value="">Tutti i CoE</option>
              {coeList?.map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sede</label>
            <select
              className="input-field"
              value={filterSede}
              onChange={e => setFilterSede(e.target.value)}
            >
              <option value="">Tutte le Sedi</option>
              {sediList?.map(s => <option key={s._id} value={s._id}>{s.areaGeografica}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-400 gap-2">
          <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Caricamento...
        </div>
      ) : filteredDipendenti.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Nessun dipendente trovato.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 border border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 min-w-[200px] whitespace-nowrap">
                    Dipendente
                  </th>
                  {days.map(d => (
                    <th
                      key={d}
                      className="border border-slate-200 w-7 min-w-[1.75rem] text-center font-medium text-slate-500 py-2"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDipendenti.map((dip, idx) => (
                  <tr key={String(dip._id)} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="sticky left-0 z-10 bg-inherit border border-slate-200 px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                      {dip.nome}
                      {dip.seniority && (
                        <span className="ml-2 text-slate-400 font-normal text-[11px]">{dip.seniority}</span>
                      )}
                    </td>
                    {days.map(d => {
                      const corsi = getCorsiOnDay(String(dip._id), d, year, month, iscrizioni ?? [])
                      return <GridCell key={d} corsi={corsi} onClick={setSelectedCorso} />
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-4">
            {Object.entries(PRIORITY_LABEL).map(([p, label]) => (
              <div key={p} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${PRIORITY_CELL_BG[Number(p)]}`} />
                <span className="text-xs text-slate-500">P{p} — {label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CorsoModal corso={selectedCorso} onClose={() => setSelectedCorso(null)} />
    </div>
  )
}
