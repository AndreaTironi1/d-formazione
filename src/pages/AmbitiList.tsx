import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type AmbitoRow = {
  _id: Id<'ambiti'>
  _creationTime: number
  nome: string
  descrizione?: string
}

export default function AmbitiList() {
  const ambitiList = useQuery(api.ambiti.getAll) as AmbitoRow[] | undefined
  const createAmbito = useMutation(api.ambiti.create)
  const updateAmbito = useMutation(api.ambiti.update)
  const removeAmbito = useMutation(api.ambiti.remove)
  const migrateFromCorsi = useMutation(api.ambiti.migrateFromCorsi)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<AmbitoRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<AmbitoRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [migrateResult, setMigrateResult] = useState<{ ambitiCreati: number; corsiAggiornati: number } | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    descrizione: '',
  })

  const openCreate = () => {
    setEditItem(null)
    setFormData({ nome: '', descrizione: '' })
    setModalOpen(true)
  }

  const openEdit = (item: AmbitoRow) => {
    setEditItem(item)
    setFormData({
      nome: item.nome,
      descrizione: item.descrizione ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        nome: formData.nome.trim(),
        descrizione: formData.descrizione.trim() || undefined,
      }
      if (editItem) {
        await updateAmbito({ id: editItem._id, ...payload })
      } else {
        await createAmbito(payload)
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
      await removeAmbito({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMigrate = async () => {
    setIsSubmitting(true)
    try {
      const result = await migrateFromCorsi({})
      setMigrateResult(result)
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<AmbitoRow>[] = [
    { key: 'nome', label: 'Nome Ambito', sortable: true },
    {
      key: 'descrizione',
      label: 'Descrizione',
      render: (row) =>
        row.descrizione
          ? <span className="text-slate-700">{row.descrizione}</span>
          : <span className="text-slate-400">—</span>,
    },
  ]

  const isEmpty = ambitiList !== undefined && ambitiList.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ambiti</h1>
          <p className="text-slate-500 text-sm mt-1">Ambiti formativi dei corsi</p>
        </div>
        <div className="flex gap-2">
          {isEmpty && (
            <button
              onClick={handleMigrate}
              disabled={isSubmitting}
              className="btn-secondary flex items-center gap-2"
              title="Importa gli ambiti dai corsi già presenti nel database"
            >
              <RefreshCw className="w-4 h-4" />
              Migra da corsi esistenti
            </button>
          )}
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nuovo Ambito
          </button>
        </div>
      </div>

      {/* Risultato migrazione */}
      {migrateResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center justify-between">
          <span>
            Migrazione completata: <strong>{migrateResult.ambitiCreati}</strong> ambiti creati,{' '}
            <strong>{migrateResult.corsiAggiornati}</strong> corsi aggiornati.
          </span>
          <button
            onClick={() => setMigrateResult(null)}
            className="text-green-600 hover:text-green-800 font-medium ml-4"
          >
            ×
          </button>
        </div>
      )}

      <DataTable
        data={ambitiList ?? []}
        columns={columns}
        searchPlaceholder="Cerca per nome o descrizione..."
        searchKeys={['nome', 'descrizione']}
        emptyMessage="Nessun ambito trovato. Crea un nuovo ambito o migra quelli dai corsi esistenti."
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Modifica Ambito' : 'Nuovo Ambito'}
        size="sm"
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
              placeholder="es. Leadership & Management"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrizione
            </label>
            <textarea
              rows={3}
              className="input-field resize-none"
              value={formData.descrizione}
              onChange={(e) => setFormData((f) => ({ ...f, descrizione: e.target.value }))}
              placeholder="Descrizione opzionale dell'ambito formativo..."
            />
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        message={`Vuoi eliminare l'ambito "${deleteItem?.nome}"? I corsi collegati perderanno il riferimento all'ambito.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
