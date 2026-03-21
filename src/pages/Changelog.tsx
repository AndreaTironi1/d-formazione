import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface Release {
  version: string
  date: string
  label?: string
  changes: { title: string; description: string }[]
}

const releases: Release[] = [
  {
    version: '0.4.4',
    date: '2026-03-21',
    changes: [
      {
        title: 'Report Dipendenti: date di inizio e fine corso',
        description:
          'Nella riga di ogni corso del Report Dipendenti, accanto alle ore compare ora anche il periodo del corso nel formato "gg/mm → gg/mm", così si vede subito quando si svolge.',
      },
      {
        title: 'Report Dipendenti: esporta scheda in PDF',
        description:
          'Ogni scheda dipendente ha ora un pulsante "Scarica PDF" che genera un file PDF con tutte le informazioni della scheda, inclusa la timeline Gantt. In fondo al PDF compare la data e ora di esportazione.',
      },
      {
        title: 'Report Mensile: esporta la tabella in PDF',
        description:
          'In cima al Report Mensile compare il pulsante "Scarica PDF". Il PDF generato riporta in testa mese, anno, CoE e Sede selezionati, quindi la tabella completa con dipendenti e giorni, e in fondo la data e ora di esportazione.',
      },
    ],
  },
  {
    version: '0.4.3',
    date: '2026-03-20',
    changes: [
      {
        title: 'Report Dipendenti: totale corsi e ore per ogni persona',
        description:
          'Nella scheda di ogni dipendente nel Report Dipendenti compaiono ora due contatori: il numero totale di corsi a cui è iscritto e il totale delle ore di formazione previste. I valori tengono conto di tutti i corsi indipendentemente dall\'anno visualizzato nel Gantt.',
      },
    ],
  },
  {
    version: '0.4.2',
    date: '2026-03-20',
    changes: [
      {
        title: 'Report Mensile: visibili solo i dipendenti con corsi nel mese',
        description:
          'Nel Report Mensile, la griglia ora mostra solo i dipendenti che hanno almeno un corso attivo nel mese e nell\'anno selezionati. In precedenza comparivano tutti i dipendenti, rendendo la lista difficile da leggere. Chi non ha corsi in quel periodo semplicemente non appare.',
      },
    ],
  },
  {
    version: '0.4.1',
    date: '2026-03-20',
    changes: [
      {
        title: 'Report Mensile',
        description:
          'Nuova pagina di report raggiungibile dal menu sotto "Report Dipendenti". Mostra una griglia con i dipendenti sulle righe e i giorni del mese sulle colonne: ogni cella colorata indica un corso attivo in quel giorno per quel dipendente. Il colore segue la priorità del corso. Cliccando su una cella si aprono i dettagli completi del corso. In alto si può scegliere mese e anno (di default il mese corrente), e filtrare per CoE e/o Sede per ridurre i dipendenti visualizzati.',
      },
    ],
  },
  {
    version: '0.4.0',
    date: '2026-03-20',
    changes: [
      {
        title: 'Iscrizione di più persone a un corso in un solo passaggio',
        description:
          'Nella pagina Iscrizioni, il modulo "Nuova Iscrizione" ora permette di selezionare un corso e poi spuntare più dipendenti dalla lista. Con un solo clic vengono create tutte le iscrizioni. Se qualcuno era già iscritto al corso, viene ignorato automaticamente senza errori, e a fine operazione compare un riepilogo di quante iscrizioni sono state create e quante erano già presenti.',
      },
    ],
  },
  {
    version: '0.3.9',
    date: '2026-03-18',
    changes: [
      {
        title: 'Menu rinominati: Anagrafiche → Dati, Dati → Utilità',
        description:
          'Le sezioni del menu laterale sono state rinominate per riflettere meglio il loro contenuto: la sezione con CoE, Sedi, Dipendenti ecc. si chiama ora "Dati", mentre la sezione con Importa ed Esporta si chiama "Utilità".',
      },
    ],
  },
  {
    version: '0.3.8',
    date: '2026-03-18',
    changes: [
      {
        title: 'Pagina Changelog',
        description:
          'Cliccando sul numero di versione in fondo al menu laterale si accede a questa pagina, che racconta tutte le novità dell\'applicazione in linguaggio semplice.',
      },
    ],
  },
  {
    version: '0.3.7',
    date: '2026-03-18',
    changes: [
      {
        title: 'Statistiche dashboard su riga unica',
        description:
          'I 6 contatori (CoE, Sedi, Dipendenti, Servizi, Corsi, Iscrizioni) sono ora affiancati su una sola riga per una lettura immediata.',
      },
    ],
  },
  {
    version: '0.3.6',
    date: '2026-03-18',
    changes: [
      {
        title: 'Anno selezionabile dal 2026 al 2030 nel Report Dipendenti',
        description:
          'Il selettore anno nel Report Dipendenti copre ora il periodo 2026–2030, in linea con l\'orizzonte del piano formativo.',
      },
    ],
  },
  {
    version: '0.3.5',
    date: '2026-03-18',
    changes: [
      {
        title: 'Contatore Servizi nell\'esportazione',
        description:
          'Il riepilogo nella pagina Esporta dati mostrava correttamente tutti i fogli tranne Servizi. Il contatore è stato aggiunto.',
      },
    ],
  },
  {
    version: '0.3.4',
    date: '2026-03-18',
    label: 'Rilascio principale',
    changes: [
      {
        title: 'Menu laterale organizzato in sezioni',
        description:
          'La barra di navigazione è ora divisa in tre sezioni collassabili: Report (Dashboard e Report Dipendenti), Anagrafiche (CoE, Sedi, Dipendenti, Servizi, Corsi, Iscrizioni) e Dati (Importa ed Esporta).',
      },
      {
        title: 'Dashboard — Responsabili CoE e Sede',
        description:
          'Due nuovi riquadri mostrano in un colpo d\'occhio chi è il responsabile di ogni CoE e di ogni Sede.',
      },
      {
        title: 'Pagina Esporta dati',
        description:
          'Con un singolo clic è ora possibile scaricare un file Excel con tutti i dati del piano formativo: un foglio per CoE, Sedi, Dipendenti, Servizi, Corsi e Iscrizioni.',
      },
      {
        title: 'Report Dipendenti',
        description:
          'Nuova pagina che mostra, per ogni dipendente, i corsi a cui è iscritto con un diagramma di Gantt per anno. È possibile filtrare per nome e selezionare l\'anno di riferimento.',
      },
    ],
  },
  {
    version: '0.3.3',
    date: '2026-03-18',
    changes: [
      {
        title: 'Niente doppioni nella selezione CoE e Sede',
        description:
          'Nell\'editor del dipendente non è più possibile selezionare lo stesso CoE o la stessa Sede due volte: le opzioni già scelte vengono escluse automaticamente.',
      },
    ],
  },
  {
    version: '0.3.2',
    date: '2026-03-18',
    changes: [
      {
        title: 'Editor multi-CoE e multi-Sede per i dipendenti',
        description:
          'La scheda dipendente ha ora una scheda "CoE & Sedi" che permette di assegnare più CoE e più Sedi con le relative percentuali di appartenenza.',
      },
    ],
  },
  {
    version: '0.3.1',
    date: '2026-03-18',
    changes: [
      {
        title: 'Supporto dipendenti su più sedi',
        description:
          'Introdotta la gestione dei dipendenti assegnati a più sedi geografiche con ripartizione percentuale (es. 50% Liguria, 50% Lombardia).',
      },
      {
        title: 'Versione visibile nella barra laterale',
        description:
          'Il numero di versione dell\'applicazione è ora visibile in fondo al menu, sopra il pulsante account.',
      },
    ],
  },
  {
    version: '0.3.0',
    date: '2026-03-18',
    changes: [
      {
        title: 'Scheda corso estesa',
        description:
          'Aggiunti 13 nuovi campi opzionali a ogni corso: owner, tutor, tipo di docenza, docenti (aula e onboarding), durata in ore, date di inizio e fine, modalità di erogazione, ore di onboarding, competenze e output tipici.',
      },
    ],
  },
]

export default function Changelog() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Changelog</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tutte le novità e le correzioni dell'applicazione Piano Formazione Dasein.
        </p>
      </div>

      {/* Releases */}
      <div className="space-y-6">
        {releases.map((r) => (
          <div key={r.version} className="card p-6 space-y-4">
            {/* Release header */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                v{r.version}
              </span>
              <span className="text-sm text-slate-400">{r.date}</span>
              {r.label && (
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {r.label}
                </span>
              )}
            </div>

            {/* Changes */}
            <ul className="space-y-3">
              {r.changes.map((c, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{c.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
