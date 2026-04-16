import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, Download, Upload } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type CoeRow = {
  _id: Id<'coe'>
  _creationTime: number
  idCoe: string
  nome: string
  responsabileId?: Id<'dipendenti'>
  responsabile?: { nome: string } | null
}

export default function CoeList() {
  const coeList = useQuery(api.coe.getAllWithResponsabili) as CoeRow[] | undefined
  const dipendenti = useQuery(api.dipendenti.getAll)
  const createCoe = useMutation(api.coe.create)
  const updateCoe = useMutation(api.coe.update)
  const removeCoe = useMutation(api.coe.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<CoeRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<CoeRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    idCoe: '',
    nome: '',
    responsabileId: '' as string,
  })

  const openCreate = () => {
    setEditItem(null)
    setFormData({ idCoe: '', nome: '', responsabileId: '' })
    setModalOpen(true)
  }

  const openEdit = (item: CoeRow) => {
    setEditItem(item)
    setFormData({
      idCoe: item.idCoe,
      nome: item.nome,
      responsabileId: item.responsabileId ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.idCoe.trim() || !formData.nome.trim()) return

    setIsSubmitting(true)
    try {
      const payload = {
        idCoe: formData.idCoe.trim(),
        nome: formData.nome.trim(),
        responsabileId: formData.responsabileId
          ? (formData.responsabileId as Id<'dipendenti'>)
          : undefined,
      }
      if (editItem) {
        await updateCoe({ id: editItem._id, ...payload })
      } else {
        await createCoe(payload)
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
      await removeCoe({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([{ IdCoe: 'COE-01', Nome: 'Esempio CoE' }])
    XLSX.utils.book_append_sheet(wb, ws, 'CoE')
    XLSX.writeFile(wb, 'template_coe.xlsx')
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const XLSXdyn = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSXdyn.read(buffer, { type: 'array' })
    const ws = wb.Sheets['CoE'] ?? wb.Sheets[wb.SheetNames[0]]
    const rows = XLSXdyn.utils.sheet_to_json<{ IdCoe: string; Nome: string }>(ws)
    const existingIds = new Set((coeList ?? []).map(c => c.idCoe.toLowerCase()))
    let added = 0, skipped = 0
    for (const row of rows) {
      const idCoe = String(row.IdCoe ?? '').trim()
      const nome = String(row.Nome ?? '').trim()
      if (!idCoe || !nome) continue
      if (existingIds.has(idCoe.toLowerCase())) { skipped++; continue }
      await createCoe({ idCoe, nome })
      added++
    }
    e.target.value = ''
    if (skipped > 0) {
      window.alert(`Import completato: ${added} aggiunti, ${skipped} saltati (già presenti).`)
    } else if (added > 0) {
      window.alert(`Import completato: ${added} CoE aggiunti.`)
    }
  }

  const columns: Column<CoeRow>[] = [
    { key: 'idCoe', label: 'ID CoE', sortable: true },
    { key: 'nome', label: 'Nome CoE', sortable: true },
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
          <h1 className="text-2xl font-bold text-slate-900">CoE</h1>
          <p className="text-slate-500 text-sm mt-1">Centri di Eccellenza</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="btn-secondary">
            <Download className="w-4 h-4" />
            Scarica template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            <Upload className="w-4 h-4" />
            Carica CoE da Excel
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nuovo CoE
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={handleImportFile}
          />
        </div>
      </div>

      <DataTable
        data={coeList ?? []}
        columns={columns}
        searchPlaceholder="Cerca per nome o ID..."
        searchKeys={['idCoe', 'nome']}
        emptyMessage="Nessun CoE trovato. Importa i dati o crea un nuovo CoE."
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
        title={editItem ? 'Modifica CoE' : 'Nuovo CoE'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ID CoE <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.idCoe}
              onChange={(e) => setFormData((f) => ({ ...f, idCoe: e.target.value }))}
              placeholder="es. COE-01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.nome}
              onChange={(e) => setFormData((f) => ({ ...f, nome: e.target.value }))}
              placeholder="es. CoE P&C"
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

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        message={`Vuoi eliminare il CoE "${deleteItem?.nome}"? Questa azione non può essere annullata.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
