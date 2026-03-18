import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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

export default function CorsiList() {
  const corsi = useQuery(api.corsi.getAllWithCoe) as CorsoRow[] | undefined
  const coeList = useQuery(api.coe.getAll)
  const createCorso = useMutation(api.corsi.create)
  const updateCorso = useMutation(api.corsi.update)
  const removeCorso = useMutation(api.corsi.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<CorsoRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<CorsoRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterPriorita, setFilterPriorita] = useState<number | ''>('')

  const emptyForm = {
    idCorso: '',
    titolo: '',
    ambito: '',
    destinatari: 'Junior/Middle',
    oreAula: '',
    priorita: '3',
    coeId: '',
  }
  const [formData, setFormData] = useState(emptyForm)

  const openCreate = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: CorsoRow) => {
    setEditItem(item)
    setFormData({
      idCorso: item.idCorso,
      titolo: item.titolo,
      ambito: item.ambito,
      destinatari: item.destinatari,
      oreAula: item.oreAula != null ? String(item.oreAula) : '',
      priorita: String(item.priorita),
      coeId: item.coeId ?? '',
    })
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
        title={editItem ? 'Modifica Corso' : 'Nuovo Corso'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID Corso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.idCorso}
                onChange={(e) => setFormData((f) => ({ ...f, idCorso: e.target.value }))}
                placeholder="es. CRS-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Priorità <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={formData.priorita}
                onChange={(e) => setFormData((f) => ({ ...f, priorita: e.target.value }))}
                required
              >
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    {PRIORITA_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Titolo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.titolo}
              onChange={(e) => setFormData((f) => ({ ...f, titolo: e.target.value }))}
              placeholder="Titolo del corso"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ambito</label>
              <input
                type="text"
                className="input-field"
                value={formData.ambito}
                onChange={(e) => setFormData((f) => ({ ...f, ambito: e.target.value }))}
                placeholder="es. CoE P&C"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CoE</label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destinatari</label>
              <select
                className="input-field"
                value={formData.destinatari}
                onChange={(e) => setFormData((f) => ({ ...f, destinatari: e.target.value }))}
              >
                {DESTINATARI_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ore Aula</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="input-field"
                value={formData.oreAula}
                onChange={(e) => setFormData((f) => ({ ...f, oreAula: e.target.value }))}
                placeholder="es. 8"
              />
            </div>
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
        message={`Vuoi eliminare il corso "${deleteItem?.titolo}"? Verranno eliminate anche le iscrizioni associate.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
