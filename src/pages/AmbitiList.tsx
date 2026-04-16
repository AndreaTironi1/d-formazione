import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, RefreshCw, Download, Upload } from 'lucide-react'
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([{ Nome: 'Digital Transformation', Descrizione: 'Ambito formativo su temi digitali' }])
    XLSX.utils.book_append_sheet(wb, ws, 'Ambiti')
    XLSX.writeFile(wb, 'template_ambiti.xlsx')
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const XLSXdyn = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSXdyn.read(buffer, { type: 'array' })
    const ws = wb.Sheets['Ambiti'] ?? wb.Sheets[wb.SheetNames[0]]
    const rows = XLSXdyn.utils.sheet_to_json<{ Nome: string; Descrizione: string }>(ws)
    const existingNomi = new Set((ambitiList ?? []).map(a => a.nome.toLowerCase()))
    let added = 0, skipped = 0
    for (const row of rows) {
      const nome = String(row.Nome ?? '').trim()
      const descrizione = String(row.Descrizione ?? '').trim()
      if (!nome || !descrizione) continue
      if (existingNomi.has(nome.toLowerCase())) { skipped++; continue }
      await createAmbito({ nome, descrizione })
      added++
    }
    e.target.value = ''
    if (skipped > 0) {
      window.alert(`Import completato: ${added} aggiunti, ${skipped} saltati (già presenti).`)
    } else if (added > 0) {
      window.alert(`Import completato: ${added} ambiti aggiunti.`)
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
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="btn-secondary">
            <Download className="w-4 h-4" />
            Scarica template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            <Upload className="w-4 h-4" />
            Carica Ambiti da Excel
          </button>
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
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportFile} />
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
