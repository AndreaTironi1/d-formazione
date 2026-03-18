import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<DipRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<DipRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emptyForm = {
    nome: '',
    email: '',
    seniority: '',
    ruolo: 'Consulente',
    coeId: '',
    sedeId: '',
  }

  const [formData, setFormData] = useState(emptyForm)

  const openCreate = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: DipRow) => {
    setEditItem(item)
    setFormData({
      nome: item.nome,
      email: item.email ?? '',
      seniority: item.seniority ?? '',
      ruolo: item.ruolo,
      coeId: item.coeId ?? '',
      sedeId: item.sedeId ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim() || !formData.ruolo) return

    setIsSubmitting(true)
    try {
      const payload = {
        nome: formData.nome.trim(),
        email: formData.email.trim() || undefined,
        seniority: formData.seniority || undefined,
        ruolo: formData.ruolo,
        coeId: formData.coeId ? (formData.coeId as Id<'coe'>) : undefined,
        sedeId: formData.sedeId ? (formData.sedeId as Id<'sedi'>) : undefined,
      }
      if (editItem) {
        await updateDip({ id: editItem._id, ...payload })
      } else {
        await createDip(payload)
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
      await removeDip({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<DipRow>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    {
      key: 'ruolo',
      label: 'Ruolo',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-slate-600">{row.ruolo}</span>
      ),
    },
    {
      key: 'coe',
      label: 'CoE',
      render: (row) => {
        if (row.coeMultipli.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.coeMultipli.map((dc) => (
                <span key={dc._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 font-medium">
                  {dc.coe?.nome ?? '—'}
                  {dc.percentuale != null && <span className="opacity-70">{dc.percentuale}%</span>}
                </span>
              ))}
            </div>
          )
        }
        return row.coe?.nome ?? <span className="text-slate-400">—</span>
      },
    },
    {
      key: 'sede',
      label: 'Sede',
      render: (row) => {
        if (row.sediMultiple.length > 1) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.sediMultiple.map((ds) => (
                <span key={ds._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium">
                  {ds.sede?.areaGeografica ?? '—'}
                  {ds.percentuale != null && ds.percentuale < 100 && <span className="opacity-70">{ds.percentuale}%</span>}
                </span>
              ))}
            </div>
          )
        }
        return row.sede?.areaGeografica ?? <span className="text-slate-400">—</span>
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
          <a href={`mailto:${row.email}`} className="text-blue-600 hover:underline text-sm">
            {row.email}
          </a>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Modifica Dipendente' : 'Nuovo Dipendente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.nome}
              onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome Cognome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              placeholder="nome.cognome@dasein.it"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ruolo <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={formData.ruolo}
                onChange={(e) => setFormData((f) => ({ ...f, ruolo: e.target.value }))}
                required
              >
                {RUOLO_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Seniority</label>
              <select
                className="input-field"
                value={formData.seniority}
                onChange={(e) => setFormData((f) => ({ ...f, seniority: e.target.value }))}
              >
                <option value="">— Nessuna —</option>
                {SENIORITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CoE principale</label>
            <select
              className="input-field"
              value={formData.coeId}
              onChange={(e) => setFormData((f) => ({ ...f, coeId: e.target.value }))}
            >
              <option value="">— Nessuno —</option>
              {coeList?.map((c) => (
                <option key={c._id} value={c._id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
            <select
              className="input-field"
              value={formData.sedeId}
              onChange={(e) => setFormData((f) => ({ ...f, sedeId: e.target.value }))}
            >
              <option value="">— Nessuna —</option>
              {sediList?.map((s) => (
                <option key={s._id} value={s._id}>{s.areaGeografica}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
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
        message={`Vuoi eliminare il dipendente "${deleteItem?.nome}"? Verranno eliminate anche le sue iscrizioni ai corsi.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
