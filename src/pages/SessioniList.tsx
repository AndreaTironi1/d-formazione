import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import DataTable, { Column } from '../components/DataTable'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { cn } from '../lib/utils'

type GiornoErogazione = {
  data: string
  modalitaMattina?: 'TOJ' | 'Aula'
  mattinaInizio?: string
  mattinaFine?: string
  modalitaPomeriggio?: 'TOJ' | 'Aula'
  pomeriggioInizio?: string
  pomeriggioFine?: string
}

function validateOrariGiorno(g: GiornoErogazione): string | null {
  const { mattinaInizio, mattinaFine, pomeriggioInizio, pomeriggioFine } = g
  const allTimes = [mattinaInizio, mattinaFine, pomeriggioInizio, pomeriggioFine].filter(Boolean) as string[]
  for (const t of allTimes) {
    if (t < '08:00' || t > '19:00')
      return 'Gli orari devono essere compresi tra le 08:00 e le 19:00'
  }
  if (mattinaInizio && mattinaFine && mattinaFine <= mattinaInizio)
    return 'Fine mattina deve essere dopo inizio mattina'
  if (mattinaFine && pomeriggioInizio && pomeriggioInizio <= mattinaFine)
    return 'Inizio pomeriggio deve essere dopo fine mattina'
  if (pomeriggioInizio && pomeriggioFine && pomeriggioFine <= pomeriggioInizio)
    return 'Fine pomeriggio deve essere dopo inizio pomeriggio'
  return null
}

type SessioneRow = {
  _id: Id<'sessioni'>
  _creationTime: number
  corsoId: Id<'corsi'>
  tema: string
  dataInizio?: string
  dataFine?: string
  nomeDocenteAula?: string
  nomeDocenteOnboarding?: string
  note?: string
  giorniErogazione?: GiornoErogazione[]
  corso?: { _id: Id<'corsi'>; idCorso: string; titolo: string; priorita: number; destinatari: string } | null
  iscrizioniCount: number
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const emptyGiorno = (): GiornoErogazione => ({ data: '', modalitaMattina: 'Aula', mattinaInizio: '', mattinaFine: '', modalitaPomeriggio: 'Aula', pomeriggioInizio: '', pomeriggioFine: '' })

type FormData = {
  corsoId: string
  tema: string
  dataInizio: string
  dataFine: string
  nomeDocenteAula: string
  nomeDocenteOnboarding: string
  note: string
  giorniErogazione: GiornoErogazione[]
}

const emptyForm: FormData = {
  corsoId: '',
  tema: '',
  dataInizio: '',
  dataFine: '',
  nomeDocenteAula: '',
  nomeDocenteOnboarding: '',
  note: '',
  giorniErogazione: [],
}

function formFromRow(row: SessioneRow): FormData {
  return {
    corsoId: row.corsoId,
    tema: row.tema,
    dataInizio: row.dataInizio ?? '',
    dataFine: row.dataFine ?? '',
    nomeDocenteAula: row.nomeDocenteAula ?? '',
    nomeDocenteOnboarding: row.nomeDocenteOnboarding ?? '',
    note: row.note ?? '',
    giorniErogazione: row.giorniErogazione ? row.giorniErogazione.map(g => ({
      data: g.data,
      modalitaMattina: g.modalitaMattina ?? 'Aula',
      mattinaInizio: g.mattinaInizio ?? '',
      mattinaFine: g.mattinaFine ?? '',
      modalitaPomeriggio: g.modalitaPomeriggio ?? 'Aula',
      pomeriggioInizio: g.pomeriggioInizio ?? '',
      pomeriggioFine: g.pomeriggioFine ?? '',
    })) : [],
  }
}

export default function SessioniList() {
  const sessioni = useQuery(api.sessioni.getAllWithRelations) as SessioneRow[] | undefined
  const corsiList = useQuery(api.corsi.getAll)
  const ambitiList = useQuery(api.ambiti.getAll)
  const createSessione = useMutation(api.sessioni.create)
  const updateSessione = useMutation(api.sessioni.update)
  const removeSessione = useMutation(api.sessioni.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<SessioneRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<SessioneRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterTitolo, setFilterTitolo] = useState('')
  const [filterAmbitoId, setFilterAmbitoId] = useState('')
  const [filterDestinatari, setFilterDestinatari] = useState('')
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [giornoError, setGiornoError] = useState<string | null>(null)
  const [orariErrors, setOrariErrors] = useState<string[]>([])

  const set = (k: keyof Omit<FormData, 'giorniErogazione'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData((f) => ({ ...f, [k]: e.target.value }))

  const openCreate = () => {
    setEditItem(null)
    setFormData({ ...emptyForm })
    setGiornoError(null)
    setOrariErrors([])
    setModalOpen(true)
  }

  const openEdit = (item: SessioneRow) => {
    setEditItem(item)
    setFormData(formFromRow(item))
    setGiornoError(null)
    setOrariErrors([])
    setModalOpen(true)
  }

  // Giorni helpers
  const addGiorno = () => {
    setFormData((f) => ({ ...f, giorniErogazione: [...f.giorniErogazione, emptyGiorno()] }))
    setOrariErrors((e) => [...e, ''])
  }

  const removeGiorno = (idx: number) => {
    setFormData((f) => ({ ...f, giorniErogazione: f.giorniErogazione.filter((_, i) => i !== idx) }))
    setOrariErrors((e) => e.filter((_, i) => i !== idx))
  }

  const isOutOfRange = (data: string, f: FormData) =>
    !!f.dataInizio && !!f.dataFine && !!data &&
    (data < f.dataInizio || data > f.dataFine)

  const setGiorno = (idx: number, field: keyof GiornoErogazione, value: string) =>
    setFormData((f) => {
      const giorni = f.giorniErogazione.map((g, i) =>
        i === idx ? { ...g, [field]: value } : g
      )
      const updated = { ...f, giorniErogazione: giorni }
      const fuori = giorni.filter(g => g.data && isOutOfRange(g.data, updated))
      setGiornoError(fuori.length > 0
        ? `${fuori.length} giorno/i fuori dalla finestra ${updated.dataInizio} → ${updated.dataFine}`
        : null
      )
      setOrariErrors(giorni.map(g => validateOrariGiorno(g) ?? ''))
      return updated
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.corsoId || !formData.tema.trim()) return
    setIsSubmitting(true)
    try {
      // Validazione orari
      const erroriOrari = formData.giorniErogazione.map(g => validateOrariGiorno(g) ?? '')
      if (erroriOrari.some(e => e)) {
        setOrariErrors(erroriOrari)
        setIsSubmitting(false)
        return
      }

      const giorniClean = formData.giorniErogazione
        .filter(g => g.data)
        .sort((a, b) => a.data.localeCompare(b.data))
        .map(g => ({
          data: g.data,
          modalitaMattina: g.modalitaMattina || undefined,
          mattinaInizio: g.mattinaInizio || undefined,
          mattinaFine: g.mattinaFine || undefined,
          modalitaPomeriggio: g.modalitaPomeriggio || undefined,
          pomeriggioInizio: g.pomeriggioInizio || undefined,
          pomeriggioFine: g.pomeriggioFine || undefined,
        }))

      if (formData.dataInizio && formData.dataFine && giorniClean.length > 0) {
        const fuoriRange = giorniClean.filter(
          g => g.data < formData.dataInizio || g.data > formData.dataFine
        )
        if (fuoriRange.length > 0) {
          setGiornoError(
            `${fuoriRange.length} giorno/i fuori dalla finestra ${formData.dataInizio} → ${formData.dataFine}: ` +
            fuoriRange.map(g => g.data).join(', ')
          )
          setIsSubmitting(false)
          return
        }
      }
      setGiornoError(null)

      const payload = {
        corsoId: formData.corsoId as Id<'corsi'>,
        tema: formData.tema.trim(),
        dataInizio: formData.dataInizio || undefined,
        dataFine: formData.dataFine || undefined,
        nomeDocenteAula: formData.nomeDocenteAula.trim() || undefined,
        nomeDocenteOnboarding: formData.nomeDocenteOnboarding.trim() || undefined,
        note: formData.note.trim() || undefined,
        giorniErogazione: giorniClean.length > 0 ? giorniClean : undefined,
      }

      if (editItem) {
        await updateSessione({ id: editItem._id, ...payload })
      } else {
        await createSessione(payload)
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
      await removeSessione({ id: deleteItem._id })
      setDeleteItem(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const destinatariOptions = [...new Set((corsiList ?? []).map(c => c.destinatari).filter(Boolean))].sort() as string[]

  const hasActiveFilters = filterTitolo !== '' || filterAmbitoId !== '' || filterDestinatari !== ''

  const filteredCorsiIds = new Set(
    (corsiList ?? [])
      .filter(c =>
        (filterTitolo === '' || c.titolo.toLowerCase().includes(filterTitolo.toLowerCase())) &&
        (filterAmbitoId === '' || c.ambitoId === filterAmbitoId) &&
        (filterDestinatari === '' || c.destinatari === filterDestinatari)
      )
      .map(c => c._id)
  )

  const filtered = (sessioni ?? [])
    .filter(s => !hasActiveFilters || filteredCorsiIds.has(s.corsoId))
    .map(s => ({
      ...s,
      corsoTitolo: s.corso?.titolo ?? '',
      corsoIdCorso: s.corso?.idCorso ?? '',
    }))

  const columns: Column<SessioneRow>[] = [
    {
      key: 'corso',
      label: 'Corso',
      sortable: true,
      render: (row) => row.corso ? (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit">{row.corso.idCorso}</span>
          <span className="text-sm text-slate-700">{row.corso.titolo}</span>
        </div>
      ) : <span className="text-slate-400">—</span>,
    },
    {
      key: 'tema',
      label: 'Tema',
      sortable: true,
      render: (row) => <span className="font-medium text-slate-800">{row.tema}</span>,
    },
    {
      key: 'giorniErogazione',
      label: 'Giorni sessione',
      render: (row) => {
        const giorni = row.giorniErogazione ?? []
        if (giorni.length === 0)
          return <span className="text-xs font-medium text-amber-600">Giorni mancanti</span>
        return (
          <div className="flex flex-col gap-0.5">
            {giorni.map((g) => (
              <span key={g.data} className="text-xs text-slate-600">{formatDate(g.data)}</span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'nomeDocenteAula',
      label: 'Docente aula',
      render: (row) => (
        <span className="text-sm text-slate-600">{row.nomeDocenteAula || <span className="text-slate-400">—</span>}</span>
      ),
    },
    {
      key: 'iscrizioniCount',
      label: 'Iscritti',
      render: (row) => (
        <span className={cn(
          'px-2 py-0.5 rounded-full text-xs font-semibold',
          row.iscrizioniCount > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        )}>
          {row.iscrizioniCount}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sessioni</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} sessioni{hasActiveFilters ? ' (filtrate)' : ' totali'}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuova Sessione
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          className="input-field w-52"
          placeholder="Filtra per titolo..."
          value={filterTitolo}
          onChange={(e) => setFilterTitolo(e.target.value)}
        />
        <select
          className="input-field w-44"
          value={filterAmbitoId}
          onChange={(e) => setFilterAmbitoId(e.target.value)}
        >
          <option value="">Tutti gli ambiti</option>
          {ambitiList?.map((a) => (
            <option key={a._id} value={a._id}>{a.nome}</option>
          ))}
        </select>
        <select
          className="input-field w-40"
          value={filterDestinatari}
          onChange={(e) => setFilterDestinatari(e.target.value)}
        >
          <option value="">Tutti i destinatari</option>
          {destinatariOptions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => { setFilterTitolo(''); setFilterAmbitoId(''); setFilterDestinatari('') }}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Azzera filtri
          </button>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Cerca per tema, corso, docente..."
        searchKeys={['tema', 'corsoTitolo', 'corsoIdCorso', 'nomeDocenteAula', 'nomeDocenteOnboarding']}
        emptyMessage="Nessuna sessione trovata."
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

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Modifica Sessione' : 'Nuova Sessione'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Info sessione ─────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Corso <span className="text-red-500">*</span>
            </label>
            <select
              className="input-field"
              value={formData.corsoId}
              onChange={set('corsoId')}
              required
            >
              <option value="">— Seleziona corso —</option>
              {corsiList?.map((c) => (
                <option key={c._id} value={c._id}>[{c.idCorso}] {c.titolo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tema della sessione <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.tema}
              onChange={set('tema')}
              placeholder="es. Prompting avanzato"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data inizio (finestra)</label>
              <input type="date" className="input-field" value={formData.dataInizio} onChange={set('dataInizio')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data fine (finestra)</label>
              <input type="date" className="input-field" value={formData.dataFine} onChange={set('dataFine')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Docente/i aula</label>
              <input
                type="text"
                className="input-field"
                value={formData.nomeDocenteAula}
                onChange={set('nomeDocenteAula')}
                placeholder="Da individuare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Docente/i onboarding</label>
              <input
                type="text"
                className="input-field"
                value={formData.nomeDocenteOnboarding}
                onChange={set('nomeDocenteOnboarding')}
                placeholder="Da individuare"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Note</label>
            <textarea
              rows={2}
              className="input-field resize-none"
              value={formData.note}
              onChange={set('note')}
              placeholder="Eventuali note aggiuntive..."
            />
          </div>

          {/* ── Giorni di erogazione ──────────────────────────────── */}
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Giorni di erogazione
                {formData.giorniErogazione.length > 0 && (
                  <span className="ml-2 bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-semibold">
                    {formData.giorniErogazione.length}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={addGiorno}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Aggiungi giorno
              </button>
            </div>

            {formData.dataInizio && formData.dataFine && (
              <p className="text-xs text-indigo-600 font-medium">
                Devono essere tra {formData.dataInizio} e {formData.dataFine}.
              </p>
            )}

            {giornoError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {giornoError}
              </p>
            )}

            {formData.giorniErogazione.length === 0 && (
              <p className="text-sm text-slate-400 italic py-1">Nessun giorno aggiunto.</p>
            )}

            {formData.giorniErogazione.map((g, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className={cn('input-field flex-1 min-w-0', isOutOfRange(g.data, formData) && 'border-red-400 ring-1 ring-red-200')}
                    value={g.data}
                    onChange={(e) => setGiorno(idx, 'data', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeGiorno(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Mattina */}
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xs text-slate-500 font-medium w-20 shrink-0">Mattina</span>
                  <select
                    className="input-field w-20 shrink-0"
                    value={g.modalitaMattina ?? 'Aula'}
                    onChange={(e) => setGiorno(idx, 'modalitaMattina', e.target.value)}
                  >
                    <option value="Aula">Aula</option>
                    <option value="TOJ">TOJ</option>
                  </select>
                  <input type="time" min="08:00" max="19:00" className="input-field flex-1 min-w-0" value={g.mattinaInizio ?? ''} onChange={(e) => setGiorno(idx, 'mattinaInizio', e.target.value)} />
                  <span className="text-slate-400 text-xs shrink-0">→</span>
                  <input type="time" min="08:00" max="19:00" className="input-field flex-1 min-w-0" value={g.mattinaFine ?? ''} onChange={(e) => setGiorno(idx, 'mattinaFine', e.target.value)} />
                </div>
                {/* Pomeriggio */}
                <div className="flex items-center gap-2 pl-1">
                  <span className="text-xs text-slate-500 font-medium w-20 shrink-0">Pomeriggio</span>
                  <select
                    className="input-field w-20 shrink-0"
                    value={g.modalitaPomeriggio ?? 'Aula'}
                    onChange={(e) => setGiorno(idx, 'modalitaPomeriggio', e.target.value)}
                  >
                    <option value="Aula">Aula</option>
                    <option value="TOJ">TOJ</option>
                  </select>
                  <input type="time" min="08:00" max="19:00" className="input-field flex-1 min-w-0" value={g.pomeriggioInizio ?? ''} onChange={(e) => setGiorno(idx, 'pomeriggioInizio', e.target.value)} />
                  <span className="text-slate-400 text-xs shrink-0">→</span>
                  <input type="time" min="08:00" max="19:00" className="input-field flex-1 min-w-0" value={g.pomeriggioFine ?? ''} onChange={(e) => setGiorno(idx, 'pomeriggioFine', e.target.value)} />
                </div>
                {orariErrors[idx] && (
                  <p className="text-xs text-red-600 pl-1">{orariErrors[idx]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1" disabled={isSubmitting}>
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
        message={`Vuoi eliminare la sessione "${deleteItem?.tema}"? Verranno eliminate anche le iscrizioni associate.`}
        isLoading={isSubmitting}
      />
    </div>
  )
}
