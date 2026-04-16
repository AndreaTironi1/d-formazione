import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, Download, Upload } from 'lucide-react'
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
  isNazionale?: boolean
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet([{ IdSede: 'SEDE-01', 'Area Geografica': 'Nord' }])
    XLSX.utils.book_append_sheet(wb, ws, 'Sedi')
    XLSX.writeFile(wb, 'template_sedi.xlsx')
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const XLSXdyn = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSXdyn.read(buffer, { type: 'array' })
    const ws = wb.Sheets['Sedi'] ?? wb.Sheets[wb.SheetNames[0]]
    const rows = XLSXdyn.utils.sheet_to_json<{ IdSede: string; 'Area Geografica': string }>(ws)
    const existingIds = new Set((sediList ?? []).map(s => s.idSede.toLowerCase()))
    let added = 0, skipped = 0
    for (const row of rows) {
      const idSede = String(row.IdSede ?? '').trim()
      const areaGeografica = String(row['Area Geografica'] ?? '').trim()
      if (!idSede || !areaGeografica) continue
      if (existingIds.has(idSede.toLowerCase())) { skipped++; continue }
      await createSede({ idSede, areaGeografica })
      added++
    }
    e.target.value = ''
    if (skipped > 0) {
      window.alert(`Import completato: ${added} aggiunti, ${skipped} saltati (già presenti).`)
    } else if (added > 0) {
      window.alert(`Import completato: ${added} sedi aggiunte.`)
    }
  }

  const [formData, setFormData] = useState({
    idSede: '',
    areaGeografica: '',
    responsabileId: '' as string,
    isNazionale: false,
  })

  const openCreate = () => {
    setEditItem(null)
    setFormData({ idSede: '', areaGeografica: '', responsabileId: '', isNazionale: false })
    setModalOpen(true)
  }

  const openEdit = (item: SedeRow) => {
    setEditItem(item)
    setFormData({
      idSede: item.idSede,
      areaGeografica: item.areaGeografica,
      responsabileId: item.responsabileId ?? '',
      isNazionale: item.isNazionale ?? false,
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
        isNazionale: formData.isNazionale || undefined,
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
    {
      key: 'areaGeografica',
      label: 'Area Geografica',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.areaGeografica}</span>
          {row.isNazionale && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">
              Nazionale
            </span>
          )}
        </div>
      ),
    },
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
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="btn-secondary">
            <Download className="w-4 h-4" />
            Scarica template
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary">
            <Upload className="w-4 h-4" />
            Carica Sedi da Excel
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nuova Sede
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportFile} />
        </div>
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

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNazionale}
                onChange={(e) => setFormData((f) => ({ ...f, isNazionale: e.target.checked }))}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="text-sm text-slate-700">Sede Nazionale (copre tutta Italia)</span>
            </label>
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
