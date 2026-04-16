import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { cn } from '../lib/utils'

type CoeMultiplo = {
  _id: string
  coeId: Id<'coe'>
  percentuale?: number
  coe: { nome: string; idCoe: string } | null
}

type SedeMultipla = {
  _id: string
  sedeId: Id<'sedi'>
  percentuale?: number
  sede: { areaGeografica: string } | null
}

type DipRow = {
  _id: Id<'dipendenti'>
  _creationTime: number
  nome: string
  email?: string
  seniority?: string
  ruolo: string
  coeId?: Id<'coe'>
  sedeId?: Id<'sedi'>
  coe?: { nome: string } | null
  sede?: { areaGeografica: string } | null
  coeMultipli: CoeMultiplo[]
  sediMultiple: SedeMultipla[]
}

type CoeEntry = { coeId: string; percentuale: string }
type SedeEntry = { sedeId: string; percentuale: string }

const SENIORITY_OPTIONS = ['Junior', 'Middle', 'Senior']
const RUOLO_OPTIONS = ['Responsabile CoE', 'Responsabile Sede', 'Consulente', 'Operations']

const seniorityBadge = (s: string | undefined) => {
  if (!s) return <span className="text-slate-400">—</span>
  const colors: Record<string, string> = {
    Junior: 'bg-green-100 text-green-700',
    Middle: 'bg-blue-100 text-blue-700',
    Senior: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', colors[s] ?? 'bg-slate-100 text-slate-600')}>
      {s}
    </span>
  )
}

export default function DipendentiList() {
  const dipendenti = useQuery(api.dipendenti.getAllWithRelations) as DipRow[] | undefined
  const coeList = useQuery(api.coe.getAll)
  const sediList = useQuery(api.sedi.getAll)
  const createDip = useMutation(api.dipendenti.create)
  const updateDip = useMutation(api.dipendenti.update)
  const removeDip = useMutation(api.dipendenti.remove)
  const replaceCoe = useMutation(api.dipendenti.replaceCoeAssociations)
  const replaceSede = useMutation(api.dipendenti.replaceSedeAssociations)

  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'base' | 'assegnazioni'>('base')
  const [editItem, setEditItem] = useState<DipRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<DipRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const emptyForm = { nome: '', email: '', seniority: '', ruolo: 'Consulente' }
  const [formData, setFormData] = useState(emptyForm)
  const [coeEntries, setCoeEntries] = useState<CoeEntry[]>([])
  const [sedeEntries, setSedeEntries] = useState<SedeEntry[]>([])

  const openCreate = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setCoeEntries([])
    setSedeEntries([])
    setSaveError(null)
    setActiveTab('base')
    setModalOpen(true)
  }

  const openEdit = (item: DipRow) => {
    setEditItem(item)
    setFormData({ nome: item.nome, email: item.email ?? '', seniority: item.seniority ?? '', ruolo: item.ruolo })
    setSaveError(null)

    // Popola CoE dal bridge table; fallback al campo coeId diretto (dati pre-reimport)
    const coeList = item.coeMultipli ?? []
    setCoeEntries(
      coeList.length > 0
        ? coeList.map(dc => ({ coeId: dc.coeId, percentuale: dc.percentuale != null ? String(dc.percentuale) : '' }))
        : item.coeId ? [{ coeId: item.coeId, percentuale: '' }] : []
    )

    // Popola Sede dal bridge table; fallback al campo sedeId diretto (dati pre-reimport)
    const sedeList = item.sediMultiple ?? []
    setSedeEntries(
      sedeList.length > 0
        ? sedeList.map(ds => ({ sedeId: ds.sedeId, percentuale: ds.percentuale != null ? String(ds.percentuale) : '' }))
        : item.sedeId ? [{ sedeId: item.sedeId, percentuale: '' }] : []
    )

    setActiveTab('base')
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) return
    setIsSubmitting(true)
    setSaveError(null)
    try {
      const coePayload = coeEntries
        .filter(en => en.coeId)
        .map(en => ({
          coeId: en.coeId as Id<'coe'>,
          ...(en.percentuale !== '' ? { percentuale: Number(en.percentuale) } : {}),
        }))
      const sedePayload = sedeEntries
        .filter(en => en.sedeId)
        .map(en => ({
          sedeId: en.sedeId as Id<'sedi'>,
          ...(en.percentuale !== '' ? { percentuale: Number(en.percentuale) } : {}),
        }))

      const basePayload = {
        nome: formData.nome.trim(),
        email: formData.email.trim() || undefined,
        seniority: formData.seniority || undefined,
        ruolo: formData.ruolo,
        ...(coePayload[0]?.coeId ? { coeId: coePayload[0].coeId } : {}),
        ...(sedePayload[0]?.sedeId ? { sedeId: sedePayload[0].sedeId } : {}),
      }

      let dipId: Id<'dipendenti'>
      if (editItem) {
        await updateDip({ id: editItem._id, ...basePayload })
        dipId = editItem._id
      } else {
        dipId = await createDip(basePayload)
      }

      await replaceCoe({ dipendenteId: dipId, entries: coePayload })
      await replaceSede({ dipendenteId: dipId, entries: sedePayload })
      setModalOpen(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setIsSubmitting(true)
    try {
      await removeDip({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── CoE entry helpers ────────────────────────────────────────────────────
  const addCoeEntry = () => setCoeEntries(e => [...e, { coeId: '', percentuale: '' }])
  const removeCoeEntry = (i: number) => setCoeEntries(e => e.filter((_, idx) => idx !== i))
  const setCoeField = (i: number, field: keyof CoeEntry, val: string) =>
    setCoeEntries(e => e.map((entry, idx) => idx === i ? { ...entry, [field]: val } : entry))

  // ── Sede entry helpers ───────────────────────────────────────────────────
  const addSedeEntry = () => setSedeEntries(e => [...e, { sedeId: '', percentuale: '' }])
  const removeSedeEntry = (i: number) => setSedeEntries(e => e.filter((_, idx) => idx !== i))
  const setSedeField = (i: number, field: keyof SedeEntry, val: string) =>
    setSedeEntries(e => e.map((entry, idx) => idx === i ? { ...entry, [field]: val } : entry))

  const columns: Column<DipRow>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    {
      key: 'ruolo',
      label: 'Ruolo',
      sortable: true,
      render: (row) => <span className="text-sm text-slate-600">{row.ruolo}</span>,
    },
    {
      key: 'coe',
      label: 'CoE',
      render: (row) => {
        const list = row.coeMultipli ?? []
        if (list.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {list.map((dc) => (
                <span key={String(dc._id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 font-medium">
                  {dc.coe?.nome ?? '—'}
                  {dc.percentuale != null && <span className="opacity-70">{dc.percentuale}%</span>}
                </span>
              ))}
            </div>
          )
        }
        return row.coe?.nome ? <span>{row.coe.nome}</span> : <span className="text-slate-400">—</span>
      },
    },
    {
      key: 'sede',
      label: 'Sede',
      render: (row) => {
        const list = row.sediMultiple ?? []
        if (list.length > 1) {
          return (
            <div className="flex flex-wrap gap-1">
              {list.map((ds) => (
                <span key={String(ds._id)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium">
                  {ds.sede?.areaGeografica ?? '—'}
                  {ds.percentuale != null && ds.percentuale < 100 && <span className="opacity-70">{ds.percentuale}%</span>}
                </span>
              ))}
            </div>
          )
        }
        return row.sede?.areaGeografica ? <span>{row.sede.areaGeografica}</span> : <span className="text-slate-400">—</span>
      },
    },
    {
      key: 'seniority',
      label: 'Seniority',
      render: (row) => seniorityBadge(row.seniority),
    },
    {
      key: 'email',
      label: 'Email',
      render: (row) =>
        row.email ? (
          <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline text-sm">{row.email}</a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dipendenti</h1>
          <p className="text-slate-500 text-sm mt-1">{dipendenti?.length ?? '...'} dipendenti totali</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuovo Dipendente
        </button>
      </div>

      <DataTable
        data={dipendenti ?? []}
        columns={columns}
        searchPlaceholder="Cerca per nome, email..."
        searchKeys={['nome', 'email', 'ruolo', 'seniority']}
        emptyMessage="Nessun dipendente trovato."
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifica">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setDeleteItem(row)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Elimina">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifica Dipendente' : 'Nuovo Dipendente'} size="lg">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-5 -mt-2">
          {(['base', 'assegnazioni'] as const).map((tab) => (
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
              {tab === 'base' ? 'Info base' : 'CoE & Sedi'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'base' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome <span className="text-red-500">*</span></label>
                <input type="text" className="input-field" value={formData.nome} onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))} placeholder="Nome Cognome" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="input-field" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} placeholder="nome.cognome@dasein.it" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ruolo <span className="text-red-500">*</span></label>
                  <select className="input-field" value={formData.ruolo} onChange={e => setFormData(f => ({ ...f, ruolo: e.target.value }))} required>
                    {RUOLO_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seniority</label>
                  <select className="input-field" value={formData.seniority} onChange={e => setFormData(f => ({ ...f, seniority: e.target.value }))}>
                    <option value="">— Nessuna —</option>
                    {SENIORITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'assegnazioni' && (
            <div className="space-y-6">
              {/* CoE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">CoE</h3>
                  <button type="button" onClick={addCoeEntry} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Aggiungi CoE
                  </button>
                </div>
                {coeEntries.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nessun CoE assegnato. Clicca "Aggiungi CoE".</p>
                )}
                <div className="space-y-2">
                  {coeEntries.map((entry, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        className="input-field flex-1"
                        value={entry.coeId}
                        onChange={e => setCoeField(i, 'coeId', e.target.value)}
                      >
                        <option value="">— Seleziona CoE —</option>
                        {coeList?.filter(c => c._id === entry.coeId || !coeEntries.some((e, j) => j !== i && e.coeId === c._id)).map(c => <option key={c._id} value={c._id}>{c.nome}</option>)}
                      </select>
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="input-field pr-6"
                          placeholder="100"
                          value={entry.percentuale}
                          onChange={e => setCoeField(i, 'percentuale', e.target.value)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                      </div>
                      <button type="button" onClick={() => removeCoeEntry(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sedi */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700">Sedi</h3>
                  <button type="button" onClick={addSedeEntry} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Aggiungi Sede
                  </button>
                </div>
                {sedeEntries.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Nessuna sede assegnata. Clicca "Aggiungi Sede".</p>
                )}
                <div className="space-y-2">
                  {sedeEntries.map((entry, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <select
                        className="input-field flex-1"
                        value={entry.sedeId}
                        onChange={e => setSedeField(i, 'sedeId', e.target.value)}
                      >
                        <option value="">— Seleziona Sede —</option>
                        {sediList?.filter(s => s._id === entry.sedeId || !sedeEntries.some((e, j) => j !== i && e.sedeId === s._id)).map(s => <option key={s._id} value={s._id}>{s.areaGeografica}</option>)}
                      </select>
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="input-field pr-6"
                          placeholder="100"
                          value={entry.percentuale}
                          onChange={e => setSedeField(i, 'percentuale', e.target.value)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                      </div>
                      <button type="button" onClick={() => removeSedeEntry(i)} className="p-1.5 text-slate-400 hover:text-red-500 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {saveError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={isSubmitting}>Annulla</button>
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
        message={`Vuoi eliminare il dipendente "${deleteItem?.nome}"? Verranno eliminate anche le sue iscrizioni ai corsi.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
