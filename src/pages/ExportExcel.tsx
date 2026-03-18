import * as XLSX from 'xlsx'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Download } from 'lucide-react'

type CoeWithResp = {
  _id: string
  idCoe: string
  nome: string
  responsabile: { nome: string } | null
}

type Sede = {
  _id: string
  idSede: string
  areaGeografica: string
}

type CoeMultiplo = {
  coe: { nome: string } | null
  percentuale?: number
}

type SedeMultipla = {
  sede: { areaGeografica: string } | null
  percentuale?: number
}

type Dipendente = {
  _id: string
  nome: string
  email?: string
  ruolo: string
  seniority?: string
  coe?: { nome: string } | null
  sede?: { areaGeografica: string } | null
  coeMultipli: CoeMultiplo[]
  sediMultiple: SedeMultipla[]
}

type Servizio = {
  _id: string
  nome: string
  coeId: string
}

type Corso = {
  _id: string
  idCorso: string
  titolo: string
  ambito?: string
  destinatari?: string
  oreAula?: number
  priorita?: number
  coe?: { nome: string } | null
}

type Iscrizione = {
  _id: string
  dipendente?: { nome: string } | null
  corso?: { titolo: string } | null
}

export default function ExportExcel() {
  const coeList = useQuery(api.coe.getAllWithResponsabili) as CoeWithResp[] | undefined
  const sediList = useQuery(api.sedi.getAll) as Sede[] | undefined
  const dipendenti = useQuery(api.dipendenti.getAllWithRelations) as Dipendente[] | undefined
  const servizi = useQuery(api.servizi.getAll) as Servizio[] | undefined
  const corsi = useQuery(api.corsi.getAllWithCoe) as Corso[] | undefined
  const iscrizioni = useQuery(api.iscrizioni.getAllWithRelations) as Iscrizione[] | undefined

  const isLoading =
    coeList === undefined ||
    sediList === undefined ||
    dipendenti === undefined ||
    servizi === undefined ||
    corsi === undefined ||
    iscrizioni === undefined

  const handleExport = () => {
    if (isLoading) return

    const wb = XLSX.utils.book_new()

    // Foglio CoE
    const coeData = coeList.map((c) => ({
      IdCoe: c.idCoe,
      Nome: c.nome,
      Responsabile: c.responsabile?.nome ?? '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coeData), 'CoE')

    // Foglio Sedi
    const sediData = sediList.map((s) => ({
      IdSede: s.idSede,
      'Area Geografica': s.areaGeografica,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sediData), 'Sedi')

    // Foglio Dipendenti
    const dipData = dipendenti.map((d) => {
      const coeLabel =
        d.coeMultipli && d.coeMultipli.length > 0
          ? d.coeMultipli.map((dc) => dc.coe?.nome ?? '').filter(Boolean).join(' | ')
          : d.coe?.nome ?? ''

      const sedeLabel =
        d.sediMultiple && d.sediMultiple.length > 1
          ? d.sediMultiple.map((ds) => ds.sede?.areaGeografica ?? '').filter(Boolean).join(' | ')
          : d.sede?.areaGeografica ?? ''

      return {
        Nome: d.nome,
        Email: d.email ?? '',
        Ruolo: d.ruolo,
        Seniority: d.seniority ?? '',
        CoE: coeLabel,
        Sede: sedeLabel,
      }
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dipData), 'Dipendenti')

    // Foglio Servizi
    const serviziData = servizi.map((s) => ({
      Nome: s.nome,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(serviziData), 'Servizi')

    // Foglio Corsi
    const corsiData = corsi.map((c) => ({
      IdCorso: c.idCorso,
      Titolo: c.titolo,
      Ambito: c.ambito ?? '',
      Destinatari: c.destinatari ?? '',
      'Ore Aula': c.oreAula ?? '',
      Priorità: c.priorita ?? '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(corsiData), 'Corsi')

    // Foglio Iscrizioni
    const iscrizioniData = iscrizioni.map((i) => ({
      Dipendente: i.dipendente?.nome ?? '',
      Corso: i.corso?.titolo ?? '',
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(iscrizioniData), 'Iscrizioni')

    XLSX.writeFile(wb, 'Piano_Formazione_Dasein_export.xlsx')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Esporta dati</h1>
        <p className="text-slate-500 text-sm mt-1">
          Scarica tutti i dati del piano di formazione in un file Excel.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-lg">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Download className="w-8 h-8 text-emerald-600" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Esporta tutto in Excel</h2>
            <p className="text-sm text-slate-500">
              Il file conterrà i fogli: <strong>CoE</strong>, <strong>Sedi</strong>,{' '}
              <strong>Dipendenti</strong>, <strong>Servizi</strong>, <strong>Corsi</strong> e{' '}
              <strong>Iscrizioni</strong>.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <svg
                className="animate-spin w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Caricamento dati in corso...
            </div>
          ) : (
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Scarica Excel
            </button>
          )}

          {!isLoading && (
            <p className="text-xs text-slate-400">
              {/* Quick summary */}
              {[
                `${coeList?.length ?? 0} CoE`,
                `${sediList?.length ?? 0} sedi`,
                `${dipendenti?.length ?? 0} dipendenti`,
                `${servizi?.length ?? 0} servizi`,
                `${corsi?.length ?? 0} corsi`,
                `${iscrizioni?.length ?? 0} iscrizioni`,
              ].join(' · ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
