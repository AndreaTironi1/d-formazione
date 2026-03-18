import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'

type IscrizioneRow = {
  _id: Id<'iscrizioni'>
  _creationTime: number
  dipendenteId: Id<'dipendenti'>
  corsoId: Id<'corsi'>
  dipendente?: { nome: string; seniority?: string } | null
  corso?: { titolo: string; priorita: number; idCorso: string } | null
}

const PRIORITA_COLORS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
}

export default function IscrizioniList() {
  const iscrizioni = useQuery(api.iscrizioni.getAllWithRelations) as IscrizioneRow[] | undefined
  const dipendenti = useQuery(api.dipendenti.getAll)
  const corsi = useQuery(api.corsi.getAll)
  const createIscrizione = useMutation(api.iscrizioni.create)
  const removeIscrizione = useMutation(api.iscrizioni.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<IscrizioneRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [filterDipendente, setFilterDipendente] = useState('')
  const [filterCorso, setFilterCorso] = useState('')
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    dipendenteId: '',
    corsoId: '',
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.dipendenteId || !formData.corsoId) return

    setIsSubmitting(true)
    try {
      await createIscrizione({
        dipendenteId: formData.dipendenteId as Id<'dipendenti'>,
        corsoId: formData.corsoId as Id<'corsi'>,
      })
      setModalOpen(false)
      setFormData({ dipendenteId: '', corsoId: '' })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Errore durante la creazione dell\'iscrizione.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    setIsSubmitting(true)
    try {
      await removeIscrizione({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = useMemo(() => {
    let data = iscrizioni ?? []
    if (search.trim()) {
      const q = search.toLowerCase()
      data = data.filter(
        (i) =>
          i.dipendente?.nome.toLowerCase().includes(q) ||
          i.corso?.titolo.toLowerCase().includes(q) ||
          i.corso?.idCorso.toLowerCase().includes(q)
      )
    }
    if (filterDipendente) {
      data = data.filter((i) => i.dipendenteId === filterDipendente)
    }
    if (filterCorso) {
      data = data.filter((i) => i.corsoId === filterCorso)
    }
    return data
  }, [iscrizioni, search, filterDipendente, filterCorso])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Iscrizioni</h1>
          <p className="text-slate-500 text-sm mt-1">
            {iscrizioni?.length ?? '...'} iscrizioni totali
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuova Iscrizione
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cerca dipendente o corso..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <select
            className="input-field"
            value={filterDipendente}
            onChange={(e) => setFilterDipendente(e.target.value)}
          >
            <option value="">Tutti i dipendenti</option>
            {dipendenti?.map((d) => (
              <option key={d._id} value={d._id}>{d.nome}</option>
            ))}
          </select>

          <select
            className="input-field"
            value={filterCorso}
            onChange={(e) => setFilterCorso(e.target.value)}
          >
            <option value="">Tutti i corsi</option>
            {corsi?.map((c) => (
              <option key={c._id} value={c._id}>{c.titolo}</option>
            ))}
          </select>
        </div>

        {(search || filterDipendente || filterCorso) && (
          <button
            onClick={() => { setSearch(''); setFilterDipendente(''); setFilterCorso('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            Rimuovi filtri
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Dipendente</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Seniority</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">ID Corso</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Titolo Corso</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Priorità</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Nessuna iscrizione trovata.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr
                    key={row._id}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      idx % 2 === 0 ? '' : 'bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {row.dipendente?.nome ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.dipendente?.seniority ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {row.corso?.idCorso ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.corso?.titolo ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {row.corso ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            PRIORITA_COLORS[row.corso.priorita] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          P{row.corso.priorita}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDeleteItem(row)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Rimuovi iscrizione"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} di {iscrizioni?.length ?? 0} iscrizioni
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nuova Iscrizione"
        size="sm"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Dipendente <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.dipendenteId}
              onChange={(e) => setFormData((f) => ({ ...f, dipendenteId: e.target.value }))}
              required
            >
              <option value="">— Seleziona dipendente —</option>
              {dipendenti?.map((d) => (
                <option key={d._id} value={d._id}>{d.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Corso <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.corsoId}
              onChange={(e) => setFormData((f) => ({ ...f, corsoId: e.target.value }))}
              required
            >
              <option value="">— Seleziona corso —</option>
              {corsi?.map((c) => (
                <option key={c._id} value={c._id}>
                  [{c.idCorso}] {c.titolo}
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
              {isSubmitting ? 'Creazione...' : 'Crea Iscrizione'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        message={`Vuoi rimuovere l'iscrizione di "${deleteItem?.dipendente?.nome}" al corso "${deleteItem?.corso?.titolo}"?`}
        confirmLabel="Rimuovi"
        isLoading={isSubmitting}
      />
    </div>
  )
}
