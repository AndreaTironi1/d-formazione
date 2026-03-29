import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { AlertTriangle, Trash2 } from 'lucide-react'

const CONFERMA_TESTO = 'Si voglio davvero'

export default function CancellazioneDB() {
  const clearAll = useMutation(api.seed.clearAll)

  const [step, setStep] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Record<string, number> | null>(null)

  const confermaValida = input.trim() === CONFERMA_TESTO

  const handleAvvia = () => {
    setInput('')
    setStep('confirm')
  }

  const handleAnnulla = () => {
    setInput('')
    setStep('idle')
  }

  const handleCancella = async () => {
    if (!confermaValida) return
    setStep('loading')
    try {
      const res = await clearAll({})
      setResult(res as Record<string, number>)
      setStep('done')
    } catch {
      setStep('idle')
      alert('Errore durante la cancellazione.')
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cancella tutti i dati</h1>
        <p className="text-slate-500 text-sm mt-1">
          Elimina permanentemente tutti i record dal database.
        </p>
      </div>

      {step === 'idle' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 space-y-1">
              <p className="font-semibold">Attenzione: operazione irreversibile</p>
              <p>Verranno cancellati tutti i dati: CoE, Sedi, Dipendenti, Servizi, Corsi, Sessioni e Iscrizioni. Questa azione non può essere annullata.</p>
            </div>
          </div>
          <button
            onClick={handleAvvia}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Cancella tutti i dati
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700">Vuoi davvero cancellare tutti i dati?</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Digita <span className="font-mono font-bold text-red-600">{CONFERMA_TESTO}</span> per confermare
            </label>
            <input
              type="text"
              className="input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFERMA_TESTO}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAnnulla}
              className="btn-secondary flex-1"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleCancella}
              disabled={!confermaValida}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Conferma cancellazione
            </button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="card p-6 flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          Cancellazione in corso...
        </div>
      )}

      {step === 'done' && result && (
        <div className="card p-6 space-y-4">
          <p className="font-semibold text-green-700">Database svuotato con successo.</p>
          <table className="text-sm w-full">
            <tbody>
              {Object.entries(result).map(([tabella, n]) => (
                <tr key={tabella} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 text-slate-600 capitalize">{tabella}</td>
                  <td className="py-1.5 text-right font-medium text-slate-800">{n} eliminati</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => { setStep('idle'); setResult(null) }}
            className="btn-secondary w-full"
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  )
}
