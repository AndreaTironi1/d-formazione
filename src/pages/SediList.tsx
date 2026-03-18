import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type SedeRow = {
  _id: Id<'sedi'>
  _creationTime: number
  idSede: string
  areaGeografica: string
  responsabileId?: Id<'dipendenti'>
  responsabile?: { nome: string } | null
}

export default function SediList() {
  const sediList = useQuery(api.sedi.getAllWithResponsabili) as SedeRow[] | undefined
  const dipendenti = useQuery(api.dipendenti.getAll)
  const createSede = useMutation(api.sedi.create)
  const updateSede = useMutation(api.sedi.update)
  const removeSede = useMutation(api.sedi.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<SedeRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<SedeRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    idSede: '',
    areaGeografica: '',
    responsabileId: '' as string,
  })

  const openCreate = () => {
    setEditItem(null)
    setFormData({ idSede: '', areaGeografica: '', responsabileId: '' })
    setModalOpen(true)
  }

  const openEdit = (item: SedeRow) => {
    setEditItem(item)
    setFormData({
      idSede: item.idSede,
      areaGeografica: item.areaGeografica,
      responsabileId: item.responsabileId ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.idSede.trim() || !formData.areaGeografica.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        idSede: formData.idSede.trim(),
        areaGeografica: formData.areaGeografica.trim(),
        responsabileId: formData.responsabileId
          ? (formData.responsabileId as Id<'dipendenti'>)
          : undefined,
      }
      if (editItem) {
        await updateSede({ id: editItem._id, ...payload })
      } else {
        await createSede(payload)
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
      await removeSede({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<SedeRow>[] = [
    { key: 'idSede', label: 'ID Sede', sortable: true },
    { key: 'areaGeografica', label: 'Area Geografica', sortable: true },
    {
      key: 'responsabile',
      label: 'Responsabile',
      render: (row) => row.responsabile?.nome ?? <span className="text-slate-400">—</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sedi</h1>
          <p className="text-slate-500 text-sm mt-1">Sedi operative per area geografica</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuova Sede
        </button>
      </div>

      <DataTable
        data={sediList ?? []}
        columns={columns}
        searchPlaceholder="Cerca per area o ID..."
        searchKeys={['idSede', 'areaGeografica']}
        emptyMessage="Nessuna sede trovata. Importa i dati o crea una nuova sede."
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
        title={editItem ? 'Modifica Sede' : 'Nuova Sede'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID Sede <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.idSede}
              onChange={(e) => setFormData((f) => ({ ...f, idSede: e.target.value }))}
              placeholder="es. SEDE-01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Area Geografica <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.areaGeografica}
              onChange={(e) => setFormData((f) => ({ ...f, areaGeografica: e.target.value }))}
              placeholder="es. Piemonte"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Responsabile
            </label>
            <select
              className="input-field"
              value={formData.responsabileId}
              onChange={(e) => setFormData((f) => ({ ...f, responsabileId: e.target.value }))}
            >
              <option value="">— Nessuno —</option>
              {dipendenti?.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.nome}
                </option>
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
        message={`Vuoi eliminare la sede "${deleteItem?.areaGeografica}"? Questa azione non può essere annullata.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
