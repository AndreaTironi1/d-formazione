import { useState, useRef } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface ParsedData {
  coe: Array<{ idCoe: string; nome: string }>
  sedi: Array<{ idSede: string; areaGeografica: string }>
  dipendenti: Array<{
    nome: string
    email?: string
    seniority?: string
    ruolo: string
    coeNome?: string
    sedeNome?: string
  }>
  servizi: Array<{ nome: string; coeNome: string }>
  corsi: Array<{
    idCorso: string
    titolo: string
    ambito: string
    destinatari: string
    oreAula?: number
    priorita: number
    coeNome?: string
  }>
}

type ImportStatus = 'idle' | 'parsing' | 'parsed' | 'importing' | 'done' | 'error'

export default function ImportExcel() {
  const { isSignedIn } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [importResult, setImportResult] = useState<Record<string, number> | null>(null)

  const seedAll = useMutation(api.seed.seedAll)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('parsing')
    setErrorMsg('')
    setParsedData(null)

    try {
      // Dynamically import xlsx to keep bundle lean
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      const parsed: ParsedData = {
        coe: [],
        sedi: [],
        dipendenti: [],
        servizi: [],
        corsi: [],
      }

      // Helper to read a sheet as array of objects
      const readSheet = (sheetName: string): Record<string, unknown>[] => {
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) return []
        return XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[]
      }

      // Parse CoE sheet
      const coeRows = readSheet('CoE')
      for (const row of coeRows) {
        const idCoe = String(row['ID CoE'] ?? row['ID_CoE'] ?? row['IDCoE'] ?? '').trim()
        const nome = String(row['Nome CoE'] ?? row['NomeCoE'] ?? row['nome'] ?? '').trim()
        if (idCoe && nome) {
          parsed.coe.push({ idCoe, nome })
        }
      }

      // Parse Sedi sheet
      const sediRows = readSheet('Sedi')
      for (const row of sediRows) {
        const idSede = String(row['ID Sede'] ?? row['ID_Sede'] ?? row['IDSede'] ?? '').trim()
        const areaGeografica = String(row['Area Geografica'] ?? row['AreaGeografica'] ?? '').trim()
        if (idSede && areaGeografica) {
          parsed.sedi.push({ idSede, areaGeografica })
        }
      }

      // Parse Responsabili CoE
      const respCoeRows = readSheet('Responsabili CoE')
      // Parse Responsabili Sede
      const respSedeRows = readSheet('Responsabili Sede')

      // Parse Dipendenti sheet
      const dipendentiRows = readSheet('Dipendenti')
      for (const row of dipendentiRows) {
        const nome = String(row['Nome'] ?? '').trim()
        if (!nome) continue
        parsed.dipendenti.push({
          nome,
          email: String(row['Email'] ?? '').trim() || undefined,
          seniority: String(row['Seniority'] ?? '').trim() || undefined,
          ruolo: String(row['Ruolo'] ?? 'Consulente').trim(),
          coeNome: String(row['CoE principale'] ?? row['CoE'] ?? '').trim() || undefined,
          sedeNome: String(row['Sede / Area Geografica'] ?? row['Sede'] ?? '').trim() || undefined,
        })
      }

      // Add Responsabili CoE as dipendenti
      for (const row of respCoeRows) {
        const nome = String(row['Nome Responsabile'] ?? row['Nome'] ?? '').trim()
        if (!nome) continue
        const exists = parsed.dipendenti.find((d) => d.nome === nome)
        if (!exists) {
          parsed.dipendenti.push({
            nome,
            email: String(row['Email'] ?? '').trim() || undefined,
            seniority: String(row['Seniority'] ?? '').trim() || undefined,
            ruolo: 'Responsabile CoE',
            coeNome: String(row['CoE'] ?? '').trim() || undefined,
          })
        }
      }

      // Add Responsabili Sede as dipendenti
      for (const row of respSedeRows) {
        const nome = String(row['Nome'] ?? '').trim()
        if (!nome) continue
        const exists = parsed.dipendenti.find((d) => d.nome === nome)
        if (!exists) {
          parsed.dipendenti.push({
            nome,
            email: String(row['Email'] ?? '').trim() || undefined,
            seniority: String(row['Seniority'] ?? '').trim() || undefined,
            ruolo: 'Responsabile Sede',
            coeNome: String(row['CoE di afferenza'] ?? '').trim() || undefined,
            sedeNome: String(row['Sede'] ?? '').trim() || undefined,
          })
        }
      }

      // Parse Servizi sheet
      const serviziRows = readSheet('Servizi')
      for (const row of serviziRows) {
        const nome = String(row['Nome Servizio'] ?? row['Servizio'] ?? '').trim()
        const coeNome = String(row['CoE'] ?? '').trim()
        if (nome && coeNome) {
          parsed.servizi.push({ nome, coeNome })
        }
      }

      // Parse Corsi sheet
      const corsiRows = readSheet('Corsi')
      for (const row of corsiRows) {
        const idCorso = String(row['ID Corso'] ?? row['IDCorso'] ?? '').trim()
        const titolo = String(row['Titolo Corso'] ?? row['Titolo'] ?? '').trim()
        if (!idCorso || !titolo) continue

        const oreRaw = row['Ore Aula'] ?? row['OreAula']
        const prioritaRaw = row['Priorità'] ?? row['Priorita'] ?? row['Priority']

        parsed.corsi.push({
          idCorso,
          titolo,
          ambito: String(row['CoE / Ambito'] ?? row['Ambito'] ?? row['CoE'] ?? '').trim(),
          destinatari: String(row['Destinatari'] ?? '').trim(),
          oreAula: oreRaw !== '' && oreRaw != null ? Number(oreRaw) : undefined,
          priorita: prioritaRaw !== '' && prioritaRaw != null ? Number(prioritaRaw) : 3,
          coeNome: String(row['CoE / Ambito'] ?? row['CoE'] ?? '').trim() || undefined,
        })
      }

      setParsedData(parsed)
      setStatus('parsed')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore durante il parsing del file.')
      setStatus('error')
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleImport = async () => {
    if (!parsedData || !isSignedIn) return

    setStatus('importing')
    try {
      const result = await seedAll({
        coe: parsedData.coe,
        sedi: parsedData.sedi,
        dipendenti: parsedData.dipendenti.map((d) => ({
          ...d,
          email: d.email ?? undefined,
          seniority: d.seniority ?? undefined,
          coeNome: d.coeNome ?? undefined,
          sedeNome: d.sedeNome ?? undefined,
        })),
        servizi: parsedData.servizi,
        corsi: parsedData.corsi.map((c) => ({
          ...c,
          oreAula: c.oreAula ?? undefined,
          coeNome: c.coeNome ?? undefined,
        })),
      })
      setImportResult(result as Record<string, number>)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore durante l\'importazione.')
      setStatus('error')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setParsedData(null)
    setErrorMsg('')
    setImportResult(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Importa dati Excel</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Carica il file Piano_Formazione_Dasein.xlsx per importare tutti i dati nel database.
        </p>
      </div>

      {/* Upload area */}
      {(status === 'idle' || status === 'parsing') && (
        <div
          className={`card p-10 text-center border-2 border-dashed transition-colors ${
            status === 'parsing'
              ? 'border-blue-300 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 cursor-pointer'
          }`}
          onClick={() => status === 'idle' && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          {status === 'parsing' ? (
            <div className="flex flex-col items-center gap-3 text-blue-600">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-medium">Parsing del file in corso...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <FileSpreadsheet className="w-12 h-12 text-slate-300" />
              <div>
                <p className="font-medium text-slate-700">Clicca per selezionare il file</p>
                <p className="text-sm mt-1">Supporta file .xlsx e .xls</p>
              </div>
              <div className="flex items-center gap-2 text-blue-600 mt-2">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Seleziona file</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview parsed data */}
      {status === 'parsed' && parsedData && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Dati trovati nel file
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'CoE', count: parsedData.coe.length },
                { label: 'Sedi', count: parsedData.sedi.length },
                { label: 'Dipendenti', count: parsedData.dipendenti.length },
                { label: 'Servizi', count: parsedData.servizi.length },
                { label: 'Corsi', count: parsedData.corsi.length },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg"
                >
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="font-bold text-slate-900 text-lg">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>Attenzione:</strong> L'importazione sovrascriverà tutti i dati esistenti nel database (CoE, Sedi, Dipendenti, Servizi, Corsi). Le iscrizioni verranno anch'esse azzerate.
          </div>

          <div className="flex gap-3">
            <button onClick={handleReset} className="btn-secondary flex-1">
              Annulla
            </button>
            <button onClick={handleImport} className="btn-primary flex-1">
              <Upload className="w-4 h-4" />
              Importa in Convex
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {status === 'importing' && (
        <div className="card p-10 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <div>
              <p className="font-semibold text-slate-900">Importazione in corso...</p>
              <p className="text-sm text-slate-500 mt-1">
                Inserimento dati nel database Convex. Attendere.
              </p>
            </div>
            {/* Progress bar (indeterminate) */}
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {/* Done */}
      {status === 'done' && importResult && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h2 className="font-semibold text-slate-900">Importazione completata!</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(importResult).map(([key, count]) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-4 py-3 bg-green-50 rounded-lg"
                >
                  <span className="text-sm text-slate-600 capitalize">{key}</span>
                  <span className="font-bold text-green-700 text-lg">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleReset} className="btn-secondary w-full">
            Importa un altro file
          </button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="space-y-4">
          <div className="card p-6 border-red-200">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Si è verificato un errore</p>
                <p className="text-sm mt-1 text-red-600">{errorMsg}</p>
              </div>
            </div>
          </div>
          <button onClick={handleReset} className="btn-secondary w-full">
            Riprova
          </button>
        </div>
      )}
    </div>
  )
}
