import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Plus, Pencil, Trash2, CalendarDays, X } from 'lucide-react'
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
  const [searchParams] = useSearchParams()
  const preCorsoId = searchParams.get('corsoId') ?? ''

  const sessioni = useQuery(api.sessioni.getAllWithRelations) as SessioneRow[] | undefined
  const corsiList = useQuery(api.corsi.getAll)
  const createSessione = useMutation(api.sessioni.create)
  const updateSessione = useMutation(api.sessioni.update)
  const removeSessione = useMutation(api.sessioni.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<SessioneRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<SessioneRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'giorni'>('info')
  const [filterCorsoId, setFilterCorsoId] = useState<string>(preCorsoId)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [giornoError, setGiornoError] = useState<string | null>(null)
  const [orariErrors, setOrariErrors] = useState<string[]>([])

  const set = (k: keyof Omit<FormData, 'giorniErogazione'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFormData((f) => ({ ...f, [k]: e.target.value }))

  const openCreate = () => {
    setEditItem(null)
    setFormData({ ...emptyForm, corsoId: filterCorsoId })
    setActiveTab('info')
    setGiornoError(null)
    setOrariErrors([])
    setModalOpen(true)
  }

  const openEdit = (item: SessioneRow) => {
    setEditItem(item)
    setFormData(formFromRow(item))
    setActiveTab('info')
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
    if (!formData.corsoId || !formData.tema.trim()) {
      setActiveTab('info')
      return
    }
    setIsSubmitting(true)
    try {
      // Validazione orari
      const erroriOrari = formData.giorniErogazione.map(g => validateOrariGiorno(g) ?? '')
      if (erroriOrari.some(e => e)) {
        setOrariErrors(erroriOrari)
        setIsSubmitting(false)
        setActiveTab('giorni')
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
          setActiveTab('giorni')
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

  const filtered = (sessioni ?? [])
    .filter(s => filterCorsoId ? s.corsoId === filterCorsoId : true)
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
      key: 'dataInizio',
      label: 'Finestra date',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {formatDate(row.dataInizio)} → {formatDate(row.dataFine)}
        </span>
      ),
    },
    {
      key: 'giorniErogazione',
      label: 'Giorni erogazione',
      render: (row) => {
        const n = row.giorniErogazione?.length ?? 0
        return n > 0 ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
            {n} {n === 1 ? 'giorno' : 'giorni'}
          </span>
        ) : <span className="text-slate-400 text-xs">—</span>
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
          <p className="text-slate-500 text-sm mt-1">{filtered.length} sessioni{filterCorsoId ? ' (filtrate)' : ' totali'}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuova Sessione
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <select
            className="input-field"
            value={filterCorsoId}
            onChange={(e) => setFilterCorsoId(e.target.value)}
          >
            <option value="">— Tutti i corsi —</option>
            {corsiList?.map((c) => (
              <option key={c._id} value={c._id}>[{c.idCorso}] {c.titolo}</option>
            ))}
          </select>
        </div>
        {filterCorsoId && (
          <button
            onClick={() => setFilterCorsoId('')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Rimuovi filtro
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
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-5 -mt-2">
          {(['info', 'giorni'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab === 'info' ? 'Info sessione' : (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Giorni erogazione
                  {formData.giorniErogazione.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 text-xs font-semibold">
                      {formData.giorniErogazione.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'info' && (
            <>
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
            </>
          )}

          {activeTab === 'giorni' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Aggiungi i giorni effettivi di erogazione con modalità e orari.
                {formData.dataInizio && formData.dataFine && (
                  <span className="ml-1 text-indigo-600 font-medium">
                    Devono essere tra {formData.dataInizio} e {formData.dataFine}.
                  </span>
                )}
              </p>
              {giornoError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {giornoError}
                </p>
              )}
              {formData.giorniErogazione.length === 0 && (
                <p className="text-sm text-slate-400 italic py-2">Nessun giorno aggiunto.</p>
              )}
              {formData.giorniErogazione.map((g, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                  {/* Riga data + rimuovi */}
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
                    <input
                      type="time"
                      className="input-field flex-1 min-w-0"
                      value={g.mattinaInizio ?? ''}
                      onChange={(e) => setGiorno(idx, 'mattinaInizio', e.target.value)}
                    />
                    <span className="text-slate-400 text-xs shrink-0">→</span>
                    <input
                      type="time"
                      className="input-field flex-1 min-w-0"
                      value={g.mattinaFine ?? ''}
                      onChange={(e) => setGiorno(idx, 'mattinaFine', e.target.value)}
                    />
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
                    <input
                      type="time"
                      className="input-field flex-1 min-w-0"
                      value={g.pomeriggioInizio ?? ''}
                      onChange={(e) => setGiorno(idx, 'pomeriggioInizio', e.target.value)}
                    />
                    <span className="text-slate-400 text-xs shrink-0">→</span>
                    <input
                      type="time"
                      className="input-field flex-1 min-w-0"
                      value={g.pomeriggioFine ?? ''}
                      onChange={(e) => setGiorno(idx, 'pomeriggioFine', e.target.value)}
                    />
                  </div>
                  {/* Errore orari */}
                  {orariErrors[idx] && (
                    <p className="text-xs text-red-600 pl-1">{orariErrors[idx]}</p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addGiorno}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4" />
                Aggiungi giorno
              </button>
            </div>
          )}

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
