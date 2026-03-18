import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type ServizioRow = {
  _id: Id<'servizi'>
  _creationTime: number
  nome: string
  coeId: Id<'coe'>
  coe?: { nome: string } | null
}

export default function ServiziList() {
  const servizi = useQuery(api.servizi.getAllWithCoe) as ServizioRow[] | undefined
  const coeList = useQuery(api.coe.getAll)
  const createServizio = useMutation(api.servizi.create)
  const updateServizio = useMutation(api.servizi.update)
  const removeServizio = useMutation(api.servizi.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<ServizioRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<ServizioRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emptyForm = { nome: '', coeId: '' }
  const [formData, setFormData] = useState(emptyForm)

  const openCreate = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item: ServizioRow) => {
    setEditItem(item)
    setFormData({ nome: item.nome, coeId: item.coeId })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim() || !formData.coeId) return

    setIsSubmitting(true)
    try {
      if (editItem) {
        await updateServizio({
          id: editItem._id,
          nome: formData.nome.trim(),
          coeId: formData.coeId as Id<'coe'>,
        })
      } else {
        await createServizio({
          nome: formData.nome.trim(),
          coeId: formData.coeId as Id<'coe'>,
        })
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
      await removeServizio({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<ServizioRow>[] = [
    { key: 'nome', label: 'Nome Servizio', sortable: true },
    {
      key: 'coe',
      label: 'CoE',
      sortable: false,
      render: (row) => row.coe?.nome ?? <span className="text-slate-400">—</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Servizi</h1>
          <p className="text-slate-500 text-sm mt-1">{servizi?.length ?? '...'} servizi totali</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuovo Servizio
        </button>
      </div>

      <DataTable
        data={servizi ?? []}
        columns={columns}
        searchPlaceholder="Cerca servizio..."
        searchKeys={['nome']}
        emptyMessage="Nessun servizio trovato."
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
        title={editItem ? 'Modifica Servizio' : 'Nuovo Servizio'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome Servizio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.nome}
              onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome del servizio"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              CoE <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.coeId}
              onChange={(e) => setFormData((f) => ({ ...f, coeId: e.target.value }))}
              required
            >
              <option value="">— Seleziona CoE —</option>
              {coeList?.map((c) => (
                <option key={c._id} value={c._id}>{c.nome}</option>
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
        message={`Vuoi eliminare il servizio "${deleteItem?.nome}"?`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
