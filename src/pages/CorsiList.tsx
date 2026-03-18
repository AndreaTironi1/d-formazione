import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, FileText } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { cn } from '../lib/utils'

type CorsoRow = {
  _id: Id<'corsi'>
  _creationTime: number
  idCorso: string
  titolo: string
  ambito: string
  destinatari: string
  oreAula?: number
  priorita: number
  coeId?: Id<'coe'>
  coe?: { nome: string } | null
  // scheda
  owner?: string
  tutor?: string
  docenza?: string
  nomeDocenteAula?: string
  nomeDocenteOnboarding?: string
  durataOre?: number
  dataInizio?: string
  dataFine?: string
  modalitaErogazione?: string
  onboardingOre?: number
  competenzaSapere?: string
  competenzaSaperFare?: string
  outputTipici?: string
}

const PRIORITA_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: 'P1 — Bassa', className: 'bg-slate-100 text-slate-600' },
  2: { label: 'P2 — Medio-bassa', className: 'bg-blue-100 text-blue-700' },
  3: { label: 'P3 — Media', className: 'bg-yellow-100 text-yellow-700' },
  4: { label: 'P4 — Medio-alta', className: 'bg-orange-100 text-orange-700' },
  5: { label: 'P5 — Alta', className: 'bg-red-100 text-red-700' },
}

function PrioritaBadge({ priorita }: { priorita: number }) {
  const cfg = PRIORITA_CONFIG[priorita] ?? { label: `P${priorita}`, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', cfg.className)}>
      {cfg.label}
    </span>
  )
}

const DESTINATARI_OPTIONS = ['Junior/Middle', 'Senior', 'Resp. CoE', 'Tutti']
const DOCENZA_OPTIONS = ['Interna', 'Esterna', 'Mista']

const emptyForm = {
  idCorso: '', titolo: '', ambito: '', destinatari: 'Junior/Middle',
  oreAula: '', priorita: '3', coeId: '',
  owner: '', tutor: '', docenza: '',
  nomeDocenteAula: '', nomeDocenteOnboarding: '',
  durataOre: '', dataInizio: '', dataFine: '',
  modalitaErogazione: '', onboardingOre: '',
  competenzaSapere: '', competenzaSaperFare: '', outputTipici: '',
}

type FormData = typeof emptyForm

function schedaFromItem(item: CorsoRow): FormData {
  return {
    idCorso: item.idCorso,
    titolo: item.titolo,
    ambito: item.ambito,
    destinatari: item.destinatari,
    oreAula: item.oreAula != null ? String(item.oreAula) : '',
    priorita: String(item.priorita),
    coeId: item.coeId ?? '',
    owner: item.owner ?? '',
    tutor: item.tutor ?? '',
    docenza: item.docenza ?? '',
    nomeDocenteAula: item.nomeDocenteAula ?? '',
    nomeDocenteOnboarding: item.nomeDocenteOnboarding ?? '',
    durataOre: item.durataOre != null ? String(item.durataOre) : '',
    dataInizio: item.dataInizio ?? '',
    dataFine: item.dataFine ?? '',
    modalitaErogazione: item.modalitaErogazione ?? '',
    onboardingOre: item.onboardingOre != null ? String(item.onboardingOre) : '',
    competenzaSapere: item.competenzaSapere ?? '',
    competenzaSaperFare: item.competenzaSaperFare ?? '',
    outputTipici: item.outputTipici ?? '',
  }
}

// ── Scheda detail view ────────────────────────────────────────────────────────
function SchedaRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 text-sm font-medium text-slate-600 align-top whitespace-nowrap w-64">{label}</td>
      <td className="py-2 text-sm text-slate-900">{value ?? <span className="text-slate-400 italic">Da definire</span>}</td>
    </tr>
  )
}

function SchedaModal({ corso, onClose }: { corso: CorsoRow; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} title={`Scheda ${corso.idCorso}`} size="xl">
      <div className="space-y-1">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-3">
          {corso.coe?.nome ?? corso.ambito}
        </p>
        <table className="w-full">
          <tbody>
            <SchedaRow label="Titolo del corso" value={corso.titolo} />
            <SchedaRow label="Owner (Responsabile)" value={corso.owner} />
            <SchedaRow label="Tutor" value={corso.tutor} />
            <SchedaRow label="Docenza" value={corso.docenza} />
            <SchedaRow label="Destinatari" value={corso.destinatari} />
            <SchedaRow label="Nome docente/i aula" value={corso.nomeDocenteAula} />
            <SchedaRow label="Nome docente/i onboarding" value={corso.nomeDocenteOnboarding} />
            <SchedaRow label="Durata complessiva (in ore)" value={corso.durataOre != null ? `${corso.durataOre}h` : undefined} />
            <SchedaRow
              label="End to End (Data inizio → fine)"
              value={corso.dataInizio || corso.dataFine ? `${corso.dataInizio ?? '—'} → ${corso.dataFine ?? '—'}` : undefined}
            />
            <SchedaRow label="Modalità di erogazione" value={corso.modalitaErogazione} />
            <SchedaRow label="Onboarding (n° ore)" value={corso.onboardingOre != null ? `${corso.onboardingOre}h` : undefined} />
            <SchedaRow label="Ore aula" value={corso.oreAula != null ? `${corso.oreAula}h` : undefined} />
            <SchedaRow label="Competenza da acquisire – Sapere" value={corso.competenzaSapere} />
            <SchedaRow label="Competenza da acquisire – Saper fare" value={corso.competenzaSaperFare} />
            <SchedaRow label="Output tipici" value={corso.outputTipici} />
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CorsiList() {
  const corsi = useQuery(api.corsi.getAllWithCoe) as CorsoRow[] | undefined
  const coeList = useQuery(api.coe.getAll)
  const createCorso = useMutation(api.corsi.create)
  const updateCorso = useMutation(api.corsi.update)
  const removeCorso = useMutation(api.corsi.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<CorsoRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<CorsoRow | null>(null)
  const [schedaItem, setSchedaItem] = useState<CorsoRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterPriorita, setFilterPriorita] = useState<number | ''>('')
  const [activeTab, setActiveTab] = useState<'base' | 'scheda'>('base')

  const [formData, setFormData] = useState<FormData>(emptyForm)
  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData((f) => ({ ...f, [k]: e.target.value }))

  const openCreate = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setActiveTab('base')
    setModalOpen(true)
  }

  const openEdit = (item: CorsoRow) => {
    setEditItem(item)
    setFormData(schedaFromItem(item))
    setActiveTab('base')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.idCorso.trim() || !formData.titolo.trim()) return
    setIsSubmitting(true)
    try {
      const payload = {
        idCorso: formData.idCorso.trim(),
        titolo: formData.titolo.trim(),
        ambito: formData.ambito.trim(),
        destinatari: formData.destinatari,
        oreAula: formData.oreAula ? Number(formData.oreAula) : undefined,
        priorita: Number(formData.priorita),
        coeId: formData.coeId ? (formData.coeId as Id<'coe'>) : undefined,
        owner: formData.owner.trim() || undefined,
        tutor: formData.tutor.trim() || undefined,
        docenza: formData.docenza || undefined,
        nomeDocenteAula: formData.nomeDocenteAula.trim() || undefined,
        nomeDocenteOnboarding: formData.nomeDocenteOnboarding.trim() || undefined,
        durataOre: formData.durataOre ? Number(formData.durataOre) : undefined,
        dataInizio: formData.dataInizio.trim() || undefined,
        dataFine: formData.dataFine.trim() || undefined,
        modalitaErogazione: formData.modalitaErogazione.trim() || undefined,
        onboardingOre: formData.onboardingOre ? Number(formData.onboardingOre) : undefined,
        competenzaSapere: formData.competenzaSapere.trim() || undefined,
        competenzaSaperFare: formData.competenzaSaperFare.trim() || undefined,
        outputTipici: formData.outputTipici.trim() || undefined,
      }
      if (editItem) {
        await updateCorso({ id: editItem._id, ...payload })
      } else {
        await createCorso(payload)
      }
      setModalOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setIsSubmitting(true)
    try {
      await removeCorso({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCorsi = filterPriorita
    ? (corsi ?? []).filter((c) => c.priorita === filterPriorita)
    : (corsi ?? [])

  const columns: Column<CorsoRow>[] = [
    { key: 'idCorso', label: 'ID', sortable: true },
    { key: 'titolo', label: 'Titolo', sortable: true },
    { key: 'ambito', label: 'Ambito', sortable: true },
    {
      key: 'destinatari',
      label: 'Destinatari',
      render: (row) => (
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
          {row.destinatari}
        </span>
      ),
    },
    {
      key: 'oreAula',
      label: 'Ore',
      render: (row) =>
        row.oreAula != null ? (
          <span className="font-medium">{row.oreAula}h</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'priorita',
      label: 'Priorità',
      sortable: true,
      render: (row) => <PrioritaBadge priorita={row.priorita} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Corsi</h1>
          <p className="text-slate-500 text-sm mt-1">{corsi?.length ?? '...'} corsi totali</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuovo Corso
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterPriorita('')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            filterPriorita === ''
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          Tutte le priorità
        </button>
        {[1, 2, 3, 4, 5].map((p) => {
          const cfg = PRIORITA_CONFIG[p]
          return (
            <button
              key={p}
              onClick={() => setFilterPriorita(p)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                filterPriorita === p ? cfg.className + ' ring-2 ring-offset-1 ring-current' : cfg.className
              )}
            >
              P{p}
            </button>
          )
        })}
      </div>

      <DataTable
        data={filteredCorsi}
        columns={columns}
        searchPlaceholder="Cerca per titolo, ambito, ID..."
        searchKeys={['idCorso', 'titolo', 'ambito', 'destinatari']}
        emptyMessage="Nessun corso trovato."
        actions={(row) => (
          <>
            <button
              onClick={() => setSchedaItem(row)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Scheda corso"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => openEdit(row)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifica"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteItem(row)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Elimina"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      {/* Scheda detail modal */}
      {schedaItem && <SchedaModal corso={schedaItem} onClose={() => setSchedaItem(null)} />}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Modifica Corso' : 'Nuovo Corso'}
        size="xl"
      >
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-5 -mt-2">
          {(['base', 'scheda'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab === 'base' ? 'Info base' : 'Scheda corso'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'base' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ID Corso <span className="text-red-500">*</span>
                  </label>
                  <input type="text" className="input-field" value={formData.idCorso} onChange={set('idCorso')} placeholder="es. CRS-001" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priorità <span className="text-red-500">*</span>
                  </label>
                  <select className="input-field" value={formData.priorita} onChange={set('priorita')} required>
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>{PRIORITA_CONFIG[p].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Titolo <span className="text-red-500">*</span>
                </label>
                <input type="text" className="input-field" value={formData.titolo} onChange={set('titolo')} placeholder="Titolo del corso" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ambito</label>
                  <input type="text" className="input-field" value={formData.ambito} onChange={set('ambito')} placeholder="es. CoE P&C" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CoE</label>
                  <select className="input-field" value={formData.coeId} onChange={set('coeId')}>
                    <option value="">— Nessuno —</option>
                    {coeList?.map((c) => (
                      <option key={c._id} value={c._id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Destinatari</label>
                  <select className="input-field" value={formData.destinatari} onChange={set('destinatari')}>
                    {DESTINATARI_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ore Aula</label>
                  <input type="number" min="0" step="0.5" className="input-field" value={formData.oreAula} onChange={set('oreAula')} placeholder="es. 8" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'scheda' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner (Responsabile)</label>
                  <input type="text" className="input-field" value={formData.owner} onChange={set('owner')} placeholder="es. Resp. CoE" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tutor</label>
                  <input type="text" className="input-field" value={formData.tutor} onChange={set('tutor')} placeholder="Da individuare" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Docenza</label>
                <div className="flex gap-4">
                  {DOCENZA_OPTIONS.map((d) => (
                    <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="docenza"
                        value={d}
                        checked={formData.docenza === d}
                        onChange={set('docenza')}
                        className="accent-blue-600"
                      />
                      <span className="text-sm text-slate-700">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome docente/i aula</label>
                  <input type="text" className="input-field" value={formData.nomeDocenteAula} onChange={set('nomeDocenteAula')} placeholder="Da individuare" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome docente/i onboarding</label>
                  <input type="text" className="input-field" value={formData.nomeDocenteOnboarding} onChange={set('nomeDocenteOnboarding')} placeholder="Da individuare" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Durata complessiva (ore)</label>
                  <input type="number" min="0" step="0.5" className="input-field" value={formData.durataOre} onChange={set('durataOre')} placeholder="—" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data inizio</label>
                  <input type="date" className="input-field" value={formData.dataInizio} onChange={set('dataInizio')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data fine</label>
                  <input type="date" className="input-field" value={formData.dataFine} onChange={set('dataFine')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modalità di erogazione</label>
                  <input type="text" className="input-field" value={formData.modalitaErogazione} onChange={set('modalitaErogazione')} placeholder="es. Aula (n° ore): 8" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Onboarding (n° ore)</label>
                  <input type="number" min="0" step="0.5" className="input-field" value={formData.onboardingOre} onChange={set('onboardingOre')} placeholder="—" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Competenza da acquisire — Sapere</label>
                <textarea rows={2} className="input-field resize-none" value={formData.competenzaSapere} onChange={set('competenzaSapere')} placeholder="Descrivi le conoscenze teoriche da acquisire..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Competenza da acquisire — Saper fare</label>
                <textarea rows={2} className="input-field resize-none" value={formData.competenzaSaperFare} onChange={set('competenzaSaperFare')} placeholder="Descrivi le competenze pratiche da acquisire..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Output tipici</label>
                <textarea rows={2} className="input-field resize-none" value={formData.outputTipici} onChange={set('outputTipici')} placeholder="es. Albero obiettivi; kit approvazione..." />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={isSubmitting}>
              Annulla
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvataggio...' : editItem ? 'Salva' : 'Crea'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        message={`Vuoi eliminare il corso "${deleteItem?.titolo}"? Verranno eliminate anche le iscrizioni associate.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
